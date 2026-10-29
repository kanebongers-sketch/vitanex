import type { LogRegel } from '@/lib/club/training/rijen'
import { dagLetter } from '@/lib/club/training/typen'
import { toonDatum, trainingenPerWeek } from '@/lib/club/training/weergave'
import { clubTekst, getTaal } from '@/lib/aiyourgym/taal/server'
import { CLUB_TRAINING } from '@/lib/aiyourgym/taal/woorden/club/training'
import { SCHEMA_WEERGAVE } from '@/lib/aiyourgym/taal/woorden/club/schema-weergave'
import { rondeDezeWeek } from '@/lib/club/ontwerp/reeks'
import { DiepteRing } from '../ontwerp/DiepteRing'

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
  const wk = (await clubTekst(SCHEMA_WEERGAVE)).week
  // Alle regels horen bij dit schema (de pagina haalt de log van een schema op).
  const ronde = rondeDezeWeek(dagTitels.map((_, i) => ({ dag: i + 1 })), log, log[0]?.schemaId ?? '', nu)
  return (
    <section className="club-kaart club-training-log" aria-label={t.label}>
      <h2>{t.titel}</h2>
      <div className="club-training-week-nu">
        <DiepteRing gedaan={ronde.gedaan} totaal={ronde.totaal} label={wk.ring(ronde.gedaan, ronde.totaal)} maat={88} />
        <div className="club-training-week-tekst">
          <p className="club-gekozen-boven">{wk.kop}</p>
          <ul className="club-ronde">
            {ronde.dagen.map((d) => (
              <li key={d.dag} data-gedaan={d.gedaan || undefined}>
                {wk.dag(dagLetter(d.dag))}
                <span className="club-sr">, {d.gedaan ? wk.gedaan : wk.open}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
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
