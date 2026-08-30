import client from './client'

export async function fetchProperties(params = {}) {
  const { data } = await client.get('/properties/', { params })
  return data
}

export async function fetchProperty(id) {
  const { data } = await client.get(`/properties/${id}/`)
  return data
}
