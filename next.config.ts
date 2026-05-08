import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    unoptimized: process.env.CAPACITOR_BUILD === 'true',
  },

  async headers() {
    const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
      ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host
      : '*.supabase.co'

    const isProd = process.env.NODE_ENV === 'production'

    // Content-Security-Policy
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",   // Turbopack needs unsafe-eval in dev
      "style-src 'self' 'unsafe-inline'",
      `img-src 'self' data: blob: https://${supabaseHost}`,
      `connect-src 'self' https://${supabaseHost} wss://${supabaseHost}`,
      "font-src 'self' data:",
      "frame-src 'none'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "manifest-src 'self'",
      "worker-src 'self' blob:",
    ].join('; ')

    // Permissions-Policy — disable unused browser features
    const permissionsPolicy = [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'payment=()',
      'usb=()',
      'magnetometer=()',
      'accelerometer=()',
      'gyroscope=()',
      'fullscreen=(self)',
    ].join(', ')

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy',           value: csp },
          { key: 'X-Content-Type-Options',             value: 'nosniff' },
          { key: 'X-Frame-Options',                    value: 'DENY' },
          { key: 'Referrer-Policy',                    value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',                 value: permissionsPolicy },
          { key: 'X-DNS-Prefetch-Control',             value: 'on' },
          // HSTS — only in production to avoid breaking local dev
          ...(isProd ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }] : []),
        ],
      },
      // Cache static assets aggressively
      {
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ]
  },
}

export default nextConfig
