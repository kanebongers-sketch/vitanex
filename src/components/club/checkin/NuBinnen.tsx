import Link from 'next/link'
import { clubPad, type Vestiging } from '@/lib/club/kern/vestiging'
import { NU_BINNEN_MIN, type DagSamenvatting } from '@/lib/club/checkin/regels'
import { tijdNl } from '@/lib/club/leden/tijd'

// Rechts op het baliescherm: wie er nu (waarschijnlijk) binnen is, de teller
// van vandaag en de laatste tien check-ins. "Nu binnen" is een schatting: we
// hebben geen uitcheck, dus iedereen die in de laatste 90 minuten incheckte.

const BRON: Record<string, string> = { balie: 'Balie', qr: 'QR', bandje: 'Bandje', les: 'Les' }

interface NuBinnenProps {
  samenvatting: DagSamenvatting | null
  vestiging: Vestiging
}

export function NuBinnen({ samenvatting, vestiging }: NuBinnenProps) {
  if (!samenvatting) {
    return (
      <aside className="club-checkin-paneel" aria-label="Vandaag">
        <p className="club-melding club-melding--fout" role="alert">De check-ins van vandaag konden niet worden geladen.</p>
      </aside>
    )
  }
  return (
    <aside className="club-checkin-paneel" aria-label="Vandaag">
      <div className="club-checkin-tellers">
        <div className="club-checkin-teller club-checkin-teller--nu">
          <span className="club-tegel-label">Nu binnen</span>
          <span className="club-checkin-teller-getal club-getal">{samenvatting.binnen.length}</span>
          <span className="club-tegel-sub">Ingecheckt in de laatste {NU_BINNEN_MIN} min</span>
        </div>
        <div className="club-checkin-teller">
          <span className="club-tegel-label">Vandaag</span>
          <span className="club-checkin-teller-getal club-getal">{samenvatting.vandaag}</span>
          <span className="club-tegel-sub">Check-ins sinds middernacht</span>
        </div>
      </div>

      <section className="club-kaart club-kaart--vlak" aria-labelledby="binnen-kop">
        <h2 id="binnen-kop">Nu binnen</h2>
        {samenvatting.binnen.length ? (
          <ul className="club-checkin-binnen">
            {samenvatting.binnen.map((c) => (
              <li key={c.id}>
                <Link href={clubPad(`/leden/${c.lidId}`, vestiging)}>{c.naam ?? 'Onbekend lid'}</Link>
                <span className="club-getal club-zacht">{tijdNl(c.op)}</span>
              </li>
            ))}
          </ul>
        ) : <p className="club-hint">Niemand ingecheckt in de laatste {NU_BINNEN_MIN} minuten.</p>}
      </section>

      <section className="club-kaart club-kaart--vlak" aria-labelledby="laatste-kop">
        <h2 id="laatste-kop">Laatste check-ins</h2>
        {samenvatting.laatste.length ? (
          <ol className="club-lijst">
            {samenvatting.laatste.map((c) => (
              <li key={c.id} className="club-rij">
                <span className="club-checkin-tijd club-getal">{tijdNl(c.op)}</span>
                <span className="club-rij-hoofd"><span className="club-rij-titel">{c.naam ?? 'Onbekend lid'}</span></span>
                <span className="club-chip club-chip--geen">{BRON[c.bron] ?? c.bron}</span>
              </li>
            ))}
          </ol>
        ) : <p className="club-hint">Nog niemand ingecheckt vandaag.</p>}
      </section>
    </aside>
  )
}
