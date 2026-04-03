/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  env: {
    API_URL: process.env.API_URL || 'https://api.northernbox.org',
  },
}

module.exports = nextConfig

