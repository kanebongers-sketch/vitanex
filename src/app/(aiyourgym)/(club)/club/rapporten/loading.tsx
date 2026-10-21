// Rustige skeleton terwijl het rapport wordt opgebouwd.

export default function RapportenLaden() {
  return (
    <div aria-busy="true" aria-label="Rapport laden" style={{ display: 'grid', gap: 16 }}>
      <div className="club-skelet" style={{ minHeight: 110 }} />
      <div className="club-raster">
        <div className="club-skelet club-k4" style={{ minHeight: 420 }} />
        <div className="club-skelet club-k8" style={{ minHeight: 420 }} />
      </div>
    </div>
  )
}
