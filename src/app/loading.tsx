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
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          fontSize: 20,
          fontWeight: 400,
          color: 'var(--mf-green)',
          marginBottom: 8,
        }}
      >
        MentaForce
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
