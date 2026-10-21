// Rustige skeleton terwijl de ledenkaart geladen wordt.

export default function LidLaden() {
  return (
    <div aria-busy="true" aria-label="Ledenkaart laden" role="status" style={{ display: 'grid', gap: 16 }}>
      <div className="club-skelet" style={{ minHeight: 150 }} />
      <div className="club-raster">
        <div className="club-k8" style={{ display: 'grid', gap: 16 }}>
          <div className="club-skelet" style={{ minHeight: 240 }} />
          <div className="club-skelet" style={{ minHeight: 280 }} />
        </div>
        <div className="club-skelet club-k4" style={{ minHeight: 360 }} />
      </div>
    </div>
  )
}
