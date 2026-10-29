import type { LogRegel } from '@/lib/club/training/rijen'
import { dagLetter } from '@/lib/club/training/typen'
import { toonDatum, trainingenPerWeek } from '@/lib/club/training/weergave'
import { clubTekst, getTaal } from '@/lib/aiyourgym/taal/server'
import { CLUB_TRAINING } from '@/lib/aiyourgym/taal/woorden/club/training'

interface TrainingslogKaartProps {
  log: LogRegel[]
  dagTitels: string[]
  nu: Date
}

/** Wat het lid in de app afvinkte bij dit schema. Alleen lezen. */
export async function TrainingslogKaart({ log, dagTitels, nu }: TrainingslogKaartProps) {
  const taal = await getTaal()
  const t = (await clubTekst(CLUB_TRAINING)).log
  const weken = trainingenPerWeek(log, nu, 8)
  const max = Math.max(1, ...weken.map((w) => w.aantal))
  const recent = log.slice(0, 8)
  return (
    <section className="club-kaart club-training-log" aria-label={t.label}>
      <h2>{t.titel}</h2>
      <div className="club-training-logcijfer">
        <span className="club-tegel-getal">{log.length}</span>
        <span className="club-tegel-sub">{t.afgevinkt(log.length)}</span>
      </div>
      <div className="club-training-weken" role="img" aria-label={t.perWeek(weken.map((w) => w.aantal).join(', '))}>
        {weken.map((w) => (
          <span key={w.week} className="club-training-week" title={t.weekVan(toonDatum(w.week, taal), w.aantal)}>
            <i style={{ transform: `scaleY(${w.aantal / max})` }} data-leeg={w.aantal === 0} />
          </span>
        ))}
      </div>
      {recent.length === 0 ? (
        <p className="club-hint">{t.leeg}</p>
      ) : (
        <ul className="club-lijst">
          {recent.map((r) => (
            <li key={r.id} className="club-rij">
              <span className="club-rij-hoofd">
                <span className="club-rij-titel">{toonDatum(r.op, taal)}</span>
                <span className="club-rij-sub">
                  {r.dag ? `${t.dag(dagLetter(r.dag))}${dagTitels[r.dag - 1] ? ` · ${dagTitels[r.dag - 1]}` : ''}` : t.dagOnbekend}
                  {r.duurSec ? ` · ${t.minuten(Math.round(r.duurSec / 60))}` : r.aantalOefeningen > 0 ? ` · ${t.oefeningen(r.aantalOefeningen)}` : ''}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
