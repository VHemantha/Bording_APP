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
