import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Loader2, MessageCircle, Send, Sparkles, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { aiErrorMessage, sendAssistantMessage } from '../api/ai'
import { useLanguage } from '../context/LanguageContext'
import { filtersToSearchParams } from '../utils/searchParams'

// Shown first; its text comes from the translations so it follows the chosen language.
const GREETING = { role: 'assistant', greeting: true }

export default function AssistantWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([GREETING])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(null)
  const navigate = useNavigate()
  const { t } = useLanguage()
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, busy])

  async function send(e) {
    e?.preventDefault()
    const text = input.trim()
    if (!text || busy) return
    const history = messages.filter((m) => m !== GREETING).map((m) => ({ role: m.role, content: m.content }))
    setMessages((m) => [...m, { role: 'user', content: text }])
    setInput('')
    setBusy(true)
    setPendingFilters(null)
    try {
      const data = await sendAssistantMessage(text, history)
      setMessages((m) => [...m, { role: 'assistant', content: data.reply }])
      if (data.filters && Object.keys(data.filters).length > 0) {
        setPendingFilters(data.filters)
      }
    } catch (err) {
      setMessages((m) => [...m, { role: 'assistant', content: aiErrorMessage(err, t), error: true }])
    } finally {
      setBusy(false)
    }
  }

  function goToResults() {
    const params = filtersToSearchParams(pendingFilters)
    setOpen(false)
    navigate(`/search?${params.toString()}`)
  }

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-[90] flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-lift"
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        aria-label={t('assistant.open')}
      >
        {open ? <X size={22} /> : <MessageCircle size={24} />}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed bottom-24 right-5 z-[90] flex h-[32rem] max-h-[calc(100vh-8rem)] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lift"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
          >
            <div className="flex items-center gap-2.5 bg-brand-900 px-4 py-3 text-white">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
                <Sparkles size={16} />
              </span>
              <div>
                <p className="text-sm font-semibold">{t('assistant.title')}</p>
                <p className="text-[11px] text-white/60">{t('assistant.subtitle')}</p>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.map((m, i) => (
                <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                  <span
                    className={`inline-block max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm ${
                      m.role === 'user'
                        ? 'bg-brand-600 text-white'
                        : m.error
                          ? 'bg-red-50 text-red-600'
                          : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {m.greeting ? t('assistant.greeting') : m.content}
                  </span>
                </div>
              ))}
              {busy && (
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Loader2 size={14} className="animate-spin" /> {t('assistant.thinking')}
                </div>
              )}
              {pendingFilters && !busy && (
                <button
                  type="button"
                  onClick={goToResults}
                  className="flex items-center gap-1.5 rounded-lg bg-brand-50 px-3 py-2 text-sm font-bold text-brand-700 transition hover:bg-brand-100"
                >
                  {t('assistant.showHomes')} <ArrowRight size={15} />
                </button>
              )}
            </div>

            <form onSubmit={send} className="flex items-center gap-2 border-t border-slate-200 p-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t('assistant.placeholder')}
                className="min-w-0 flex-1 rounded-full bg-slate-100 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-200"
              />
              <button
                type="submit"
                disabled={busy}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white transition hover:bg-brand-700 disabled:opacity-60"
                aria-label={t('assistant.send')}
              >
                <Send size={16} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
