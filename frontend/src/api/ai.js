import client from './client'

/** Natural-language property search. Returns { reply, filters, results, count }. */
export async function searchWithAI(query, history = []) {
  const { data } = await client.post('/ai/search/', { query, history })
  return data
}

/** Site-guide assistant turn. Returns { reply, filters }. */
export async function sendAssistantMessage(message, history = []) {
  const { data } = await client.post('/ai/assistant/', { message, history })
  return data
}

/** Admin only: extract a structured listing draft from raw text. Returns { listing, warnings }. */
export async function extractListing(text) {
  const { data } = await client.post('/ai/extract-listing/', { text })
  return data
}

/** Normalises the various shapes an AI endpoint error can take into a string.
 *  `t` is the translator from useLanguage(); messages sent by the server are passed through. */
export function aiErrorMessage(err, t) {
  const data = err?.response?.data
  if (data?.error) return data.error
  if (data?.detail) return data.detail
  if (err?.response?.status === 503) {
    return t('ai.errNotConfigured')
  }
  return t('ai.errGeneric')
}
