import { MessageCircle, Pencil, Phone, Trash2, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { deleteProperty } from '../api/properties'
import { useLanguage } from '../context/LanguageContext'

/** wa.me link for a Sri Lankan number written any common way (077..., +94 77..., 94...). */
export function whatsappUrl(phone) {
  return `https://wa.me/${phone.replace(/[^\d]/g, '').replace(/^0/, '94')}`
}

/**
 * Right-hand card on a listing: the owner's name with Call and WhatsApp buttons. The owner
 * (or an admin) also gets edit/delete buttons.
 */
export default function ContactOwnerCard({ property }) {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [deleting, setDeleting] = useState(false)

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

      {phone ? (
        <div className="mt-4 grid grid-cols-1 gap-2">
          <a
            href={`tel:${phone.replace(/\s/g, '')}`}
            className="flex h-12 items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 text-lg font-bold text-white transition hover:bg-brand-700"
          >
            <Phone size={17} /> {t('contact.call', { phone })}
          </a>
          <a
            href={whatsappUrl(phone)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-12 items-center justify-center gap-2 rounded-lg border-2 border-brand-600 px-4 text-lg font-bold text-brand-600 transition hover:bg-brand-50"
          >
            <MessageCircle size={18} /> WhatsApp
          </a>
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-500">{t('contact.noPhone')}</p>
      )}

      {property.can_edit && (
        <div className="mt-5 border-t border-slate-100 pt-4">
          <p className="text-sm text-slate-500">{t('contact.yourListing')}</p>
          <div className="mt-3 flex gap-2">
            <Link
              to={`/post/${property.id}/edit`}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-300 px-4 py-2.5 font-bold text-brand-900 hover:bg-slate-50"
            >
              <Pencil size={16} /> {t('common.edit')}
            </Link>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-200 px-4 py-2.5 font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 size={16} /> {t('detail.deleteListing')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
