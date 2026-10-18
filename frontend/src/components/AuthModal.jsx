import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Loader2, MailCheck, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { requestPasswordReset } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import { useAuthModal } from '../context/AuthModalContext'
import { useLanguage } from '../context/LanguageContext'
import GoogleButton from './GoogleButton'

// Google sign-in is switched off for now; set to true to bring the button back.
const SHOW_GOOGLE_SIGN_IN = false

export default function AuthModal() {
  const { open, mode, closeAuth, setMode } = useAuthModal()
  const { login, register, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const { lang, t } = useLanguage()

  // An email address or a phone number.
  const [resetSent, setResetSent] = useState(false)
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open) {
      setError(null)
      setPassword('')
      setResetSent(false)
    }
  }, [open, mode])

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') closeAuth()
    }
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, closeAuth])

  function finish(user) {
    closeAuth()
    // Admins go straight to their dashboard; everyone else stays on the page
    // they were reading (the modal opened over it).
    if (user?.role === 'admin') navigate('/admin')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    if (mode === 'forgot') {
      try {
        await requestPasswordReset(identifier, lang)
        setResetSent(true)
      } catch (err) {
        setError(err?.response?.status === 429 ? t('auth.tooMany') : t('auth.errGeneric'))
      } finally {
        setBusy(false)
      }
      return
    }
    try {
      const user =
        mode === 'register'
          ? await register({ identifier, password })
          : await login({ username: identifier, password })
      finish(user)
    } catch (err) {
      const data = err?.response?.data
      setError(
        mode !== 'register' && err?.response?.status === 401
          ? t('auth.errLogin')
          : data
          ? Object.values(data).flat().join(' ')
          : mode === 'register'
            ? t('auth.errCreate')
            : t('auth.errLogin')
      )
    } finally {
      setBusy(false)
    }
  }

  async function handleGoogle(credential) {
    setBusy(true)
    setError(null)
    try {
      finish(await loginWithGoogle(credential))
    } catch (err) {
      setError(err?.response?.data?.detail || t('auth.errGoogle'))
    } finally {
      setBusy(false)
    }
  }

  const isRegister = mode === 'register'
  const isForgot = mode === 'forgot'

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-brand-900/50 p-4 backdrop-blur-sm sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => e.target === e.currentTarget && closeAuth()}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-title"
            className="relative w-full max-w-md rounded-3xl bg-white p-7 shadow-lift sm:p-9"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          >
            <button
              type="button"
              onClick={closeAuth}
              aria-label={t('common.close')}
              className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={20} />
            </button>

            {isForgot && (
              <button
                type="button"
                onClick={() => setMode('login')}
                className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:underline"
              >
                <ArrowLeft size={16} /> {t('auth.backToSignIn')}
              </button>
            )}
            <h2 id="auth-title" className="text-2xl font-extrabold text-brand-900">
              {isForgot ? t('auth.resetTitle') : isRegister ? t('auth.createTitle') : t('auth.welcomeBack')}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {isForgot ? t('auth.resetSub') : isRegister ? t('auth.createSub') : t('auth.signInSub')}
            </p>

            {isForgot && resetSent ? (
              <div className="mt-6 space-y-4">
                <div className="flex gap-3 rounded-xl bg-leaf-500/10 p-4 text-sm text-slate-700">
                  <MailCheck size={20} className="shrink-0 text-leaf-600" />
                  <p>{t('auth.resetSent')}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="w-full rounded-lg bg-brand-600 px-4 py-3 text-base font-bold text-white transition hover:bg-brand-700"
                >
                  {t('auth.backToSignIn')}
                </button>
              </div>
            ) : <>
            {SHOW_GOOGLE_SIGN_IN && !isForgot && (
              <>
                <div className="mt-6">
                  <GoogleButton onCredential={handleGoogle} onError={setError} />
                </div>
                <div className="my-5 flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-slate-400">
                  <span className="h-px flex-1 bg-slate-200" /> {t('common.or')} <span className="h-px flex-1 bg-slate-200" />
                </div>
              </>
            )}

            <form onSubmit={handleSubmit} className={`space-y-4 ${SHOW_GOOGLE_SIGN_IN ? '' : 'mt-6'}`}>
              <Field
                label={t('auth.emailOrPhone')}
                type="text"
                value={identifier}
                onChange={setIdentifier}
                autoComplete="username"
                placeholder={t('auth.identifierHint')}
                autoFocus // keyboard focus moves into the dialog when it opens
              />
              {!isForgot && (
                <div>
                  <Field
                    label={t('auth.password')}
                    type="password"
                    value={password}
                    onChange={setPassword}
                    autoComplete={isRegister ? 'new-password' : 'current-password'}
                  />
                  {!isRegister && (
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="mt-1.5 text-sm font-semibold text-brand-600 hover:underline"
                    >
                      {t('auth.forgot')}
                    </button>
                  )}
                </div>
              )}

              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-3 text-base font-bold text-white transition hover:bg-brand-700 disabled:opacity-60"
              >
                {busy && <Loader2 size={16} className="animate-spin" />}
                {isForgot ? t('auth.resetSend') : isRegister ? t('auth.createAccount') : t('nav.signIn')}
              </button>
            </form>
            </>}

            {isForgot ? (
              <p className="mt-5 text-center text-sm text-slate-500">
                <Link to="/about#contact" onClick={closeAuth} className="hover:text-brand-600 hover:underline">
                  {t('auth.resetPhoneNote')}
                </Link>
              </p>
            ) : (
            <p className="mt-5 text-center text-sm text-slate-500">
              {isRegister ? t('auth.haveAccount') : t('auth.newHere')}{' '}
              <button
                type="button"
                onClick={() => setMode(isRegister ? 'login' : 'register')}
                className="font-semibold text-brand-600 hover:underline"
              >
                {isRegister ? t('nav.signIn') : t('auth.createAnAccount')}
              </button>
            </p>
            )}

            <p className="mt-4 text-center text-[11px] leading-relaxed text-slate-400">
              {t('auth.terms')}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Field({ label, type, value, onChange, autoComplete, autoFocus, placeholder }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        required
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-100"
      />
    </label>
  )
}
