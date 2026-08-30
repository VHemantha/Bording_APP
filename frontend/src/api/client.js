import axios from 'axios'

const API_BASE_URL = 'http://127.0.0.1:8000/api'

const client = axios.create({
  baseURL: API_BASE_URL,
})

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
