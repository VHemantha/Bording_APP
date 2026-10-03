import { ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'

import { createProperty, fetchProperty, updateProperty } from '../../api/properties'
import PageLoader from '../../components/PageLoader'
import { useLanguage } from '../../context/LanguageContext'
import ListingForm from './ListingForm'

export default function AdminListingFormPage() {
  const { id } = useParams()
  const editing = Boolean(id)
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useLanguage()

  // AI import hands a draft in via router state.
  const [initial, setInitial] = useState(location.state?.draft ?? null)
  const [loading, setLoading] = useState(editing && !initial)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const warnings = location.state?.warnings ?? []

  useEffect(() => {
    if (!editing || initial) return
    fetchProperty(id)
      .then((p) => setInitial({ ...p, images: (p.images || []).map((img) => img.image_url) }))
      .catch(() => setError(t('admin.loadFail')))
      .finally(() => setLoading(false))
  }, [editing, id, initial, t])

  async function handleSubmit(payload) {
    setSubmitting(true)
    setError(null)
    try {
      const saved = editing ? await updateProperty(id, payload) : await createProperty(payload)
      navigate(`/admin/listings`, { replace: true })
      return saved
    } catch (err) {
      const data = err?.response?.data
      setError(data ? JSON.stringify(data) : t('admin.saveFail'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <PageLoader label={t('admin.loadingListing')} />

  return (
    <div>
      <Link to="/admin/listings" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-700">
        <ArrowLeft size={16} /> {t('admin.listings')}
      </Link>
      <h1 className="font-display text-2xl font-semibold text-brand-900">
        {editing ? t('admin.editListing') : t('admin.addListing')}
      </h1>

      {warnings.length > 0 && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-semibold">{t('admin.flagged')}</p>
          <ul className="mt-1.5 list-disc space-y-0.5 pl-5">
            {warnings.map((w) => <li key={w}>{w}</li>)}
          </ul>
        </div>
      )}

      {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div className="mt-5">
        <ListingForm
          initial={initial ?? undefined}
          onSubmit={handleSubmit}
          submitting={submitting}
          submitLabel={editing ? t('admin.saveChanges') : t('admin.publish')}
        />
      </div>
    </div>
  )
}
