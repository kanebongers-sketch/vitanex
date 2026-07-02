import Link from 'next/link'
import { Compass } from 'lucide-react'
import { Wordmark } from '@/components/layout/Logo'

export default function NietGevonden() {
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
      {/* MentaForce branding */}
      <span style={{ marginBottom: 40 }}>
        <Wordmark size={16} />
      </span>

      {/* 404 illustratie */}
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
        <Compass size={40} strokeWidth={1.75} style={{ color: 'var(--mf-green)' }} />
      </div>

      <h1
        style={{
          fontSize: 'clamp(28px, 8vw, 48px)',
          fontWeight: 900,
          color: 'var(--text-1)',
          letterSpacing: '-0.03em',
          marginBottom: 12,
          lineHeight: 1.1,
        }}
      >
        404
      </h1>

      <p
        style={{
          fontSize: 'clamp(18px, 4vw, 22px)',
          fontWeight: 700,
          color: 'var(--text-1)',
          letterSpacing: '-0.01em',
          marginBottom: 8,
        }}
      >
        Oeps, deze pagina bestaat niet
      </p>

      <p
        style={{
          fontSize: 15,
          color: 'var(--text-4)',
          fontWeight: 500,
          maxWidth: 320,
          lineHeight: 1.6,
          marginBottom: 36,
        }}
      >
        De pagina die je zoekt is verplaatst, verwijderd of heeft nooit bestaan.
        Geen zorgen — ga terug naar de startpagina.
      </p>

      <Link
        href="/"
        style={{
          background: 'var(--mf-green)',
          color: 'var(--bg-app)',
          borderRadius: 14,
          padding: '14px 32px',
          fontSize: 15,
          fontWeight: 700,
          textDecoration: 'none',
          boxShadow: '0 4px 20px color-mix(in srgb, var(--mf-green) 30%, transparent)',
          letterSpacing: '-0.01em',
          display: 'inline-block',
          transition: 'opacity 0.15s',
        }}
      >
        Terug naar de startpagina
      </Link>

      <p
        style={{
          marginTop: 20,
          fontSize: 12,
          color: 'var(--text-4)',
          fontWeight: 500,
        }}
      >
        Of ga naar{' '}
        <Link
          href="/login"
          style={{
            color: 'var(--mf-green)',
            textDecoration: 'none',
            fontWeight: 700,
          }}
        >
          inloggen
        </Link>
      </p>
    </main>
  )
}
