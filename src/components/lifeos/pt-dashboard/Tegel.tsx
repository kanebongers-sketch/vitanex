/** Eén kerncijfer: label, groot getal, korte uitleg. Puur weergave. */
export function Tegel({ getal, label, uitleg, accent = false }: { getal: string; label: string; uitleg?: string; accent?: boolean }) {
  return (
    <div className="ptd-tegel">
      <p className="ptd-label">{label}</p>
      <p className={accent ? 'ptd-getal ptd-getal--accent' : 'ptd-getal'}>{getal}</p>
      {uitleg ? <p className="ptd-uitleg">{uitleg}</p> : null}
    </div>
  )
}
