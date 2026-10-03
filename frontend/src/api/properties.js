import client from './client'

export async function fetchProperties(params = {}) {
  const { data } = await client.get('/properties/', { params })
  return data
}

export async function fetchProperty(id) {
  const { data } = await client.get(`/properties/${id}/`)
  return data
}

export async function createProperty(payload) {
  const { data } = await client.post('/properties/', payload)
  return data
}

export async function updateProperty(id, payload) {
  const { data } = await client.put(`/properties/${id}/`, payload)
  return data
}

export async function deleteProperty(id) {
  await client.delete(`/properties/${id}/`)
}

/** The signed-in user's own listings (with `inquiry_count`). */
export async function fetchMyListings() {
  const { data } = await client.get('/properties/mine/')
  return data
}

/** Uploads one photo; resolves to its stored path (/media/listings/....jpg). */
export async function uploadPhoto(file) {
  const form = new FormData()
  form.append('photo', file)
  const { data } = await client.post('/properties/upload-photo/', form)
  return data.url
}

/** "Contact owner" form: { name, email, phone, message }. */
export async function sendInquiry(id, payload) {
  const { data } = await client.post(`/properties/${id}/inquiries/`, payload)
  return data
}

/** Messages for one of the user's own listings. */
export async function fetchInquiries(id) {
  const { data } = await client.get(`/properties/${id}/inquiries/`)
  return data
}
