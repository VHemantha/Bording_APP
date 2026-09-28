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

/** Normalises the various shapes an AI endpoint error can take into a string. */
export function aiErrorMessage(err) {
  const data = err?.response?.data
  if (data?.error) return data.error
  if (data?.detail) return data.detail
  if (err?.response?.status === 503) {
    return 'The AI service is not configured yet. Add an Anthropic API key on the server to enable it.'
  }
  return 'Something went wrong reaching the AI service. Please try again.'
}
