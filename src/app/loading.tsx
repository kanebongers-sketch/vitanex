import { headers } from 'next/headers'
import { Wordmark } from '@/components/layout/Logo'
import { isPtHost } from '@/lib/fit-factory/domein'
import FfLaden from '@/app/FitFactoryPT/loading'

export default async function Loading() {
  // Dit scherm staat vóór elke pagina, ook vóór de PT-app (bij verversen zie je
  // het even). Op fitfactorypt.nl dus het Fit Factory-laadscherm, nooit dit.
  const h = await headers()
  if (isPtHost(h.get('x-forwarded-host') ?? h.get('host'))) return <FfLaden />

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
      }}
    >
      <span style={{ marginBottom: 8 }}>
        <Wordmark size={16} />
      </span>

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
