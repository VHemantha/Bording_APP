import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'

const client = axios.create({
  baseURL: API_BASE_URL,
})

// Photos uploaded to the site are stored as /media/... paths on the API server. In
// production that's this same origin; in development the API runs on another port.
const API_ORIGIN = new URL(API_BASE_URL, window.location.href).origin

/** Turns a stored photo reference (full URL or /media/... path) into a usable src. */
export function mediaUrl(path) {
  return path?.startsWith('/media/') ? API_ORIGIN + path : path
}

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let isRefreshing = false
let pendingRequests = []

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const refreshToken = localStorage.getItem('refresh_token')

    if (error.response?.status !== 401 || originalRequest._retry || !refreshToken) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingRequests.push({ resolve, reject, originalRequest })
      })
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      const { data } = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
        refresh: refreshToken,
      })
      localStorage.setItem('access_token', data.access)
      pendingRequests.forEach(({ resolve, originalRequest: req }) => {
        req.headers.Authorization = `Bearer ${data.access}`
        resolve(client(req))
      })
      pendingRequests = []
      originalRequest.headers.Authorization = `Bearer ${data.access}`
      return client(originalRequest)
    } catch (refreshError) {
      pendingRequests.forEach(({ reject }) => reject(refreshError))
      pendingRequests = []
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

export default client
