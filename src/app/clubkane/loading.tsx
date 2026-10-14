// Rustige skeleton terwijl een onderdeel van de clubsoftware laadt. Onderdelen met
// een eigen laadscherm (leden, check-in) gebruiken dat; de rest valt hierop terug.

export default function ClubLaden() {
  return (
    <div aria-busy="true" aria-label="Laden" role="status" style={{ display: 'grid', gap: 16 }}>
      <div className="club-skelet" style={{ minHeight: 96, maxWidth: 560 }} />
      <div className="club-skelet" style={{ minHeight: 160 }} />
      <div className="club-raster">
        <div className="club-skelet club-k7" style={{ minHeight: 320 }} />
        <div className="club-skelet club-k5" style={{ minHeight: 320 }} />
      </div>
    </div>
  )
}
