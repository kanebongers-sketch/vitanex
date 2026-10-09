import { headers } from 'next/headers'
import { Wordmark } from '@/components/layout/Logo'
import { isPtHost } from '@/lib/fit-factory/domein'

export default async function Loading() {
  // Op fitfactorypt.nl geen MentaForce-woordmerk, ook niet even tijdens het laden:
  // dit scherm staat vóór elke pagina, ook vóór de PT-app.
  const h = await headers()
  const fitFactory = isPtHost(h.get('x-forwarded-host') ?? h.get('host'))

  return (
    <div
      className="mf-mesh-bg"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        ...(fitFactory ? { background: 'var(--bg-app)' } : {}),
      }}
    >
      {fitFactory ? null : (
        <span style={{ marginBottom: 8 }}>
          <Wordmark size={16} />
        </span>
      )}

      <div className="mf-spinner" />

      <p
        style={{
          fontSize: 13,
          color: 'var(--text-4)',
          fontWeight: 500,
          letterSpacing: '0.01em',
        }}
      >
        Laden…
      </p>
    </div>
  )
}
