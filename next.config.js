/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['cdn-icons-png.flaticon.com'],
    unoptimized: true,
  },
  output: 'standalone'
}

module.exports = nextConfig 