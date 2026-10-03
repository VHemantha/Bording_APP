import { Mail, MessageSquare, Pencil, Phone, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { mediaUrl } from '../api/client'
import { deleteProperty, fetchInquiries, fetchMyListings } from '../api/properties'
import PageLoader from '../components/PageLoader'
import { useLanguage } from '../context/LanguageContext'
import { cityName } from '../i18n/translations'
import { formatPrice } from '../utils/format'

/** The signed-in user's own listings: edit, delete, and read messages from interested people. */
export default function MyListingsPage() {
  const { lang, t } = useLanguage()
  const [listings, setListings] = useState(null)
  const [busyId, setBusyId] = useState(null)

  useEffect(() => {
    fetchMyListings().then(setListings).catch(() => setListings([]))
  }, [])

  async function handleDelete(listing) {
    if (!window.confirm(t('admin.confirmDelete', { address: listing.address }))) return
    setBusyId(listing.id)
    try {
      await deleteProperty(listing.id)
      setListings((list) => list.filter((l) => l.id !== listing.id))
    } catch {
      window.alert(t('admin.deleteFail'))
    } finally {
      setBusyId(null)
    }
  }

  if (listings === null) return <PageLoader />

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-brand-900">{t('nav.myListings')}</h1>
          <p className="mt-1 text-slate-500">{t('mine.subtitle')}</p>
        </div>
        <Link
          to="/post"
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 font-bold text-white transition hover:bg-brand-700"
        >
          <Plus size={18} /> {t('nav.postListing')}
        </Link>
      </div>

      {listings.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center text-slate-500">
          {t('mine.empty')}
        </p>
      ) : (
        <ul className="mt-8 space-y-4">
          {listings.map((listing) => (
            <ListingRow
              key={listing.id}
              listing={listing}
              lang={lang}
              t={t}
              busy={busyId === listing.id}
              onDelete={() => handleDelete(listing)}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

function ListingRow({ listing, lang, t, busy, onDelete }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState(null)

  function toggleMessages() {
    setOpen((v) => !v)
    if (messages === null) fetchInquiries(listing.id).then(setMessages).catch(() => setMessages([]))
  }

  return (
    <li className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
        <img
          src={mediaUrl(listing.primary_image_url)}
          alt=""
          className="h-40 w-full rounded-xl object-cover sm:h-24 sm:w-36"
        />
        <div className="min-w-0 flex-1">
          <p className="text-xl font-extrabold text-brand-900">
            {formatPrice(listing.price, listing.status, t('unit.perMonth'))}
          </p>
          <p className="truncate text-slate-600">
            {listing.address}, {cityName(listing.city, lang)}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {t(`type.${listing.home_type}`)} &middot; {t(`status.${listing.status}`)} &middot;{' '}
            {t('mine.listed', { date: listing.listed_date })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={toggleMessages}
            aria-expanded={open}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-brand-900 hover:bg-slate-50"
          >
            <MessageSquare size={15} /> {t('mine.messages', { count: listing.inquiry_count })}
          </button>
          <Link
            to={`/property/${listing.id}`}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-brand-900 hover:bg-slate-50"
          >
            {t('mine.view')}
          </Link>
          <Link
            to={`/post/${listing.id}/edit`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-brand-900 hover:bg-slate-50"
          >
            <Pencil size={15} /> {t('common.edit')}
          </Link>
          <button
            type="button"
            onClick={onDelete}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 size={15} /> {t('common.delete')}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-3">
          {messages === null ? (
            <p className="text-sm text-slate-500">{t('common.loading')}…</p>
          ) : messages.length === 0 ? (
            <p className="text-sm text-slate-500">{t('mine.noMessages')}</p>
          ) : (
            <ul className="divide-y divide-slate-200">
              {messages.map((m) => (
                <li key={m.id} className="py-3">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                    <span className="font-bold text-brand-900">{m.name}</span>
                    {m.phone && (
                      <a href={`tel:${m.phone}`} className="inline-flex items-center gap-1 text-brand-600 hover:underline">
                        <Phone size={13} /> {m.phone}
                      </a>
                    )}
                    {m.email && (
                      <a href={`mailto:${m.email}`} className="inline-flex items-center gap-1 text-brand-600 hover:underline">
                        <Mail size={13} /> {m.email}
                      </a>
                    )}
                    <span className="text-slate-400">{new Date(m.created_at).toLocaleString()}</span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-slate-700">{m.message}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </li>
  )
}
