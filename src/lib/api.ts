import axios from 'axios'
import { Capacitor } from '@capacitor/core'

// Determine API URL based on platform and environment
function getApiUrl(): string {
  // Check if running in Capacitor native app
  if (Capacitor.isNativePlatform()) {
    // Production API for mobile apps
    return import.meta.env.VITE_API_URL || 'https://api.pius.academy/api'
  }
  
  // For web, use environment variable or default
  return import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
}

const API_URL = getApiUrl()

// Only log in development
if (import.meta.env.DEV) {
  console.log('API URL:', API_URL)
  console.log('Platform:', Capacitor.getPlatform())
  console.log('Is Native:', Capacitor.isNativePlatform())
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000,
})

api.interceptors.request.use((config) => {
  if (import.meta.env.DEV) {
    console.log('Making request to:', config.baseURL + config.url)
  }
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (import.meta.env.DEV) {
      console.error('API Error:', error.message)
      console.error('Error config:', error.config)
    }
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
    }
    return Promise.reject(error)
  }
)

export default api
