import axios from 'axios'

// Use relative path in production (Vercel) to avoid mixed content issues
// Vercel rewrites will proxy /backend-api/* to the actual API server
// For local development, use the full URL
const getApiUrl = () => {
  // Always check browser first (runtime detection)
  if (typeof window !== 'undefined') {
    // If on Vercel domain, use relative path
    if (window.location.hostname.includes('vercel.app')) {
      return '/backend-api'
    }
    // If environment variable is set, use it
    if (process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL
    }
    // For local development in browser
    return 'https://api.northernbox.co.ke'
  }
  
  // Server-side: Check environment variable first
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL
  }
  
  // Server-side: Check Vercel environment variables
  if (process.env.VERCEL || process.env.VERCEL_URL) {
    return '/backend-api'
  }
  
  // Server-side default (will be overridden on client)
  return 'https://api.northernbox.co.ke'
}

// Create axios instance with dynamic baseURL
const createApiInstance = () => {
  const baseURL = getApiUrl()
  
  const instance = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
  })
  
  // Update baseURL dynamically on client-side
  if (typeof window !== 'undefined') {
    // Re-check URL on client side
    const clientBaseURL = getApiUrl()
    if (clientBaseURL !== baseURL) {
      instance.defaults.baseURL = clientBaseURL
    }
  }
  
  return instance
}

const api = createApiInstance()

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
    const currentUrl = api.defaults.baseURL || 'unknown'
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

export { api }

