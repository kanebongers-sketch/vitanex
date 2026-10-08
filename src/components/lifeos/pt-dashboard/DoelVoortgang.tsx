import { statusLabel, type DoelStatus, type DoelenWeergave, type Voortgang } from '@/lib/lifeos/pt-dashboard/doelen'

// Doelen met voortgangsbalken. Puur weergave: stand, status en uitleg komen uit
// `voortgang` (lib/lifeos/pt-dashboard/doelen.ts) — daar staat ook de regel
// voor "op koers". Status staat altijd als tekst in beeld, niet alleen als kleur.

const BADGE: Record<DoelStatus, string> = {
  gehaald: 'ptd-badge ptd-badge--accent',
  op_koers: 'ptd-badge',
  achter: 'ptd-badge ptd-badge--let-op',
}

/** De sectie op /<naam>. Wordt alleen gerenderd als er doelen zijn. */
export function DoelVoortgang({ weergave }: { weergave: DoelenWeergave }) {
  return (
    <section className="ptd-sectie" aria-labelledby="doelen-kop">
      <div className="ptd-sectiekop">
        <h2 id="doelen-kop">Je doelen</h2>
        <span>gezet door Kane</span>
      </div>
      {weergave.notitie ? <p className="ptd-doel-notitie">{weergave.notitie}</p> : null}
      {weergave.items.length > 0 ? <DoelLijst items={weergave.items} /> : null}
    </section>
  )
}

export function DoelLijst({ items }: { items: readonly Voortgang[] }) {
  return (
    <ul className="ptd-doelen">
      {items.map((v) => <DoelRij key={v.soort} v={v} />)}
    </ul>
  )
}

function DoelRij({ v }: { v: Voortgang }) {
  const status = statusLabel(v)
  const labelId = `doel-${v.soort}`
  return (
    <li className="ptd-doel">
      <div className="ptd-rij-kop">
        <span id={labelId} className="ptd-doel-label">{v.label}</span>
        <span className={BADGE[v.status]}>{status}</span>
      </div>
      <p className="ptd-doel-stand">
        <strong>{v.stand}</strong> <span>van {v.doel}</span>
      </p>
      <div
        className="ptd-balk"
        role="progressbar"
        aria-labelledby={labelId}
        aria-valuemin={0}
        aria-valuemax={v.doel}
        aria-valuenow={Math.min(v.stand, v.doel)}
        aria-valuetext={`${v.stand} van ${v.doel} — ${status}`}
      >
        <span className="ptd-balk-vul" style={{ transform: `scaleX(${v.procent / 100})` }} />
        {v.verwacht ? <span className="ptd-balk-merk" style={{ left: `${Math.min(100, (v.verwacht / v.doel) * 100)}%` }} aria-hidden /> : null}
      </div>
      <p className="ptd-uitleg">{v.uitleg}</p>
    </li>
  )
}
