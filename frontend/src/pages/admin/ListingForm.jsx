import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { useLanguage } from '../../context/LanguageContext'
import { HOME_TYPE_LABELS, STORIES_LABELS } from '../../utils/format'

const STATUSES = ['for_sale', 'for_rent']

const EMPTY = {
  address: '',
  city: '',
  state: '',
  zip_code: '',
  latitude: '',
  longitude: '',
  price: '',
  beds: '',
  baths: '',
  sqft: '',
  home_type: 'house',
  status: 'for_sale',
  key_money: 0,
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
  const { t } = useLanguage()
  const [values, setValues] = useState({ ...EMPTY, ...initial })
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
    const payload = {
      ...values,
      latitude: num(values.latitude),
      longitude: num(values.longitude),
      price: num(values.price),
      beds: num(values.beds),
      baths: num(values.baths),
      sqft: num(values.sqft),
      key_money: num(values.key_money) ?? 0,
      parking_slots: num(values.parking_slots) ?? 0,
      stories: num(values.stories),
      year_built: num(values.year_built),
      images: values.images.map((s) => s.trim()).filter(Boolean),
    }
    if (payload.latitude === null || payload.longitude === null) {
      setFormError(t('admin.latLngRequired'))
      return
    }
    onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Section title={t('admin.location')}>
        <Grid>
          <Text label={t('admin.street')} value={values.address} onChange={(v) => set('address', v)} required span2 />
          <Text label={t('admin.city')} value={values.city} onChange={(v) => set('city', v)} required />
          <Text label={t('admin.state')} value={values.state} onChange={(v) => set('state', v.toUpperCase().slice(0, 2))} />
          <Text label={t('admin.zip')} value={values.zip_code} onChange={(v) => set('zip_code', v)} />
          <Text label={t('admin.latitude')} type="number" step="any" value={values.latitude} onChange={(v) => set('latitude', v)} required />
          <Text label={t('admin.longitude')} type="number" step="any" value={values.longitude} onChange={(v) => set('longitude', v)} required />
        </Grid>
      </Section>

      <Section title={t('admin.details')}>
        <Grid>
          <Text label={t('admin.priceUsd')} type="number" value={values.price} onChange={(v) => set('price', v)} required />
          <Text label={t('filter.bedrooms')} type="number" value={values.beds} onChange={(v) => set('beds', v)} required />
          <Text label={t('filter.bathrooms')} type="number" step="0.5" value={values.baths} onChange={(v) => set('baths', v)} required />
          <Text label={t('filter.sqft')} type="number" value={values.sqft} onChange={(v) => set('sqft', v)} required />
          <Select label={t('detail.homeType')} value={values.home_type} onChange={(v) => set('home_type', v)} options={Object.keys(HOME_TYPE_LABELS).map((key) => [key, t(`type.${key}`)])} />
          <Select label={t('detail.status')} value={values.status} onChange={(v) => set('status', v)} options={STATUSES.map((key) => [key, t(`status.${key}`)])} />
          <Text label={t('admin.keyMoneyUsd')} type="number" value={values.key_money} onChange={(v) => set('key_money', v)} />
          <Text label={t('filter.parking')} type="number" value={values.parking_slots} onChange={(v) => set('parking_slots', v)} />
          <Select label={t('detail.stories')} value={values.stories ?? ''} onChange={(v) => set('stories', v)} options={[['', t('admin.notApplicable')], ...Object.keys(STORIES_LABELS).map((key) => [key, t(`stories.${key}`)])]} />
          <Select label={t('filter.furnishing')} value={values.furnishing} onChange={(v) => set('furnishing', v)} options={['furnished', 'unfurnished'].map((key) => [key, t(`furnishing.${key}`)])} />
          <Text label={t('post.contactName')} value={values.contact_name} onChange={(v) => set('contact_name', v)} />
          <Text label={t('post.contactPhone')} value={values.contact_phone} onChange={(v) => set('contact_phone', v)} />
          <Text label={t('detail.yearBuilt')} type="number" value={values.year_built} onChange={(v) => set('year_built', v)} />
          <Text label={t('admin.listedDate')} type="date" value={values.listed_date} onChange={(v) => set('listed_date', v)} required />
        </Grid>
      </Section>

      <Section title={t('admin.description')}>
        <textarea
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
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <Plus size={15} /> {t('admin.addPhoto')}
          </button>
        </div>
      </Section>

      {formError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{formError}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
      >
        {submitting ? t('admin.saving') : (submitLabel ?? t('admin.publish'))}
      </button>
    </form>
  )
}

function Section({ title, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="mb-4 font-display text-lg font-semibold text-brand-900">{title}</h3>
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
