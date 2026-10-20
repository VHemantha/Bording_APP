import client from './client'

/** `identifier` is an email address or a phone number. */
export async function registerUser({ identifier, password, code }) {
  const { data } = await client.post('/auth/register/', { identifier, password, code })
  return data
}

/** Texts a 6-digit code to a phone number; purpose is 'register' or 'reset'. */
export async function sendPhoneCode(phone, purpose) {
  const { data } = await client.post('/auth/phone-code/', { phone, purpose })
  return data
}

/** New password for a phone account, with the code texted for purpose 'reset'. */
export async function resetPasswordWithPhone({ phone, code, password }) {
  const { data } = await client.post('/auth/password-reset/phone/', { phone, code, password })
  return data
}

export async function loginUser({ username, password }) {
  const { data } = await client.post('/auth/token/', { username, password })
  return data
}

export async function loginWithGoogleCredential(credential) {
  const { data } = await client.post('/auth/google/', { credential })
  return data
}

/** Emails a reset link if the account (email or phone) has an email address. */
export async function requestPasswordReset(identifier, lang) {
  const { data } = await client.post('/auth/password-reset/', { identifier, lang })
  return data
}

export async function checkPasswordResetLink({ uid, token }) {
  const { data } = await client.get('/auth/password-reset/confirm/', { params: { uid, token } })
  return data.valid
}

export async function confirmPasswordReset({ uid, token, password }) {
  const { data } = await client.post('/auth/password-reset/confirm/', { uid, token, password })
  return data
}

export async function fetchMe() {
  const { data } = await client.get('/auth/me/')
  return data
}

export async function fetchFavorites() {
  const { data } = await client.get('/favorites/')
  return data
}

export async function addFavorite(propertyId) {
  const { data } = await client.post('/favorites/', { property_id: propertyId })
  return data
}

export async function removeFavorite(propertyId) {
  await client.delete(`/favorites/${propertyId}/`)
}
