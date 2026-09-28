import { Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

const COLUMNS = [
  { title: 'Explore', links: [['Buy', '/search?status=for_sale'], ['Rent', '/search?status=for_rent'], ['Browse all', '/search']] },
  { title: 'Company', links: [['About', '/'], ['Careers', '/'], ['Press', '/']] },
  { title: 'Support', links: [['Help center', '/'], ['Contact', '/'], ['Privacy', '/']] },
]

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
                <Sparkles size={18} />
              </span>
              <span className="font-display text-xl font-semibold text-brand-900">Nestwell</span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-slate-500">
              A calmer way to find your next home — with an AI assistant that actually
              understands what you're looking for.
            </p>
            <form
              className="mt-5 flex max-w-sm items-center gap-2 rounded-full border border-slate-200 p-1.5"
              onSubmit={(e) => e.preventDefault()}
            >
              <input
                type="email"
                placeholder="Get new listings by email"
                className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"
              />
              <button className="rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
                Subscribe
              </button>
            </form>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="text-sm font-semibold text-brand-900">{col.title}</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-500">
                {col.links.map(([label, to]) => (
                  <li key={label}>
                    <Link to={to} className="transition hover:text-brand-700">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-12 border-t border-slate-100 pt-6 text-xs text-slate-400">
          © {new Date().getFullYear()} Nestwell. Listings shown are sample data for demonstration.
        </p>
      </div>
    </footer>
  )
}
