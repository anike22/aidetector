/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'dist',
  basePath: '/algorithmic-updates',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
