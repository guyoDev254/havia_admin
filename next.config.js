/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    API_URL: process.env.API_URL || 'http://104.237.150.116:1111',
  },
}

module.exports = nextConfig

