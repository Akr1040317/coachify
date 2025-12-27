/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['firebasestorage.googleapis.com'],
  },
  // Disable CSS source maps to avoid source-map-js dependency
  productionBrowserSourceMaps: false,
};

module.exports = nextConfig;



