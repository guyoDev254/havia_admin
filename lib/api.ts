import axios from 'axios'

// Use relative path in production (Vercel) to avoid mixed content issues
// Vercel rewrites will proxy /backend-api/* to the actual API server
// For local development, use the full URL
const getApiUrl = () => {
  // Check environment variable first (allows override)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL
  }
  
  // If deployed on Vercel, use relative path to avoid mixed content
  // VERCEL environment variable is set automatically by Vercel
  if (process.env.VERCEL || process.env.VERCEL_URL) {
    return '/backend-api' // Vercel will rewrite this to the actual API
  }
  
  // If we're in the browser and on Vercel domain, use relative path
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    return '/backend-api'
  }
  
  // Default to production API (for local development)
  return 'http://104.237.150.116:1111'
}

const API_URL = getApiUrl()

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('admin_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Don't set Content-Type for FormData - let axios set it automatically with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }
  }
  return config
})

// Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('admin_token')
        localStorage.removeItem('admin_user')
        window.location.href = '/login'
      }
    }

    // Enhance network errors with more helpful messages
    const currentUrl = API_URL
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      error.message = `Request timeout connecting to ${currentUrl}.\n\nPossible solutions:\n1. Check if API server is running: cd havia-api && npm run start\n2. Verify the IP address matches your machine's current IP (may have changed after network switch)\n3. Ensure you're on the same network\n4. Check firewall settings\n5. If you changed networks, update NEXT_PUBLIC_API_URL in .env.local`
    } else if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
      error.message = `Cannot connect to server at ${currentUrl}.\n\nPlease check:\n1. Is the API server running? (cd havia-api && npm run start)\n2. Did you change networks? The IP address may have changed\n3. Is the API URL correct? Current: ${currentUrl}\n4. Are you on the same network?\n5. Update NEXT_PUBLIC_API_URL in .env.local if needed\n\n💡 Tip: If you changed networks, find your new IP with: ipconfig (Windows) or ifconfig (Mac/Linux)`
    } else if (!error.response) {
      error.message = `Unable to reach server at ${currentUrl}.\n\nPlease verify:\n1. API server is running\n2. Correct IP address/port (may have changed after network switch)\n3. Network connectivity\n4. Firewall isn't blocking the connection\n5. If you changed networks, update NEXT_PUBLIC_API_URL in .env.local`
    }

    return Promise.reject(error)
  },
)

