/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  turbopack: {
    root: __dirname,
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
              "img-src 'self' data: blob: https://*.vercel-blob.com https://tile.openstreetmap.org https://*.tile.openstreetmap.org",
              "media-src 'self' blob:",
              "connect-src 'self' https://tile.openstreetmap.org https://*.tile.openstreetmap.org https://vercel.com https://*.vercel.com https://*.vercel-blob.com ws: wss:",
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
