import { useEffect, useRef, useState } from 'react'

import { useLanguage } from '../context/LanguageContext'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

/**
 * Renders the official Google Identity Services button. When the credential
 * comes back it's handed to `onCredential`. If no client ID is configured the
 * button renders disabled with an explanatory tooltip.
 */
export default function GoogleButton({ onCredential, onError }) {
  const containerRef = useRef(null)
  const [ready, setReady] = useState(false)
  const { lang, t } = useLanguage()

  useEffect(() => {
    if (!CLIENT_ID) return
    let cancelled = false
    let tries = 0

    function init() {
      if (cancelled) return
      const gsi = window.google?.accounts?.id
      if (!gsi) {
        if (tries++ < 40) setTimeout(init, 100)
        return
      }
      try {
        gsi.initialize({
          client_id: CLIENT_ID,
          callback: (response) => {
            if (response?.credential) onCredential(response.credential)
            else onError?.(t('auth.googleNoCredential'))
          },
        })
        gsi.renderButton(containerRef.current, {
          theme: 'outline',
          size: 'large',
          width: 320,
          text: 'continue_with',
          shape: 'pill',
          locale: lang, // Google draws the button itself, in this language
        })
        setReady(true)
      } catch {
        onError?.(t('auth.googleInitFail'))
      }
    }

    init()
    return () => {
      cancelled = true
    }
  }, [onCredential, onError, lang, t])

  if (!CLIENT_ID) {
    return (
      <button
        type="button"
        disabled
        title={t('auth.googleNotConfigured')}
        className="flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-400"
      >
        <GoogleGlyph />
        {t('auth.google')}
      </button>
    )
  }

  return (
    <div className="flex flex-col items-center">
      <div ref={containerRef} className="min-h-[44px]" />
      {!ready && (
        <div className="skeleton h-11 w-[320px] max-w-full rounded-full" aria-hidden />
      )}
    </div>
  )
}

function GoogleGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2 0 24 0 14.6 0 6.4 5.4 2.5 13.2l7.8 6.1C12.2 13.2 17.6 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.5 3-2.2 5.5-4.7 7.2l7.3 5.7c4.3-4 6.8-9.9 6.8-17.4z" />
      <path fill="#FBBC05" d="M10.3 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.3.8-4.7l-7.8-6.1C.9 16.3 0 20 0 24s.9 7.7 2.5 10.8l7.8-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.3-5.7c-2 1.4-4.7 2.3-8.6 2.3-6.4 0-11.8-3.7-13.7-9.1l-7.8 6.1C6.4 42.6 14.6 48 24 48z" />
    </svg>
  )
}
