import {
  ArrowLeft,
  Bath,
  BedDouble,
  Building2,
  CalendarDays,
  Car,
  Heart,
  KeyRound,
  Layers,
  MessageSquare,
  Phone,
  Ruler,
  Share2,
  Sofa,
  Tag,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { addFavorite, fetchFavorites, removeFavorite } from '../api/auth'
import { fetchProperty } from '../api/properties'
import ContactOwnerCard from '../components/ContactOwnerCard'
import MapView from '../components/MapView'
import PageLoader from '../components/PageLoader'
import PhotoCollage from '../components/PhotoCollage'
import PlacesMenu from '../components/PlacesMenu'
import useNearbyPlaces from '../components/useNearbyPlaces'
import { useAuth } from '../context/AuthContext'
import { useAuthModal } from '../context/AuthModalContext'
import { useLanguage } from '../context/LanguageContext'
import { cityName } from '../i18n/translations'
import { formatBaths, formatPrice } from '../utils/format'

const SECTIONS = [
  ['overview', 'detail.tabOverview'],
  ['facts', 'detail.tabFacts'],
  ['neighborhood', 'detail.tabNeighborhood'],
]

/** Listing page laid out like Zillow's: photo collage, sticky section tabs, a main column of
 *  sections, and a sticky contact card on the right. */
export default function PropertyDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { openAuth } = useAuthModal()
  const { lang, t } = useLanguage()

  const [property, setProperty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isFavorited, setIsFavorited] = useState(false)
  const [copied, setCopied] = useState(false)
  const [placeCategories, setPlaceCategories] = useState([])
  const [mapBounds, setMapBounds] = useState(null)
  const nearby = useNearbyPlaces(placeCategories, mapBounds)
  const mapProperties = useMemo(() => (property ? [property] : []), [property])

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetchProperty(id)
      .then(setProperty)
      .catch(() => setError('detail.notFound'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!user) {
      setIsFavorited(false)
      return
    }
    fetchFavorites()
      .then((favs) => setIsFavorited(favs.some((f) => f.property.id === Number(id))))
      .catch(() => setIsFavorited(false))
  }, [user, id])

  async function handleToggleFavorite() {
    if (!user) {
      openAuth('login')
      return
    }
    const next = !isFavorited
    setIsFavorited(next)
    try {
      if (next) await addFavorite(Number(id))
      else await removeFavorite(Number(id))
    } catch {
      setIsFavorited(!next)
    }
  }

  async function handleShare() {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: document.title, url })
        return
      }
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Share sheet dismissed, or clipboard blocked: nothing to do.
    }
  }

  if (loading) return <PageLoader label={t('detail.loading')} />
  if (error || !property) {
    return (
      <div className="p-10 text-center text-slate-500">
        {t(error || 'detail.notFound')}{' '}
        <Link to="/search" className="font-semibold text-brand-600 underline">{t('detail.backToSearch')}</Link>
      </div>
    )
  }

  const p = property
  const land = p.home_type === 'land'
  const city = cityName(p.city, lang)
  const photos = p.images?.length ? p.images.map((img) => img.image_url) : [p.primary_image_url].filter(Boolean)
  const address = [p.address, city, `${p.state} ${p.zip_code}`.trim()].filter(Boolean).join(', ')
  const sqft = `${p.sqft.toLocaleString()} ${t('unit.sqft')}`
  const keyMoney = p.key_money ? formatPrice(p.key_money) : t('common.none')
  const stories = p.stories ? t(`stories.${p.stories}`) : null

  // The tiles under the title (Zillow's icon fact grid).
  const highlights = [
    [Building2, t(`type.${p.home_type}`)],
    !land && [BedDouble, `${p.beds} ${t('unit.beds')}`],
    !land && [Bath, `${formatBaths(p.baths)} ${t('unit.baths')}`],
    [Ruler, sqft],
    [Sofa, t(`furnishing.${p.furnishing}`)],
    [Car, `${t('filter.parking')}: ${p.parking_slots}`],
    stories && [Layers, stories],
    p.status === 'for_rent' && [KeyRound, `${t('filter.keyMoney')}: ${keyMoney}`],
    [CalendarDays, `${t('detail.listed')}: ${p.listed_date}`],
  ].filter(Boolean)

  const factGroups = [
    [t('detail.groupProperty'), [
      [t('detail.homeType'), t(`type.${p.home_type}`)],
      [t('filter.sqft'), sqft],
      [t('detail.stories'), stories || '—'],
      [t('detail.yearBuilt'), p.year_built || '—'],
    ]],
    !land && [t('detail.groupRooms'), [
      [t('filter.bedrooms'), p.beds],
      [t('filter.bathrooms'), formatBaths(p.baths)],
    ]],
    [t('detail.groupFeatures'), [
      [t('filter.furnishing'), t(`furnishing.${p.furnishing}`)],
      [t('filter.parking'), p.parking_slots],
    ]],
    [t('detail.groupTerms'), [
      [t('detail.status'), t(`status.${p.status}`)],
      [t('filter.price'), formatPrice(p.price, p.status, t('unit.perMonth'))],
      [t('filter.keyMoney'), keyMoney],
      [t('detail.listed'), p.listed_date],
    ]],
  ].filter(Boolean)

  return (
    <div className="bg-white pb-28 lg:pb-16">
      <div className="mx-auto max-w-6xl px-4">
        {/* Back / Save / Share bar */}
        <div className="flex items-center justify-between py-4">
          <button
            type="button"
            onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/search'))}
            className="inline-flex items-center gap-2 font-medium text-brand-900 hover:text-brand-600"
          >
            <ArrowLeft size={20} /> {t('detail.backToSearch')}
          </button>
          <div className="flex items-center gap-5 font-medium text-brand-900">
            <button type="button" onClick={handleToggleFavorite} className="inline-flex items-center gap-1.5 hover:text-brand-600">
              <Heart size={20} className={isFavorited ? 'fill-accent-500 text-accent-500' : ''} />
              {isFavorited ? t('detail.saved') : t('detail.save')}
            </button>
            <button type="button" onClick={handleShare} className="inline-flex items-center gap-1.5 hover:text-brand-600">
              <Share2 size={20} /> {copied ? t('detail.linkCopied') : t('detail.share')}
            </button>
          </div>
        </div>

        <PhotoCollage photos={photos} alt={p.address} />
      </div>

      {/* Sticky section tabs, just under the site navbar */}
      <SectionTabs t={t} />

      <div className="mx-auto mt-6 grid max-w-6xl grid-cols-1 gap-10 px-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0">
          <section id="overview" className="scroll-mt-40">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-md bg-brand-50 px-2 py-0.5 text-sm font-bold text-brand-700">
                {t(`status.${p.status}`)}
              </span>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-sm font-bold text-slate-700">
                {t(`furnishing.${p.furnishing}`)}
              </span>
            </div>
            <h1 className="mt-3 text-3xl font-extrabold text-brand-900 sm:text-4xl">
              {t('detail.title', { type: t(`type.${p.home_type}`), city })}
            </h1>
            <p className="mt-1 text-lg text-slate-700">{address}</p>

            <div className="mt-5 flex flex-wrap items-end gap-x-6 gap-y-2">
              <p className="text-3xl font-extrabold text-brand-900">
                {formatPrice(p.price, p.status, t('unit.perMonth'))}
              </p>
              {p.status === 'for_rent' && (
                <p className="pb-1 font-medium text-slate-600">
                  <Tag size={16} className="mr-1 inline" /> {t('filter.keyMoney')}: <span className="font-bold text-brand-900">{keyMoney}</span>
                </p>
              )}
            </div>

            <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {highlights.map(([Icon, label]) => (
                <li key={label} className="flex items-center gap-3 rounded-lg bg-slate-100 px-4 py-3 text-brand-900">
                  <Icon size={20} className="shrink-0 text-slate-600" />
                  <span className="truncate">{label}</span>
                </li>
              ))}
            </ul>

            <h2 className="mt-10 text-2xl font-extrabold text-brand-900">{t('detail.whatsSpecial')}</h2>
            <p className="mt-1 text-sm font-bold uppercase tracking-wide text-slate-500">{t('post.ownerDescription')}</p>
            <p className="mt-3 whitespace-pre-wrap text-lg leading-relaxed text-slate-700">
              {p.description || t('detail.noDescription')}
            </p>
          </section>

          <hr className="my-10 border-slate-200" />

          <section id="facts" className="scroll-mt-40">
            <h2 className="text-2xl font-extrabold text-brand-900">{t('detail.factsTitle')}</h2>
            <div className="mt-6 grid gap-x-10 gap-y-8 sm:grid-cols-2">
              {factGroups.map(([title, rows]) => (
                <div key={title}>
                  <h3 className="mb-2 text-lg font-bold text-brand-900">{title}</h3>
                  <dl className="divide-y divide-slate-100">
                    {rows.map(([label, value]) => (
                      <div key={label} className="flex justify-between gap-4 py-2">
                        <dt className="text-slate-600">{label}</dt>
                        <dd className="text-right font-bold text-brand-900">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          </section>

          <hr className="my-10 border-slate-200" />

          <section id="neighborhood" className="scroll-mt-40">
            <h2 className="text-2xl font-extrabold text-brand-900">{t('detail.tabNeighborhood')}</h2>
            <p className="mt-1 text-slate-600">{address}</p>
            <p className="mt-1 text-sm text-slate-500">{t('detail.neighborhoodHint')}</p>
            <div className="relative isolate mt-4 h-[28rem] overflow-hidden rounded-2xl border border-slate-200">
              <MapView properties={mapProperties} places={nearby.places} onBoundsChange={setMapBounds} />
              <PlacesMenu selected={placeCategories} onChange={setPlaceCategories} status={nearby.status} />
            </div>
          </section>
        </div>

        <aside id="contact" className="scroll-mt-40 lg:sticky lg:top-40 lg:self-start">
          <ContactOwnerCard property={p} />
        </aside>
      </div>

      {/* Phones: the contact card sits at the very bottom, so keep the main actions pinned
          (like Zillow's mobile bar). Right padding leaves room for the assistant button. */}
      {!p.can_edit && (
        <div className="fixed inset-x-0 bottom-0 z-[80] flex gap-2 border-t border-slate-200 bg-white py-3 pl-4 pr-24 shadow-lift lg:hidden">
          {p.contact_phone && (
            <a
              href={`tel:${p.contact_phone.replace(/\s/g, '')}`}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-brand-600 font-bold text-white"
            >
              <Phone size={18} /> {t('contact.callShort')}
            </a>
          )}
          <button
            type="button"
            onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-lg border-2 border-brand-600 font-bold text-brand-600"
          >
            <MessageSquare size={18} /> {t('contact.message')}
          </button>
        </div>
      )}
    </div>
  )
}

/** Overview / Facts / Neighborhood tabs that stick under the navbar and underline the
 *  section currently in view. */
function SectionTabs({ t }) {
  const [active, setActive] = useState('overview')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: '-160px 0px -55% 0px' }
    )
    SECTIONS.forEach(([sectionId]) => {
      const el = document.getElementById(sectionId)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  return (
    <nav aria-label={t('a11y.sections')} className="sticky top-16 z-40 mt-6 border-b border-slate-200 bg-white md:top-20">
      <div className="no-scrollbar mx-auto flex max-w-6xl gap-8 overflow-x-auto px-4">
        {SECTIONS.map(([sectionId, label]) => (
          <a
            key={sectionId}
            href={`#${sectionId}`}
            onClick={(e) => {
              e.preventDefault()
              document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' })
            }}
            className={`whitespace-nowrap border-b-[3px] py-3.5 font-bold transition ${
              active === sectionId ? 'border-brand-600 text-brand-900' : 'border-transparent text-slate-500 hover:text-brand-900'
            }`}
          >
            {t(label)}
          </a>
        ))}
      </div>
    </nav>
  )
}
