/**
 * API configuration for the admin app.
 *
 * Prefer a configured public API URL when present. Otherwise, use the local
 * backend during development and only switch to production for known prod hosts
 * or Vercel deployments.
 */

export const API_URLS = {
  DEVELOPMENT: 'http://localhost:6000',
  PRODUCTION: 'https://api.northernbox.org',
} as const;

const isProductionHostname = (hostname: string): boolean =>
  hostname === 'admin.northern.org' || hostname === 'admin.northernbox.org';

const isLocalHostname = (hostname: string): boolean =>
  hostname === 'localhost' ||
  hostname === '127.0.0.1' ||
  hostname.startsWith('192.168.') ||
  hostname.startsWith('10.');

export const getApiUrl = (): string => {
  const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (configuredApiUrl) {
    return configuredApiUrl;
  }

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname.toLowerCase();

    if (isProductionHostname(hostname)) {
      return API_URLS.PRODUCTION;
    }

    if (hostname.includes('vercel.app')) {
      return '/backend-api';
    }

    if (isLocalHostname(hostname)) {
      return API_URLS.DEVELOPMENT;
    }
  }

  if (process.env.VERCEL || process.env.VERCEL_URL) {
    return '/backend-api';
  }

  return API_URLS.DEVELOPMENT;
};

export const isDevelopment = (): boolean => {
  const url = getApiUrl();
  return /^(https?:\/\/)?(localhost|127\.0\.0\.1|192\.168\.|10\.)/.test(url);
};

