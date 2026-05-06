import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },

  // Sta afbeeldingen van externe domeinen toe (Supabase storage)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    // Schakel image optimization uit voor Capacitor static export
    unoptimized: process.env.CAPACITOR_BUILD === 'true',
  },

  // Headers voor beveiliging
  async headers() {
    const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
      ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host
      : '*.supabase.co'

    const csp = [
      "default-src 'self'",
      // Next.js Turbopack heeft unsafe-eval nodig voor client-side chunk loading
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      `img-src 'self' data: blob: https://${supabaseHost}`,
      `connect-src 'self' https://${supabaseHost} wss://${supabaseHost}`,
      "font-src 'self' data:",
      "frame-src 'none'",
      "object-src 'none'",
    ].join('; ')

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ]
  },
}

export default nextConfig
