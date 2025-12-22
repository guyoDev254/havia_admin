/**
 * API Configuration for Admin App
 * 
 * To switch between development and production:
 * 
 * Development (localhost):
 * - Create .env.local file with: NEXT_PUBLIC_API_URL=http://localhost:8000
 * 
 * Production:
 * - Create .env.local file with: NEXT_PUBLIC_API_URL=https://api.northernbox.co.ke
 * - Or leave unset to use default production URL
 */

export const API_URLS = {
  DEVELOPMENT: 'http://localhost:8000',
  PRODUCTION: 'https://api.northernbox.co.ke',
} as const;

export const getApiUrl = (): string => {
  // Check environment variable first
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // Check browser hostname for production admin domain
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // If on production admin domain, use production API
    if (hostname === 'admin.northern.co.ke' || hostname === 'admin.northernbox.co.ke') {
      return API_URLS.PRODUCTION;
    }
    
    // If on Vercel domain, use relative path (for Vercel rewrites)
    if (hostname.includes('vercel.app')) {
      return '/backend-api';
    }
  }
  
  // Server-side: Check Vercel environment variables
  if (process.env.VERCEL || process.env.VERCEL_URL) {
    return '/backend-api';
  }
  
  // Default to production
  return API_URLS.PRODUCTION;
};

export const isDevelopment = (): boolean => {
  const url = getApiUrl();
  return url.includes('localhost') || url.includes('127.0.0.1') || url.includes('192.168.');
};

