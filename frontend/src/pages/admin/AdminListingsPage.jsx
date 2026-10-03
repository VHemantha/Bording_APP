import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { deleteProperty, fetchProperties } from '../../api/properties'
import { mediaUrl } from '../../api/client'
import { useLanguage } from '../../context/LanguageContext'
import { formatPrice } from '../../utils/format'

export default function AdminListingsPage() {
  const [properties, setProperties] = useState(null)
  const [q, setQ] = useState('')
  const [busyId, setBusyId] = useState(null)
  const { t } = useLanguage()

  useEffect(() => {
    fetchProperties().then(setProperties).catch(() => setProperties([]))
  }, [])

  const filtered = useMemo(() => {
    if (!properties) return []
    const term = q.trim().toLowerCase()
    if (!term) return properties
    return properties.filter((p) =>
      `${p.address} ${p.city} ${p.state} ${p.zip_code}`.toLowerCase().includes(term)
    )
  }, [properties, q])

  async function handleDelete(p) {
    if (!window.confirm(t('admin.confirmDelete', { address: p.address }))) return
    setBusyId(p.id)
    try {
      await deleteProperty(p.id)
      setProperties((prev) => prev.filter((x) => x.id !== p.id))
    } catch {
      window.alert(t('admin.deleteFail'))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold text-brand-900">{t('admin.listings')}</h1>
        <Link to="/admin/listings/new" className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
          <Plus size={15} /> {t('admin.addListing')}
        </Link>
      </div>

      <div className="relative mt-5 max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('admin.searchPlaceholder')}
          className="w-full rounded-full border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
        />
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">{t('admin.address')}</th>
              <th className="px-4 py-3">{t('filter.price')}</th>
              <th className="hidden px-4 py-3 sm:table-cell">{t('admin.bedsBaths')}</th>
              <th className="hidden px-4 py-3 sm:table-cell">{t('detail.status')}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {properties === null && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400">{t('common.loading')}…</td></tr>
            )}
            {properties && filtered.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400">{t('admin.noneFound')}</td></tr>
            )}
            {filtered.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img src={mediaUrl(p.primary_image_url)} alt="" className="h-10 w-14 rounded-md object-cover" />
                    <div>
                      <p className="font-medium text-brand-900">{p.address}</p>
                      <p className="text-xs text-slate-500">{[p.city, p.state].filter(Boolean).join(", ")}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-semibold text-brand-900">{formatPrice(p.price, p.status, t('unit.perMonth'))}</td>
                <td className="hidden px-4 py-3 text-slate-600 sm:table-cell">{p.beds} / {p.baths}</td>
                <td className="hidden px-4 py-3 sm:table-cell">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                    {t(`status.${p.status}`)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Link to={`/admin/listings/${p.id}/edit`} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-brand-700" aria-label={t('common.edit')}>
                      <Pencil size={15} />
                    </Link>
                    <button
                      onClick={() => handleDelete(p)}
                      disabled={busyId === p.id}
                      className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                      aria-label={t('common.delete')}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
