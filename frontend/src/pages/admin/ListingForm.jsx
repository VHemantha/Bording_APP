import { Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'

import { districtLabel, fetchLocations } from '../../api/locations'
import { useLanguage } from '../../context/LanguageContext'
import { DEED_TYPES, formatKeyMoney, homeTypesFor, listingFields, RENT_ONLY_TYPES, STORIES_LABELS, typeLabel } from '../../utils/format'


const EMPTY = {
  address: '',
  city: '',
  district: '',
  state: '',
  zip_code: '',
  latitude: '',
  longitude: '',
  price: '',
  beds: '1',
  baths: '1',
  shared_bathroom: false,
  sqft: '',
  land_size: '',
  land_unit: 'perch',
  home_type: 'house',
  status: 'for_rent',
  key_money_months: '0',
  deed_type: '',
  video_url: '',
  parking_slots: 0,
  stories: '',
  furnishing: 'unfurnished',
  contact_name: '',
  contact_phone: '',
  description: '',
  year_built: '',
  primary_image_url: '',
  listed_date: new Date().toISOString().slice(0, 10),
  images: [],
}

export function blankListing() {
  return { ...EMPTY }
}

/** Controlled listing form shared by the manual "Add listing" flow and the
 *  AI-import review screen. Calls `onSubmit(payload)` with server-ready values. */
export default function ListingForm({ initial, onSubmit, submitting, submitLabel }) {
  const { lang, t } = useLanguage()
  const [values, setValues] = useState({ ...EMPTY, ...initial })
  const [districts, setDistricts] = useState([])
  useEffect(() => {
    fetchLocations().then(setDistricts).catch(() => {})
  }, [])
  const [formError, setFormError] = useState(null)

  function set(field, value) {
    setValues((v) => ({ ...v, [field]: value }))
  }

  function setImage(i, value) {
    setValues((v) => {
      const images = [...v.images]
      images[i] = value
      return { ...v, images }
    })
  }

  function handleSubmit(e) {
    e.preventDefault()
    setFormError(null)
    const num = (x) => (x === '' || x === null ? null : Number(x))
    // Only the details this kind of listing has (the server clears the rest too).
    const fields = listingFields(values.status, values.home_type)
    const payload = {
      ...values,
      latitude: num(values.latitude),
      longitude: num(values.longitude),
      price: num(values.price),
      beds: fields.has('rooms') ? num(values.beds) : 0,
      baths: fields.has('rooms') ? num(values.baths) : 0,
      shared_bathroom: fields.has('shared_bathroom') && Boolean(values.shared_bathroom),
      sqft: fields.has('sqft') ? num(values.sqft) : null,
      land_size: fields.has('land_size') ? num(values.land_size) : null,
      key_money_months: fields.has('key_money') ? num(values.key_money_months) ?? 0 : 0,
      deed_type: fields.has('deed_type') ? values.deed_type || '' : '',
      parking_slots: fields.has('parking') ? num(values.parking_slots) ?? 0 : 0,
      furnishing: fields.has('furnishing') ? values.furnishing : 'unfurnished',
      stories: fields.has('stories') ? num(values.stories) : null,
      video_url: (values.video_url || '').trim(),
      year_built: num(values.year_built),
      images: values.images.map((s) => s.trim()).filter(Boolean),
    }
    if (payload.latitude === null || payload.longitude === null) {
      setFormError(t('admin.latLngRequired'))
      return
    }
    onSubmit(payload)
  }

  const fields = listingFields(values.status, values.home_type)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Section title={t('admin.location')}>
        <Grid>
          <Text label={t('admin.street')} value={values.address} onChange={(v) => set('address', v)} required span2 />
          <Text label={t('admin.city')} value={values.city} onChange={(v) => set('city', v)} required />
          <Select
            label={t('post.district')}
            value={values.district || ''}
            onChange={(v) => set('district', v)}
            options={[['', t('post.districtFromCity')], ...districts.map((d) => [d.key, districtLabel(d, lang)])]}
          />
          <Text label={t('admin.state')} value={values.state} onChange={(v) => set('state', v.toUpperCase().slice(0, 2))} />
          <Text label={t('admin.zip')} value={values.zip_code} onChange={(v) => set('zip_code', v)} />
          <Text label={t('admin.latitude')} type="number" step="any" value={values.latitude} onChange={(v) => set('latitude', v)} required />
          <Text label={t('admin.longitude')} type="number" step="any" value={values.longitude} onChange={(v) => set('longitude', v)} required />
        </Grid>
      </Section>

      <Section title={t('admin.details')}>
        <Grid>
          <Select
            label={t('post.listingFor')}
            value={values.status}
            onChange={(v) => {
              set('status', v)
              if (v === 'for_sale' && values.home_type === 'shop') set('home_type', 'commercial')
              else if (v === 'for_sale' && RENT_ONLY_TYPES.includes(values.home_type)) set('home_type', 'house')
            }}
            options={['for_rent', 'for_sale'].map((key) => [key, t(`status.${key}`)])}
          />
          <Text label={values.status === 'for_sale' ? t('post.priceSale') : t('admin.priceUsd')} type="number" value={values.price} onChange={(v) => set('price', v)} required />
          {fields.has('rooms') && <Select label={t('filter.bedrooms')} value={String(values.beds)} onChange={(v) => set('beds', v)} options={roomOptions(values.beds)} />}
          {fields.has('rooms') && (
            <div>
              <Select label={t('filter.bathrooms')} value={values.shared_bathroom ? '1' : String(values.baths)} onChange={(v) => set('baths', v)} options={roomOptions(values.baths)} />
              {fields.has('shared_bathroom') && (
                <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={Boolean(values.shared_bathroom)}
                    onChange={(e) => {
                      set('shared_bathroom', e.target.checked)
                      if (e.target.checked) set('baths', '1')
                    }}
                    className="h-4 w-4 accent-brand-600"
                  />
                  {t('post.sharedBathroom')}
                </label>
              )}
            </div>
          )}
          {fields.has('land_size') && (
            <>
              <Text label={t('post.landSize')} type="number" step="any" value={values.land_size ?? ''} onChange={(v) => set('land_size', v)} required />
              <Select label={t('post.landUnit')} value={values.land_unit || 'perch'} onChange={(v) => set('land_unit', v)} options={[['perch', t('land.unitPerch')], ['acre', t('land.unitAcre')]]} />
            </>
          )}
          {fields.has('sqft') && (
            <Text
              label={['shop', 'commercial'].includes(values.home_type) ? t('filter.sqft') : `${t('filter.sqft')} (${t('post.optional')})`}
              type="number"
              value={values.sqft}
              onChange={(v) => set('sqft', v)}
              required={['shop', 'commercial'].includes(values.home_type)}
            />
          )}
          <Select label={t('detail.homeType')} value={values.home_type} onChange={(v) => set('home_type', v)} options={homeTypesFor(values.status).map((key) => [key, typeLabel(key, values.status, t)])} />
          {fields.has('key_money') && (
            <Select label={t('admin.keyMoneyUsd')} value={String(values.key_money_months ?? 0)} onChange={(v) => set('key_money_months', v)} options={Array.from({ length: 13 }, (_, n) => [String(n), n === 0 ? t('card.noKeyMoney') : formatKeyMoney(n, t)])} />
          )}
          {fields.has('deed_type') && (
            <Select label={t('filter.deedType')} value={values.deed_type || ''} onChange={(v) => set('deed_type', v)} options={[['', t('post.chooseDeed')], ...DEED_TYPES.map((key) => [key, t(`deed.${key}`)])]} />
          )}
          {fields.has('parking') && (
            <Text label={t('filter.parking')} type="number" value={values.parking_slots} onChange={(v) => set('parking_slots', v)} />
          )}
          {fields.has('stories') && (
            <Select label={t('detail.stories')} value={values.stories ?? ''} onChange={(v) => set('stories', v)} options={[['', t('admin.notApplicable')], ...Object.keys(STORIES_LABELS).map((key) => [key, t(`stories.${key}`)])]} />
          )}
          <Text label={t('post.videoLink')} type="url" value={values.video_url || ''} onChange={(v) => set('video_url', v)} />
          {fields.has('furnishing') && (
            <Select label={t('filter.furnishing')} value={values.furnishing} onChange={(v) => set('furnishing', v)} options={['furnished', 'unfurnished'].map((key) => [key, t(`furnishing.${key}`)])} />
          )}
          <Text label={t('post.contactName')} value={values.contact_name} onChange={(v) => set('contact_name', v)} />
          <Text label={t('post.contactPhone')} value={values.contact_phone} onChange={(v) => set('contact_phone', v)} />
          <Text label={t('detail.yearBuilt')} type="number" value={values.year_built} onChange={(v) => set('year_built', v)} />
          <Text label={t('admin.listedDate')} type="date" value={values.listed_date} onChange={(v) => set('listed_date', v)} required />
        </Grid>
      </Section>

      <Section title={t('admin.description')}>
        <textarea
          aria-label={t('admin.description')}
          value={values.description}
          onChange={(e) => set('description', e.target.value)}
          rows={4}
          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
        />
      </Section>

      <Section title={t('admin.photos')}>
        <Text label={t('admin.primaryImage')} value={values.primary_image_url} onChange={(v) => set('primary_image_url', v)} required />
        <div className="mt-3 space-y-2">
          {values.images.map((url, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={url}
                onChange={(e) => setImage(i, e.target.value)}
                placeholder="https://…"
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
              />
              <button
                type="button"
                onClick={() => set('images', values.images.filter((_, j) => j !== i))}
                className="rounded-xl border border-slate-200 px-2.5 text-slate-500 hover:bg-slate-50"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => set('images', [...values.images, ''])}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <Plus size={15} /> {t('admin.addPhoto')}
          </button>
        </div>
      </Section>

      {formError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{formError}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-brand-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-brand-700 disabled:opacity-60"
      >
        {submitting ? t('admin.saving') : (submitLabel ?? t('admin.publish'))}
      </button>
    </form>
  )
}

function Section({ title, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="mb-4 text-lg font-extrabold text-brand-900">{title}</h2>
      {children}
    </div>
  )
}

function Grid({ children }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
}

function Text({ label, value, onChange, type = 'text', required, step, span2 }) {
  return (
    <label className={`block ${span2 ? 'sm:col-span-2' : ''}`}>
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <input
        type={type}
        step={step}
        required={required}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
      />
    </label>
  )
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm capitalize outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
    </label>
  )
}

// Bedrooms / bathrooms: 1-7, plus the listing's current value if it's outside that (older listings).
function roomOptions(current) {
  const values = ['1', '2', '3', '4', '5', '6', '7']
  if (current !== '' && current !== null && current !== undefined && !values.includes(String(current))) {
    values.unshift(String(current))
  }
  return values.map((v) => [v, v])
}
