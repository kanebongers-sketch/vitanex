// Laden van een PT-pagina: de kopbalk en tabs (layout) blijven staan, hier een
// rustig skelet van tegels en een lijst. Geen spinner; bij reduced motion stil.

export default function PtLaden() {
  return (
    <div className="ptd-laden" aria-busy="true" aria-live="polite">
      <span className="sr-only">Laden…</span>
      <div className="ptd-tegels" aria-hidden>
        {Array.from({ length: 4 }, (_, i) => <div key={i} className="ptd-skelet ptd-skelet--tegel" />)}
      </div>
      <div className="ptd-lijst" aria-hidden>
        {Array.from({ length: 3 }, (_, i) => <div key={i} className="ptd-skelet ptd-skelet--rij" />)}
      </div>
    </div>
  )
}
