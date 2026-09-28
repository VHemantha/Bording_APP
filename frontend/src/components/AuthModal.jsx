import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import { useAuthModal } from '../context/AuthModalContext'
import GoogleButton from './GoogleButton'

export default function AuthModal() {
  const { open, mode, closeAuth, setMode } = useAuthModal()
  const { login, register, loginWithGoogle } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open) {
      setError(null)
      setPassword('')
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
    try {
      const user =
        mode === 'register'
          ? await register({ username: email, email, password })
          : await login({ username: email, password })
      finish(user)
    } catch (err) {
      const data = err?.response?.data
      setError(
        data
          ? Object.values(data).flat().join(' ')
          : mode === 'register'
            ? 'Could not create your account.'
            : 'Incorrect email or password.'
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
      setError(err?.response?.data?.detail || 'Google sign-in failed.')
    } finally {
      setBusy(false)
    }
  }

  const isRegister = mode === 'register'

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
            className="relative w-full max-w-md rounded-3xl bg-white p-7 shadow-lift sm:p-9"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          >
            <button
              type="button"
              onClick={closeAuth}
              aria-label="Close"
              className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={20} />
            </button>

            <h2 className="font-display text-2xl font-semibold text-brand-900">
              {isRegister ? 'Create your account' : 'Welcome back'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {isRegister
                ? 'Save homes, get updates, and use the AI search assistant.'
                : 'Sign in to pick up where you left off.'}
            </p>

            <div className="mt-6">
              <GoogleButton onCredential={handleGoogle} onError={setError} />
            </div>

            <div className="my-5 flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-slate-400">
              <span className="h-px flex-1 bg-slate-200" /> or <span className="h-px flex-1 bg-slate-200" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Field
                label={isRegister ? 'Email' : 'Email or username'}
                type={isRegister ? 'email' : 'text'}
                value={email}
                onChange={setEmail}
                autoComplete={isRegister ? 'email' : 'username'}
              />
              <Field
                label="Password"
                type="password"
                value={password}
                onChange={setPassword}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
              />

              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
              >
                {busy && <Loader2 size={16} className="animate-spin" />}
                {isRegister ? 'Create account' : 'Sign in'}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-slate-500">
              {isRegister ? 'Already have an account?' : 'New to Nestwell?'}{' '}
              <button
                type="button"
                onClick={() => setMode(isRegister ? 'login' : 'register')}
                className="font-semibold text-brand-600 hover:underline"
              >
                {isRegister ? 'Sign in' : 'Create an account'}
              </button>
            </p>

            <p className="mt-4 text-center text-[11px] leading-relaxed text-slate-400">
              By continuing you agree to the Nestwell Terms of Use and acknowledge the
              Privacy Policy.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Field({ label, type, value, onChange, autoComplete }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        required
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-100"
      />
    </label>
  )
}
