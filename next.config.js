/**
 * @type {import('next').NextConfig}
 */

const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
/*  basePath: '/blog',
  assetPrefix: '/blog/',
  publicRuntimeConfig: {
    basePath: "/blog",
  },*/
 
};

module.exports = nextConfig;
