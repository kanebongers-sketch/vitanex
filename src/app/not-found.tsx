import Link from 'next/link'

export default function NietGevonden() {
  return (
    <div
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
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          fontSize: 22,
          fontWeight: 400,
          color: 'var(--mf-green)',
          marginBottom: 40,
          display: 'block',
        }}
      >
        MentaForce
      </span>

      {/* 404 illustratie */}
      <div
        style={{
          width: 100,
          height: 100,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--mf-green-light, #E1F5EE) 0%, rgba(29,158,117,0.08) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 48,
          marginBottom: 28,
          boxShadow: '0 8px 32px rgba(29,158,117,0.12)',
        }}
      >
        🗺️
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
        href="/home"
        style={{
          background: 'var(--mf-green)',
          color: 'white',
          borderRadius: 14,
          padding: '14px 32px',
          fontSize: 15,
          fontWeight: 700,
          textDecoration: 'none',
          boxShadow: '0 4px 20px rgba(29,158,117,0.35)',
          letterSpacing: '-0.01em',
          display: 'inline-block',
          transition: 'opacity 0.15s',
        }}
      >
        Terug naar home
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
    </div>
  )
}
