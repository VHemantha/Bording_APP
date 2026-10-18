import { CheckCircle2, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { checkPasswordResetLink, confirmPasswordReset } from '../api/auth'
import { APP_NAME } from '../components/Logo'
import PageLoader from '../components/PageLoader'
import { useAuthModal } from '../context/AuthModalContext'
import { useLanguage } from '../context/LanguageContext'

/** /reset-password?uid=..&token=.. : the page the "Forgot password?" email links to. */
export default function ResetPasswordPage() {
  const [params] = useSearchParams()
  const { openAuth } = useAuthModal()
  const { t } = useLanguage()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState(null)
  const uid = params.get('uid')
  const token = params.get('token')
  // null while the link is being checked.
  const [invalidLink, setInvalidLink] = useState(uid && token ? null : true)
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    document.title = `${t('auth.resetTitle')} · ${APP_NAME}`
  }, [t])

  // Say straight away when a link has expired, before the visitor types a new password.
  useEffect(() => {
    if (!uid || !token) return
    checkPasswordResetLink({ uid, token })
      .then((valid) => setInvalidLink(!valid))
      .catch(() => setInvalidLink(false)) // can't tell: let them try; the save will say if it fails
  }, [uid, token])

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (password !== confirm) {
      setError(t('auth.passwordMismatch'))
      return
    }
    setBusy(true)
    try {
      await confirmPasswordReset({ uid, token, password })
      setDone(true)
    } catch (err) {
      const data = err?.response?.data
      if (data?.code === 'invalid_link') setInvalidLink(true)
      else if (data?.password) setError([].concat(data.password).join(' '))
      else setError(err?.response?.status === 429 ? t('auth.tooMany') : t('auth.errGeneric'))
    } finally {
      setBusy(false)
    }
  }

  if (invalidLink === null) return <PageLoader />

  return (
    <div className="flex justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-lift ring-1 ring-slate-200 sm:p-9">
        <h1 className="text-2xl font-extrabold text-brand-900">{t('auth.resetTitle')}</h1>

        {done ? (
          <div className="mt-6 space-y-4">
            <div className="flex gap-3 rounded-xl bg-leaf-500/10 p-4 text-sm text-slate-700">
              <CheckCircle2 size={20} className="shrink-0 text-leaf-600" />
              <p>{t('auth.resetDone')}</p>
            </div>
            <button type="button" onClick={() => openAuth('login')} className={buttonClass}>
              {t('nav.signIn')}
            </button>
          </div>
        ) : invalidLink ? (
          <div className="mt-6 space-y-4">
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{t('auth.resetInvalid')}</p>
            <button type="button" onClick={() => openAuth('forgot')} className={buttonClass}>
              {t('auth.requestNew')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <PasswordField label={t('auth.newPassword')} value={password} onChange={setPassword} autoFocus />
            <PasswordField label={t('auth.confirmPassword')} value={confirm} onChange={setConfirm} />
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={busy} className={`${buttonClass} flex items-center justify-center gap-2 disabled:opacity-60`}>
              {busy && <Loader2 size={16} className="animate-spin" />}
              {t('auth.resetSave')}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

const buttonClass = 'w-full rounded-lg bg-brand-600 px-4 py-3 text-base font-bold text-white transition hover:bg-brand-700'

function PasswordField({ label, value, onChange, autoFocus }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <input
        type="password"
        value={value}
        required
        autoComplete="new-password"
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-100"
      />
    </label>
  )
}
