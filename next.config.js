/**
 * @type {import('next').NextConfig}
 */

const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: process.env.NODE_ENV === 'production' ? '/blog' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/blog/' : '',
 experimental: {
    appDir: true,
  }, 
};

module.exports = nextConfig;
