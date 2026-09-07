/**
 * Next.js configuration (ESM format).
 * We must allow images from Open Food Facts CDN domains
 * so that Next.js <Image> can optimise them.
 *
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        // Primary Open Food Facts image CDN
        protocol: 'https',
        hostname: 'images.openfoodfacts.org',
        pathname: '/**',
      },
      {
        // Static assets CDN
        protocol: 'https',
        hostname: 'static.openfoodfacts.org',
        pathname: '/**',
      },
      {
        // World subdomain images
        protocol: 'https',
        hostname: 'world.openfoodfacts.org',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
