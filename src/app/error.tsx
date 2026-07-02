'use client' // Error boundaries moeten Client Components zijn (Next 16.2.4)

import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { Wordmark } from '@/components/layout/Logo'

// Next 16.2.4-conventie: error.tsx krijgt { error, unstable_retry }. De docs
// adviseren unstable_retry() (her-fetch + her-render) boven reset(). We tonen
// bewust geen interne foutdetails; de digest staat in de server-logs.
export default function Fout({
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  return (
    <main
      className="mf-mesh-bg"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 20px',
        textAlign: 'center',
      }}
    >
      <span style={{ marginBottom: 40 }}>
        <Wordmark size={16} />
      </span>

      <div
        aria-hidden
        style={{
          width: 100,
          height: 100,
          borderRadius: '50%',
          background: 'var(--mf-green-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 28,
        }}
      >
        <AlertTriangle size={40} strokeWidth={1.75} style={{ color: 'var(--mf-green)' }} />
      </div>

      <h1
        style={{
          fontSize: 'clamp(22px, 5vw, 30px)',
          fontWeight: 700,
          color: 'var(--text-1)',
          letterSpacing: '-0.02em',
          marginBottom: 10,
          lineHeight: 1.15,
        }}
      >
        Er ging iets mis
      </h1>

      <p
        style={{
          fontSize: 15,
          color: 'var(--text-3)',
          fontWeight: 500,
          maxWidth: 340,
          lineHeight: 1.6,
          marginBottom: 32,
        }}
      >
        Er ging iets mis. Probeer het opnieuw — blijft het misgaan, ga dan terug
        naar de startpagina.
      </p>

      <button
        onClick={() => unstable_retry()}
        style={{
          background: 'var(--mf-green)',
          color: 'var(--bg-app)',
          border: 'none',
          borderRadius: 14,
          padding: '14px 32px',
          fontSize: 15,
          fontWeight: 700,
          letterSpacing: '-0.01em',
          cursor: 'pointer',
          boxShadow: '0 4px 20px color-mix(in srgb, var(--mf-green) 30%, transparent)',
          transition: 'opacity 0.15s, transform 0.15s',
        }}
      >
        Probeer opnieuw
      </button>

      <p style={{ marginTop: 20, fontSize: 12, color: 'var(--text-4)', fontWeight: 500 }}>
        Of ga naar{' '}
        <Link href="/" style={{ color: 'var(--mf-green)', textDecoration: 'none', fontWeight: 700 }}>
          de startpagina
        </Link>
      </p>
    </main>
  )
}
