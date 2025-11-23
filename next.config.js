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
          // Content Security Policy - Allow map resources and necessary scripts
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob: https://tile.openstreetmap.org https://*.tile.openstreetmap.org",
              "connect-src 'self' https://tile.openstreetmap.org https://*.tile.openstreetmap.org ws: wss:",
              "frame-src 'self' https://embed.windy.com",
              "worker-src 'self' blob:",
            ].join('; '),
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig
