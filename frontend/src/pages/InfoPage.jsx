import { Mail, Phone } from 'lucide-react'
import { useEffect } from 'react'

import { APP_NAME } from '../components/Logo'
import { SUPPORT_EMAIL, SUPPORT_PHONE } from '../config'
import { useLanguage } from '../context/LanguageContext'
import { LEGAL } from '../i18n/legal'

/** The About us (`page="about"`) and Privacy policy (`page="privacy"`) pages. */
export default function InfoPage({ page }) {
  const { lang } = useLanguage()
  const content = (LEGAL[lang] ?? LEGAL.en)[page]

  useEffect(() => {
    document.title = `${content.title} · ${APP_NAME}`
  }, [content.title])

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-extrabold text-brand-900 sm:text-4xl">{content.title}</h1>
      {content.updated && <p className="mt-2 text-sm text-slate-500">{content.updated}</p>}
      <p className="mt-6 text-lg leading-relaxed text-slate-700">{content.intro}</p>

      {content.sections.map((section) => (
        <section key={section.heading} className="mt-10">
          <h2 className="text-xl font-extrabold text-brand-900">{section.heading}</h2>
          {section.paragraphs?.map((text) => (
            <p key={text} className="mt-3 leading-relaxed text-slate-700">{text}</p>
          ))}
          {section.items && (
            <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed text-slate-700 marker:text-brand-500">
              {section.items.map((text) => <li key={text}>{text}</li>)}
            </ul>
          )}
        </section>
      ))}

      {page === 'about' && (
        <section id="contact" className="mt-10 scroll-mt-28 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-extrabold text-brand-900">{content.contactHeading}</h2>
          <p className="mt-3 leading-relaxed text-slate-700">{content.contactOwners}</p>
          {(SUPPORT_EMAIL || SUPPORT_PHONE) && (
            <>
              <p className="mt-4 font-bold text-slate-700">{content.contactUs}</p>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:gap-6">
                {SUPPORT_EMAIL && (
                  <a href={`mailto:${SUPPORT_EMAIL}`} className="inline-flex items-center gap-2 font-bold text-brand-600 hover:underline">
                    <Mail size={18} /> {SUPPORT_EMAIL}
                  </a>
                )}
                {SUPPORT_PHONE && (
                  <a href={`tel:${SUPPORT_PHONE.replace(/\s/g, '')}`} className="inline-flex items-center gap-2 font-bold text-brand-600 hover:underline">
                    <Phone size={18} /> {SUPPORT_PHONE}
                  </a>
                )}
              </div>
            </>
          )}
        </section>
      )}
    </article>
  )
}
