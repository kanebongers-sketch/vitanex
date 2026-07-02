import { Wordmark } from '@/components/layout/Logo'

export default function Loading() {
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
