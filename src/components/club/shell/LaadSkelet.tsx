// Rustige skeleton terwijl een onderdeel van Club laadt. Drie vormen, zodat de
// pagina bij het laden al ongeveer de juiste plek inneemt (geen verspringing):
// 'rooster' (kop, tegels, groot raster), 'lijst' (kop, filterbalk, lijst) en
// 'kaarten' (kop en twee kolommen).

type Vorm = 'rooster' | 'lijst' | 'kaarten'

export function LaadSkelet({ label, vorm }: { label: string; vorm: Vorm }) {
  return (
    <div aria-busy="true" aria-label={label} role="status" style={{ display: 'grid', gap: 16 }}>
      <div className="club-skelet" style={{ minHeight: 96, maxWidth: 520 }} />
      {vorm === 'rooster' && (
        <>
          <div className="club-skelet" style={{ minHeight: 88 }} />
          <div className="club-skelet" style={{ minHeight: 48 }} />
          <div className="club-skelet" style={{ minHeight: 480 }} />
        </>
      )}
      {vorm === 'lijst' && (
        <>
          <div className="club-skelet" style={{ minHeight: 48 }} />
          <div className="club-skelet" style={{ minHeight: 420 }} />
        </>
      )}
      {vorm === 'kaarten' && (
        <div className="club-raster">
          <div className="club-skelet club-k8" style={{ minHeight: 360 }} />
          <div className="club-skelet club-k4" style={{ minHeight: 360 }} />
        </div>
      )}
    </div>
  )
}
