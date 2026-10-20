import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, CircleCheck, Loader2, MailCheck, MessageSquareText, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { requestPasswordReset, resetPasswordWithPhone, sendPhoneCode } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import { useAuthModal } from '../context/AuthModalContext'
import { useLanguage } from '../context/LanguageContext'
import GoogleButton from './GoogleButton'

// Google sign-in is switched off for now; set to true to bring the button back.
const SHOW_GOOGLE_SIGN_IN = false

// An email address has an @; anything else with digits is treated as a phone number.
const isPhone = (value) => !value.includes('@') && /\d/.test(value)

/**
 * Sign in, create an account, or reset a password, in one window.
 * Phone numbers are confirmed with a 6-digit code sent by SMS: when creating an account and
 * when resetting its password (email accounts get a reset link by email instead).
 */
export default function AuthModal() {
  const { open, mode, closeAuth, setMode } = useAuthModal()
  const { login, register, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const { lang, t } = useLanguage()

  // An email address or a phone number.
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [code, setCode] = useState('')
  // 'form' = the details; 'code' = waiting for the SMS code; 'done' = finished (reset).
  const [step, setStep] = useState('form')
  const [resendIn, setResendIn] = useState(0)
  const [resetSent, setResetSent] = useState(false)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open) {
      setError(null)
      setPassword('')
      setConfirm('')
      setCode('')
      setStep('form')
      setResetSent(false)
    }
  }, [open, mode])

  // Counts down until another code may be asked for.
  useEffect(() => {
    if (resendIn <= 0) return
    const timer = setTimeout(() => setResendIn((n) => n - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendIn])

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

  function explain(err, fallback) {
    const data = err?.response?.data
    if (err?.response?.status === 429) {
      if (data?.retry_after) setResendIn(data.retry_after)
      return data?.retry_after ? t('auth.waitSeconds', { seconds: data.retry_after }) : t('auth.tooMany')
    }
    if (data?.code === 'sms_failed') return t('auth.smsFailed')
    if (data && typeof data === 'object') {
      const messages = Object.entries(data)
        .filter(([key]) => !['code', 'retry_after'].includes(key) || Array.isArray(data[key]))
        .map(([, value]) => [].concat(value).join(' '))
      if (messages.length) return messages.join(' ')
    }
    return fallback
  }

  /** Texts a code for 'register' or 'reset' and moves to the code step. */
  async function sendCode(purpose) {
    await sendPhoneCode(identifier, purpose)
    setCode('')
    setStep('code')
    setResendIn(60)
  }

  async function resend() {
    setBusy(true)
    setError(null)
    try {
      await sendCode(mode === 'forgot' ? 'reset' : 'register')
    } catch (err) {
      setError(explain(err, t('auth.errGeneric')))
    } finally {
      setBusy(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      if (mode === 'forgot') {
        if (!isPhone(identifier)) {
          await requestPasswordReset(identifier, lang)
          setResetSent(true)
        } else if (step === 'form') {
          await sendCode('reset')
        } else {
          if (password !== confirm) {
            setError(t('auth.passwordMismatch'))
            return
          }
          await resetPasswordWithPhone({ phone: identifier, code, password })
          setPassword('')
          setStep('done')
        }
      } else if (mode === 'register') {
        if (isPhone(identifier) && step === 'form') {
          await sendCode('register')
        } else {
          finish(await register({ identifier, password, code }))
        }
      } else {
        finish(await login({ username: identifier, password }))
      }
    } catch (err) {
      setError(
        mode === 'login' && err?.response?.status === 401
          ? t('auth.errLogin')
          : explain(err, mode === 'register' ? t('auth.errCreate') : t('auth.errGeneric'))
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
  const codeStep = step === 'code'

  const title = codeStep
    ? t(isForgot ? 'auth.resetTitle' : 'auth.codeTitle')
    : isForgot
      ? t('auth.resetTitle')
      : isRegister
        ? t('auth.createTitle')
        : t('auth.welcomeBack')
  const subtitle = codeStep
    ? t('auth.codeSent', { phone: identifier })
    : isForgot
      ? t('auth.resetSub')
      : isRegister
        ? t('auth.createSub')
        : t('auth.signInSub')
  const submitLabel = codeStep
    ? t(isForgot ? 'auth.resetSave' : 'auth.verifyCreate')
    : isForgot
      ? isPhone(identifier) ? t('auth.sendCode') : t('auth.resetSend')
      : isRegister
        ? isPhone(identifier) ? t('auth.sendCode') : t('auth.createAccount')
        : t('nav.signIn')

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

            {(isForgot || codeStep) && step !== 'done' && (
              <button
                type="button"
                onClick={() => (codeStep ? setStep('form') : setMode('login'))}
                className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:underline"
              >
                <ArrowLeft size={16} /> {codeStep ? t('auth.changeNumber') : t('auth.backToSignIn')}
              </button>
            )}
            <h2 id="auth-title" className="text-2xl font-extrabold text-brand-900">{title}</h2>
            {step !== 'done' && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}

            {step === 'done' || (isForgot && resetSent) ? (
              <div className="mt-6 space-y-4">
                <div className="flex gap-3 rounded-xl bg-leaf-500/10 p-4 text-sm text-slate-700">
                  {step === 'done' ? <CircleCheck size={20} className="shrink-0 text-leaf-600" /> : <MailCheck size={20} className="shrink-0 text-leaf-600" />}
                  <p>{step === 'done' ? t('auth.resetDone') : t('auth.resetSent')}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="w-full rounded-lg bg-brand-600 px-4 py-3 text-base font-bold text-white transition hover:bg-brand-700"
                >
                  {step === 'done' ? t('nav.signIn') : t('auth.backToSignIn')}
                </button>
              </div>
            ) : (
              <>
                {SHOW_GOOGLE_SIGN_IN && !isForgot && !codeStep && (
                  <>
                    <div className="mt-6">
                      <GoogleButton onCredential={handleGoogle} onError={setError} />
                    </div>
                    <div className="my-5 flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-slate-400">
                      <span className="h-px flex-1 bg-slate-200" /> {t('common.or')} <span className="h-px flex-1 bg-slate-200" />
                    </div>
                  </>
                )}

                <form onSubmit={handleSubmit} className={`space-y-4 ${SHOW_GOOGLE_SIGN_IN && !isForgot && !codeStep ? '' : 'mt-6'}`}>
                  {codeStep ? (
                    <>
                      <div>
                        <label htmlFor="sms-code" className="mb-1 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                          <MessageSquareText size={15} /> {t('auth.codeLabel')}
                        </label>
                        <input
                          id="sms-code"
                          value={code}
                          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          required
                          minLength={6}
                          maxLength={6}
                          autoFocus
                          placeholder="••••••"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-center font-mono text-2xl tracking-[0.5em] outline-none transition focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-100"
                        />
                        <button
                          type="button"
                          onClick={resend}
                          disabled={resendIn > 0 || busy}
                          className="mt-2 text-sm font-semibold text-brand-600 hover:underline disabled:cursor-default disabled:text-slate-400 disabled:no-underline"
                        >
                          {resendIn > 0 ? t('auth.resendIn', { seconds: resendIn }) : t('auth.resend')}
                        </button>
                      </div>
                      {isForgot && (
                        <>
                          <Field label={t('auth.newPassword')} type="password" value={password} onChange={setPassword} autoComplete="new-password" />
                          <Field label={t('auth.confirmPassword')} type="password" value={confirm} onChange={setConfirm} autoComplete="new-password" />
                        </>
                      )}
                    </>
                  ) : (
                    <>
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
                      {isRegister && isPhone(identifier) && (
                        <p className="flex gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                          <MessageSquareText size={15} className="shrink-0 text-brand-600" /> {t('auth.phoneVerifyNote')}
                        </p>
                      )}
                    </>
                  )}

                  {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

                  <button
                    type="submit"
                    disabled={busy}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-3 text-base font-bold text-white transition hover:bg-brand-700 disabled:opacity-60"
                  >
                    {busy && <Loader2 size={16} className="animate-spin" />}
                    {submitLabel}
                  </button>
                </form>
              </>
            )}

            {!codeStep && step !== 'done' && !isForgot && (
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
            {isForgot && !codeStep && step !== 'done' && !resetSent && (
              <p className="mt-5 text-center text-sm text-slate-500">
                <Link to="/about#contact" onClick={closeAuth} className="hover:text-brand-600 hover:underline">
                  {t('auth.needHelp')}
                </Link>
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
