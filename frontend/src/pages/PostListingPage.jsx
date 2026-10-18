import { ImagePlus, Loader2, Star, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { mediaUrl } from '../api/client'
import { createProperty, fetchProperty, updateProperty, uploadPhoto } from '../api/properties'
import DealToggle from '../components/DealToggle'
import LocationPicker from '../components/LocationPicker'
import PageLoader from '../components/PageLoader'
import { useAuth } from '../context/AuthContext'
import { useDeal } from '../context/DealContext'
import { useLanguage } from '../context/LanguageContext'
import { CITIES } from '../i18n/translations'
import { formatKeyMoney, homeTypesFor, NO_LAND_SIZE_TYPES, RENT_ONLY_TYPES, STORIES_LABELS } from '../utils/format'

const MAX_PHOTOS = 20
// Property types whose listings must give the floor area (matches the backend).
const SQFT_REQUIRED = ['shop', 'commercial']

const EMPTY = {
  status: 'for_rent',
  home_type: 'house',
  price: '',
  key_money_months: '0',
  advance_amount: '',
  furnishing: 'unfurnished',
  beds: '1',
  baths: '1',
  shared_bathroom: false,
  sqft: '',
  land_size: '',
  land_unit: 'perch',
  stories: '1',
  parking_slots: '0',
  address: '',
  city: '',
  zip_code: '',
  description: '',
  contact_name: '',
  contact_phone: '',
}

/** Create (/post) or edit (/post/:id/edit) a listing as its owner. */
export default function PostListingPage() {
  const { id } = useParams()
  const editing = Boolean(id)
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useLanguage()
  const { deal } = useDeal()

  // Phone accounts have the number as their username: offer it as the contact number.
  const signedUpWithPhone = /^\+\d+$/.test(user?.username ?? '')
  const [values, setValues] = useState(() => ({
    ...EMPTY,
    status: deal, // a new listing starts on whatever the visitor was browsing
    contact_name: signedUpWithPhone ? '' : (user?.username?.split('@')[0] ?? ''),
    contact_phone: signedUpWithPhone ? user.username : '',
  }))
  const [location, setLocation] = useState(null)
  const [mapFocus, setMapFocus] = useState(null)
  // Each photo: { key, url } once uploaded, or { key, uploading: true } while it goes up.
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(editing)
  const [forbidden, setForbidden] = useState(false)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)
  const fileInput = useRef(null)
  const nextKey = useRef(0)

  useEffect(() => {
    if (!editing) return
    fetchProperty(id)
      .then((p) => {
        if (!p.can_edit) {
          setForbidden(true)
          return
        }
        const asText = (v) => (v === null || v === undefined ? '' : String(v))
        setValues({
          ...Object.fromEntries(Object.keys(EMPTY).map((k) => [k, asText(p[k])])),
          shared_bathroom: Boolean(p.shared_bathroom),
        })
        setLocation({ lat: p.latitude, lng: p.longitude })
        const gallery = p.images?.length ? p.images.map((img) => img.image_url) : [p.primary_image_url]
        setPhotos(gallery.map((url) => ({ key: nextKey.current++, url })))
      })
      .catch(() => setForbidden(true))
      .finally(() => setLoading(false))
  }, [editing, id])

  function set(field, value) {
    setValues((v) => ({ ...v, [field]: value }))
    setErrors((e) => ({ ...e, [field]: undefined }))
  }

  function chooseDeal(status) {
    set('status', status)
    // Annexes and upper floor houses can't be sold.
    if (status === 'for_sale' && RENT_ONLY_TYPES.includes(values.home_type)) set('home_type', 'house')
  }

  function chooseCity(name) {
    set('city', name)
    const city = CITIES.find((c) => c.name.toLowerCase() === name.trim().toLowerCase())
    // Jump the map to the city so the owner only has to fine-tune the pin.
    if (city && !location) setMapFocus({ lat: city.lat, lng: city.lng, zoom: 13 })
  }

  async function addFiles(fileList) {
    const files = [...fileList].slice(0, MAX_PHOTOS - photos.length)
    if (fileList.length > files.length) setFormError(t('post.maxPhotos'))
    setErrors((e) => ({ ...e, photos: undefined }))
    await Promise.all(
      files.map(async (file) => {
        const key = nextKey.current++
        setPhotos((list) => [...list, { key, uploading: true }])
        try {
          const url = await uploadPhoto(file)
          setPhotos((list) => list.map((p) => (p.key === key ? { key, url } : p)))
        } catch (err) {
          setPhotos((list) => list.filter((p) => p.key !== key))
          setFormError(err?.response?.data?.detail || t('post.uploadFailed', { name: file.name }))
        }
      })
    )
  }

  function makeCover(key) {
    setPhotos((list) => [...list.filter((p) => p.key === key), ...list.filter((p) => p.key !== key)])
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError(null)
    const ready = photos.filter((p) => p.url).map((p) => p.url)
    const nextErrors = {}
    if (!location) nextErrors.location = true
    if (ready.length === 0) nextErrors.photos = t('post.photoRequired')
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      setFormError(t('post.errorSave'))
      return
    }

    const num = (x) => (x === '' ? null : Number(x))
    const land = values.home_type === 'land'
    const selling = values.status === 'for_sale'
    const payload = {
      ...values,
      price: num(values.price),
      key_money_months: selling ? 0 : num(values.key_money_months) ?? 0,
      advance_amount: selling ? num(values.advance_amount) : null,
      beds: land ? 0 : num(values.beds),
      baths: land ? 0 : num(values.baths),
      sqft: num(values.sqft),
      land_size: NO_LAND_SIZE_TYPES.includes(values.home_type) ? null : num(values.land_size),
      stories: land ? null : num(values.stories),
      parking_slots: num(values.parking_slots) ?? 0,
      latitude: Number(location.lat.toFixed(6)),
      longitude: Number(location.lng.toFixed(6)),
      primary_image_url: ready[0],
      images: ready,
    }

    setSaving(true)
    try {
      const saved = editing ? await updateProperty(id, payload) : await createProperty(payload)
      navigate(`/property/${saved.id}`)
    } catch (err) {
      const data = err?.response?.data
      if (data && typeof data === 'object') {
        setErrors(Object.fromEntries(Object.entries(data).map(([k, v]) => [k, [].concat(v).join(' ')])))
      }
      setFormError(data?.detail || t('post.errorSave'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <PageLoader />
  if (forbidden) {
    return <p className="mx-auto max-w-3xl px-4 py-16 text-center text-slate-500">{t('post.notAllowed')}</p>
  }

  const land = values.home_type === 'land'
  const selling = values.status === 'for_sale'
  const uploading = photos.some((p) => p.uploading)

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-extrabold text-brand-900">
        {editing ? t('post.editTitle') : t('nav.postListing')}
      </h1>
      <p className="mt-1 text-slate-500">{t('post.subtitle')}</p>

      <form onSubmit={handleSubmit} noValidate={false} className="mt-8 space-y-6">
        <Section title={t('post.basics')}>
          <div className="sm:col-span-2">
            <span className="mb-1.5 block text-sm font-bold text-slate-700">{t('post.listingFor')}</span>
            <DealToggle value={values.status} onChange={chooseDeal} className="w-full sm:w-80" />
          </div>
          <Select
            label={t('filter.propertyType')}
            value={values.home_type}
            onChange={(v) => set('home_type', v)}
            options={homeTypesFor(values.status).map((k) => [k, t(`type.${k}`)])}
            hint={selling ? t('post.rentOnlyTypes') : undefined}
            error={errors.home_type}
          />
          <Select
            label={t('filter.furnishing')}
            value={values.furnishing}
            onChange={(v) => set('furnishing', v)}
            options={['unfurnished', 'furnished'].map((k) => [k, t(`furnishing.${k}`)])}
          />
          <Field
            label={t(selling ? 'post.priceSale' : 'post.priceRent')}
            type="number" min="1" required
            value={values.price} onChange={(v) => set('price', v)} error={errors.price}
          />
          {selling ? (
            <Field
              label={`${t('post.advance')} (${t('post.optional')})`}
              type="number" min="0"
              value={values.advance_amount} onChange={(v) => set('advance_amount', v)}
              error={errors.advance_amount} hint={t('post.advanceHint')}
            />
          ) : (
            <Select
              label={t('post.keyMoney')}
              value={values.key_money_months}
              onChange={(v) => set('key_money_months', v)}
              options={Array.from({ length: 13 }, (_, n) => [
                String(n),
                n === 0 ? t('card.noKeyMoney') : formatKeyMoney(n, t),
              ])}
            />
          )}
        </Section>

        <Section title={t('post.rooms')}>
          {!land && (
            <>
              <Select
                label={t('filter.bedrooms')}
                value={values.beds}
                onChange={(v) => set('beds', v)}
                options={roomOptions(values.beds)}
              />
              <div>
                <Select
                  label={t('filter.bathrooms')}
                  value={values.shared_bathroom ? '1' : values.baths}
                  onChange={(v) => set('baths', v)}
                  options={roomOptions(values.baths)}
                  disabled={values.shared_bathroom}
                />
                <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={values.shared_bathroom}
                    onChange={(e) => {
                      set('shared_bathroom', e.target.checked)
                      if (e.target.checked) set('baths', '1')
                    }}
                    className="h-4 w-4 accent-brand-600"
                  />
                  {t('post.sharedBathroom')}
                </label>
              </div>
            </>
          )}
          {!NO_LAND_SIZE_TYPES.includes(values.home_type) && (
            <LandSizeField
              size={values.land_size}
              unit={values.land_unit}
              onSize={(v) => set('land_size', v)}
              onUnit={(v) => set('land_unit', v)}
              error={errors.land_size}
            />
          )}
          <Field
            label={SQFT_REQUIRED.includes(values.home_type) ? t('filter.sqft') : `${t('filter.sqft')} (${t('post.optional')})`}
            type="number" min="1" required={SQFT_REQUIRED.includes(values.home_type)}
            value={values.sqft} onChange={(v) => set('sqft', v)} error={errors.sqft}
          />
          {!land && (
            <Select
              label={t('filter.stories')}
              value={values.stories}
              onChange={(v) => set('stories', v)}
              options={Object.keys(STORIES_LABELS).map((k) => [k, t(`stories.${k}`)])}
            />
          )}
          <Field label={t('filter.parking')} type="number" min="0" value={values.parking_slots} onChange={(v) => set('parking_slots', v)} error={errors.parking_slots} />
        </Section>

        <Section title={t('admin.location')}>
          <Field label={t('admin.street')} required value={values.address} onChange={(v) => set('address', v)} error={errors.address} span2 />
          <Field label={t('admin.city')} required list="post-cities" value={values.city} onChange={chooseCity} error={errors.city} />
          <datalist id="post-cities">
            {CITIES.map((c) => <option key={c.name} value={c.name} />)}
          </datalist>
          <Field
            label={`${t('admin.zip')} (${t('post.optional')})`}
            value={values.zip_code} onChange={(v) => set('zip_code', v)} error={errors.zip_code}
          />
          <div className="sm:col-span-2">
            <LocationPicker
              value={location}
              onChange={(point) => {
                setLocation(point)
                setErrors((e) => ({ ...e, location: undefined }))
              }}
              focus={mapFocus}
              invalid={Boolean(errors.location || errors.latitude)}
            />
          </div>
        </Section>

        <Section title={t('admin.photos')}>
          <div className="sm:col-span-2">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {photos.map((photo, i) => (
                <div key={photo.key} className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100">
                  {photo.uploading ? (
                    <div className="flex h-full flex-col items-center justify-center gap-1 text-xs text-slate-500">
                      <Loader2 size={20} className="animate-spin" /> {t('post.uploading')}
                    </div>
                  ) : (
                    <img src={mediaUrl(photo.url)} alt="" className="h-full w-full object-cover" />
                  )}
                  {i === 0 && !photo.uploading && (
                    <span className="absolute left-2 top-2 rounded-full bg-brand-600 px-2 py-0.5 text-xs font-bold text-white">
                      {t('post.cover')}
                    </span>
                  )}
                  {!photo.uploading && (
                    <div className="absolute right-2 top-2 flex gap-1">
                      {i > 0 && (
                        <button
                          type="button"
                          onClick={() => makeCover(photo.key)}
                          title={t('post.makeCover')}
                          aria-label={t('post.makeCover')}
                          className="rounded-full bg-white/90 p-2 text-slate-700 shadow hover:text-brand-600"
                        >
                          <Star size={14} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setPhotos((list) => list.filter((p) => p.key !== photo.key))}
                        title={t('post.removePhoto')}
                        aria-label={t('post.removePhoto')}
                        className="rounded-full bg-white/90 p-2 text-slate-700 shadow hover:text-red-600"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {photos.length < MAX_PHOTOS && (
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  className={`flex aspect-[4/3] flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed text-sm font-bold transition hover:border-brand-500 hover:text-brand-600 ${
                    errors.photos ? 'border-red-400 text-red-600' : 'border-slate-300 text-slate-500'
                  }`}
                >
                  <ImagePlus size={24} /> {t('post.addPhotos')}
                </button>
              )}
            </div>
            <input
              ref={fileInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              hidden
              onChange={(e) => {
                addFiles(e.target.files)
                e.target.value = '' // allow choosing the same file again
              }}
            />
            <p className={`mt-2 text-sm ${errors.photos ? 'font-medium text-red-600' : 'text-slate-500'}`}>
              {errors.photos || t('post.photosHint')}
            </p>
          </div>
        </Section>

        <Section title={t('post.ownerDescription')}>
          <label className="block sm:col-span-2">
            <textarea
              value={values.description}
              onChange={(e) => set('description', e.target.value)}
              rows={6}
              placeholder={t('post.descriptionHint')}
              className={`${inputClass} ${errors.description ? errorClass : ''}`}
            />
          </label>
        </Section>

        <Section title={t('post.contact')}>
          <Field label={t('post.contactName')} required value={values.contact_name} onChange={(v) => set('contact_name', v)} error={errors.contact_name} />
          <Field
            label={t('post.contactPhone')} type="tel" required placeholder="+94 77 123 4567"
            value={values.contact_phone} onChange={(v) => set('contact_phone', v)}
            error={errors.contact_phone} hint={t('post.phoneHint')}
          />
        </Section>

        {formError && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{formError}</p>}

        <button
          type="submit"
          disabled={saving || uploading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 text-lg font-bold text-white transition hover:bg-brand-700 disabled:opacity-60 sm:w-auto"
        >
          {saving && <Loader2 size={18} className="animate-spin" />}
          {saving ? t('admin.saving') : editing ? t('admin.saveChanges') : t('admin.publish')}
        </button>
      </form>
    </div>
  )
}

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100'
const errorClass = 'border-red-400 ring-2 ring-red-100'

function Section({ title, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <h2 className="mb-4 text-xl font-extrabold text-brand-900">{title}</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </section>
  )
}

function Field({ label, value, onChange, error, hint, span2, ...inputProps }) {
  return (
    <label className={`block ${span2 ? 'sm:col-span-2' : ''}`}>
      <span className="mb-1.5 block text-sm font-bold text-slate-700">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputClass} ${error ? errorClass : ''}`}
        {...inputProps}
      />
      {(error || hint) && (
        <span className={`mt-1 block text-xs ${error ? 'text-red-600' : 'text-slate-500'}`}>{error || hint}</span>
      )}
    </label>
  )
}

/** Land size: a number with a Perches / Acres choice attached, read as one field. */
function LandSizeField({ size, unit, onSize, onUnit, error }) {
  const { t } = useLanguage()
  return (
    <div>
      <label htmlFor="land-size" className="mb-1.5 block text-sm font-bold text-slate-700">{t('post.landSize')}</label>
      <div className={`flex rounded-lg border bg-white transition focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-100 ${
        error ? 'border-red-400 ring-2 ring-red-100' : 'border-slate-300'
      }`}>
        <input
          id="land-size"
          type="number" min="0.01" step="any" inputMode="decimal" required
          value={size}
          onChange={(e) => onSize(e.target.value)}
          className="min-w-0 flex-1 rounded-l-lg bg-transparent px-3.5 py-2.5 outline-none"
        />
        <select
          value={unit}
          onChange={(e) => onUnit(e.target.value)}
          aria-label={t('post.landUnit')}
          className="rounded-r-lg border-l border-slate-300 bg-slate-50 px-3 font-bold text-brand-900 outline-none"
        >
          <option value="perch">{t('land.unitPerch')}</option>
          <option value="acre">{t('land.unitAcre')}</option>
        </select>
      </div>
      <span className={`mt-1 block text-xs ${error ? 'text-red-600' : 'text-slate-500'}`}>{error || t('post.landSizeHint')}</span>
    </div>
  )
}

// Bedrooms / bathrooms: 1-7, plus the listing's current value if it's outside that (older listings).
function roomOptions(current) {
  const values = ['1', '2', '3', '4', '5', '6', '7']
  if (current && !values.includes(String(current))) values.unshift(String(current))
  return values.map((v) => [v, v])
}

function Select({ label, value, onChange, options, disabled, hint, error }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-slate-700">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`${inputClass} disabled:bg-slate-100 disabled:text-slate-500 ${error ? errorClass : ''}`}
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
      {(error || hint) && (
        <span className={`mt-1 block text-xs ${error ? 'text-red-600' : 'text-slate-500'}`}>{error || hint}</span>
      )}
    </label>
  )
}
