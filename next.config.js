/** @type {import('next').NextConfig} */
const BASE = process.env.NODE_ENV === 'production' ? '/political-world-map' : ''

const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  images: { unoptimized: true },
  basePath: BASE,
  assetPrefix: BASE,
  env: {
    NEXT_PUBLIC_BASE_PATH: BASE,
  },
}

module.exports = nextConfig
