import { CheckCircle2, Loader2, Pencil, Phone, Trash2, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { deleteProperty, sendInquiry } from '../api/properties'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100'

/**
 * Right-hand card on a listing (like Zillow's "Contact agent"): the owner's name and phone,
 * and a message form. The owner (or an admin) sees edit/delete buttons instead of the form.
 */
export default function ContactOwnerCard({ property }) {
  const { user } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [form, setForm] = useState(() => ({
    name: '',
    email: user?.email ?? '',
    phone: '',
    message: t('contact.defaultMessage', { address: property.address }),
  }))
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.email.trim() && !form.phone.trim()) {
      setError(t('contact.replyHint'))
      return
    }
    setSending(true)
    setError(null)
    try {
      await sendInquiry(property.id, form)
      setSent(true)
    } catch (err) {
      const data = err?.response?.data
      setError(
        data?.detail ||
          (data && typeof data === 'object' ? Object.values(data).flat().join(' ') : null) ||
          t('contact.failed')
      )
    } finally {
      setSending(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm(t('admin.confirmDelete', { address: property.address }))) return
    setDeleting(true)
    try {
      await deleteProperty(property.id)
      navigate('/my-listings')
    } catch {
      window.alert(t('admin.deleteFail'))
      setDeleting(false)
    }
  }

  const phone = property.contact_phone
  const whatsapp = phone ? phone.replace(/[^\d]/g, '').replace(/^0/, '94') : ''

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lift">
      <h2 className="text-xl font-extrabold text-brand-900">{t('contact.title')}</h2>

      {(property.contact_name || phone) && (
        <div className="mt-4 flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <UserRound size={22} />
          </span>
          <div className="min-w-0">
            <p className="text-xs text-slate-500">{t('contact.listedBy')}</p>
            <p className="truncate font-bold text-brand-900">{property.contact_name || '—'}</p>
          </div>
        </div>
      )}

      {phone && (
        <div className="mt-4 grid grid-cols-1 gap-2">
          <a
            href={`tel:${phone.replace(/\s/g, '')}`}
            className="flex h-12 items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 text-lg font-bold text-white transition hover:bg-brand-700"
          >
            <Phone size={17} /> {t('contact.call', { phone })}
          </a>
          <a
            href={`https://wa.me/${whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-12 items-center justify-center gap-2 rounded-lg border-2 border-brand-600 px-4 text-lg font-bold text-brand-600 transition hover:bg-brand-50"
          >
            WhatsApp
          </a>
        </div>
      )}

      {property.can_edit ? (
        <div className="mt-5 border-t border-slate-100 pt-4">
          <p className="text-sm text-slate-500">{t('contact.yourListing')}</p>
          <div className="mt-3 flex gap-2">
            <Link
              to={`/post/${property.id}/edit`}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-300 px-4 py-2.5 font-bold text-brand-900 hover:bg-slate-50"
            >
              <Pencil size={16} /> {t('common.edit')}
            </Link>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-200 px-4 py-2.5 font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 size={16} /> {t('detail.deleteListing')}
            </button>
          </div>
        </div>
      ) : sent ? (
        <p className="mt-5 flex items-start gap-2 rounded-xl bg-leaf-500/10 p-4 text-sm font-medium text-leaf-600">
          <CheckCircle2 size={18} className="shrink-0" /> {t('contact.sent')}
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-5 space-y-3 border-t border-slate-100 pt-4">
          <input required maxLength={100} value={form.name} onChange={set('name')} placeholder={t('post.contactName')} aria-label={t('post.contactName')} className={inputClass} />
          <input type="email" value={form.email} onChange={set('email')} placeholder={t('auth.email')} aria-label={t('auth.email')} className={inputClass} />
          <input type="tel" value={form.phone} onChange={set('phone')} placeholder={t('post.contactPhone')} aria-label={t('post.contactPhone')} className={inputClass} />
          <textarea required maxLength={2000} rows={4} value={form.message} onChange={set('message')} aria-label={t('contact.message')} className={inputClass} />
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={sending}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 text-lg font-bold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {sending && <Loader2 size={16} className="animate-spin" />}
            {sending ? t('contact.sending') : t('contact.send')}
          </button>
          <p className="text-xs text-slate-400">{t('contact.replyHint')}</p>
        </form>
      )}
    </div>
  )
}
