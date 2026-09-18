import axios from 'axios'

const axiosInstance = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

axiosInstance.interceptors.request.use(
  (config) => {
    // Don't send Bearer token for login/register — avoids 403 from stale/invalid token
    const isAuthEndpoint = /\/auth\/(login|register)/.test(config.url || '')
    if (!isAuthEndpoint) {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
      return Promise.reject(error)
    }
    const message = error.response?.data?.message || error.message || 'Request failed'
    try {
      window.dispatchEvent(new CustomEvent('api-error', { detail: { message } }))
    } catch {}
    return Promise.reject(error)
  }
)

export default axiosInstance
