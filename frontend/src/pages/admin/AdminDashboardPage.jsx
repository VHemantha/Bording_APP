import { Building2, Home, KeyRound, Plus, Wand2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { fetchProperties } from '../../api/properties'
import { mediaUrl } from '../../api/client'
import { useLanguage } from '../../context/LanguageContext'
import { formatPrice } from '../../utils/format'

export default function AdminDashboardPage() {
  const [properties, setProperties] = useState(null)
  const { t } = useLanguage()

  useEffect(() => {
    fetchProperties().then(setProperties).catch(() => setProperties([]))
  }, [])

  const stats = summarise(properties)

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-brand-900">{t('admin.dashboard')}</h1>
          <p className="mt-1 text-sm text-slate-500">{t('admin.dashSub')}</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/listings/new" className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
            <Plus size={15} /> {t('admin.addListing')}
          </Link>
          <Link to="/admin/import" className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <Wand2 size={15} /> {t('admin.aiImport')}
          </Link>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Home} label={t('admin.total')} value={stats.total} />
        <StatCard icon={KeyRound} label={t('status.for_sale')} value={stats.forSale} />
        <StatCard icon={Building2} label={t('status.for_rent')} value={stats.forRent} />
        <StatCard icon={Plus} label={t('admin.avgPrice')} value={stats.avgPrice} />
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-display text-lg font-semibold text-brand-900">{t('admin.recent')}</h2>
        </div>
        <ul className="divide-y divide-slate-100">
          {(properties ?? []).slice(0, 6).map((p) => (
            <li key={p.id} className="flex items-center gap-4 px-5 py-3">
              <img src={mediaUrl(p.primary_image_url)} alt="" className="h-12 w-16 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-brand-900">{p.address}</p>
                <p className="text-xs text-slate-500">{[p.city, p.state].filter(Boolean).join(", ")}</p>
              </div>
              <span className="text-sm font-semibold text-brand-900">{formatPrice(p.price, p.status, t('unit.perMonth'))}</span>
              <Link to={`/admin/listings/${p.id}/edit`} className="text-sm font-medium text-brand-600 hover:underline">
                {t('common.edit')}
              </Link>
            </li>
          ))}
          {properties && properties.length === 0 && (
            <li className="px-5 py-8 text-center text-sm text-slate-500">{t('admin.noListings')}</li>
          )}
        </ul>
      </div>
    </div>
  )
}

function summarise(properties) {
  if (!properties || properties.length === 0) {
    return { total: properties ? 0 : '—', forSale: '—', forRent: '—', avgPrice: '—' }
  }
  const forSale = properties.filter((p) => p.status === 'for_sale').length
  const avg = Math.round(properties.reduce((s, p) => s + p.price, 0) / properties.length)
  return {
    total: properties.length,
    forSale,
    forRent: properties.length - forSale,
    avgPrice: formatPrice(avg, 'for_sale'),
  }
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
        <Icon size={17} />
      </span>
      <p className="mt-3 font-display text-xl font-semibold text-brand-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  )
}
