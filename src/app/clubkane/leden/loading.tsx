// Rustige skeleton terwijl de ledenlijst en de behoudsscores geteld worden.

export default function LedenLaden() {
  return (
    <div aria-busy="true" aria-label="Leden laden" role="status" style={{ display: 'grid', gap: 16 }}>
      <div className="club-skelet" style={{ minHeight: 96, maxWidth: 520 }} />
      <div className="club-skelet" style={{ minHeight: 112 }} />
      <div className="club-skelet" style={{ minHeight: 48 }} />
      <div className="club-skelet" style={{ minHeight: 420 }} />
    </div>
  )
}
