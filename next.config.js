/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  images: { unoptimized: true },
  basePath: process.env.NODE_ENV === 'production' ? '/political-world-map' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/political-world-map' : '',
}

module.exports = nextConfig
