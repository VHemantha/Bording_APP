import client from './client'

export async function registerUser({ username, email, password }) {
  const { data } = await client.post('/auth/register/', { username, email, password })
  return data
}

export async function loginUser({ username, password }) {
  const { data } = await client.post('/auth/token/', { username, password })
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
