import type { Vestiging } from '@/lib/club/kern/vestiging'
import { LidNaamLink } from '@/components/club/shell/LidNaamLink'
import { NU_BINNEN_MIN, type DagSamenvatting } from '@/lib/club/checkin/regels'
import { tijdNl } from '@/lib/club/leden/tijd'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { CHECKIN } from '@/lib/aiyourgym/taal/woorden/club/checkin'
import { Avatar } from '@/components/club/ontwerp/Avatar'

// Rechts op het baliescherm: wie er nu (waarschijnlijk) binnen is, de teller
// van vandaag en de laatste tien check-ins. "Nu binnen" is een schatting: we
// hebben geen uitcheck, dus iedereen die in de laatste 90 minuten incheckte.

interface NuBinnenProps {
  samenvatting: DagSamenvatting | null
  vestiging: Vestiging
  /** Mag deze persoon Leden zien? Dan is elke naam een link naar de ledenkaart. */
  magLeden: boolean
  /** false op Vandaag: de tellers staan daar al groot in beeld (Nu binnen, check-ins vandaag). */
  tellers?: boolean
}

export async function NuBinnen({ samenvatting, vestiging, magLeden, tellers = true }: NuBinnenProps) {
  const t = (await clubTekst(CHECKIN)).binnen
  const bron = (b: string) => (b in t.bron ? t.bron[b as keyof typeof t.bron] : b)
  if (!samenvatting) {
    return (
      <aside className="club-checkin-paneel" aria-label={t.vandaag}>
        <p className="club-melding club-melding--fout" role="alert">{t.fout}</p>
      </aside>
    )
  }
  return (
    <aside className="club-checkin-paneel" aria-label={t.vandaag}>
      {tellers && (
        <div className="club-checkin-tellers">
          <div className="club-checkin-teller club-checkin-teller--nu">
            <span className="club-tegel-label">{t.nuBinnen}</span>
            <span className="club-checkin-teller-getal club-getal">{samenvatting.binnen.length}</span>
            <span className="club-tegel-sub">{t.laatsteMin(NU_BINNEN_MIN)}</span>
          </div>
          <div className="club-checkin-teller">
            <span className="club-tegel-label">{t.vandaag}</span>
            <span className="club-checkin-teller-getal club-getal">{samenvatting.vandaag}</span>
            <span className="club-tegel-sub">{t.sindsMiddernacht}</span>
          </div>
        </div>
      )}

      <section className="club-kaart club-kaart--vlak" aria-labelledby="binnen-kop">
        <h2 id="binnen-kop">{t.nuBinnen}</h2>
        {samenvatting.binnen.length ? (
          <ul className="club-checkin-binnen">
            {samenvatting.binnen.map((c) => (
              <li key={c.id}>
                <Avatar naam={c.naam ?? t.onbekend} foto={{ soort: 'lid', id: c.lidId, versie: c.foto }} maat={28} />
                <LidNaamLink lidId={c.lidId} vestiging={vestiging} magLeden={magLeden} tab="planning">{c.naam ?? t.onbekend}</LidNaamLink>
                <span className="club-getal club-zacht">{tijdNl(c.op)}</span>
              </li>
            ))}
          </ul>
        ) : <p className="club-hint">{t.niemand(NU_BINNEN_MIN)}</p>}
      </section>

      <section className="club-kaart club-kaart--vlak" aria-labelledby="laatste-kop">
        <h2 id="laatste-kop">{t.laatste}</h2>
        {samenvatting.laatste.length ? (
          <ol className="club-lijst">
            {samenvatting.laatste.map((c) => (
              <li key={c.id} className="club-rij">
                <span className="club-checkin-tijd club-getal">{tijdNl(c.op)}</span>
                <span className="club-rij-hoofd"><LidNaamLink lidId={c.lidId} vestiging={vestiging} magLeden={magLeden} tab="planning" className="club-rij-titel">{c.naam ?? t.onbekend}</LidNaamLink></span>
                <span className="club-chip club-chip--geen">{bron(c.bron)}</span>
              </li>
            ))}
          </ol>
        ) : <p className="club-hint">{t.nogNiemand}</p>}
      </section>
    </aside>
  )
}
