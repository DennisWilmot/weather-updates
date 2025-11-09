/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Allow geolocation for your own origin (required for mobile Safari)
          { key: 'Permissions-Policy', value: 'geolocation=(self)' },
        ],
      },
    ];
  },
}

module.exports = nextConfig
