// Rustige skeleton terwijl de cijfers geteld worden.

export default function CijfersLaden() {
  return (
    <div aria-busy="true" aria-label="Cijfers laden" style={{ display: 'grid', gap: 16 }}>
      <div className="club-skelet" style={{ minHeight: 120 }} />
      <div className="club-skelet" style={{ minHeight: 180 }} />
      <div className="club-raster">
        <div className="club-skelet club-k8" style={{ minHeight: 320 }} />
        <div className="club-skelet club-k4" style={{ minHeight: 320 }} />
      </div>
    </div>
  )
}
