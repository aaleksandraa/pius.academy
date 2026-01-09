import { Capacitor } from '@capacitor/core'

const BACKEND_IP = '192.168.0.106'
const BACKEND_PORT = '8000'

// Get the base URL for images/media
export function getMediaBaseUrl(): string {
  if (Capacitor.isNativePlatform()) {
    return `http://${BACKEND_IP}:${BACKEND_PORT}`
  }
  return 'http://localhost:8000'
}

// Convert a relative or localhost URL to the correct base URL
export function getImageUrl(url: string | null | undefined): string {
  if (!url) return ''
  
  // If it's already using the correct IP, return as is
  if (url.startsWith(`http://${BACKEND_IP}`)) {
    return url
  }
  
  // If it's an external URL (https and not our server), return as is
  if (url.startsWith('https://') && !url.includes('localhost') && !url.includes('127.0.0.1')) {
    return url
  }
  
  // For native platforms, convert all URLs to use the correct IP
  if (Capacitor.isNativePlatform()) {
    // Handle full localhost URLs
    if (url.includes('localhost:8000') || url.includes('127.0.0.1:8000')) {
      return url
        .replace('http://localhost:8000', `http://${BACKEND_IP}:${BACKEND_PORT}`)
        .replace('http://127.0.0.1:8000', `http://${BACKEND_IP}:${BACKEND_PORT}`)
    }
    
    // Handle relative URLs starting with /storage (Laravel storage URLs)
    if (url.startsWith('/storage')) {
      return `http://${BACKEND_IP}:${BACKEND_PORT}${url}`
    }
    
    // Handle any other relative URLs starting with /
    if (url.startsWith('/')) {
      return `http://${BACKEND_IP}:${BACKEND_PORT}${url}`
    }
    
    // Handle URLs that are just paths without leading slash
    if (!url.startsWith('http')) {
      return `http://${BACKEND_IP}:${BACKEND_PORT}/${url}`
    }
  }
  
  return url
}
