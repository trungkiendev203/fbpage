/** @type {import('next').NextConfig} */
const apiInternalUrl =
  process.env.API_INTERNAL_URL ||
  (process.env.NODE_ENV === 'production' ? 'http://api-server:4000' : 'http://127.0.0.1:4000');

const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiInternalUrl}/api/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
