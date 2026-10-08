import { eindeVastePeriode } from '@/lib/lifeos/pt-dashboard/abonnementen'
import { dagKort } from '@/lib/lifeos/pt-dashboard/datum'
import { FASES, MOMENTEN, TRAJECT_WEKEN, trajectStand } from '@/lib/lifeos/pt-dashboard/traject'

// Het 13-weekse traject van één klant: week 0 (intake) t/m 13 in drie fases,
// de huidige week gemarkeerd, meetmomenten als stip, en wat er deze week hoort
// te gebeuren. De standaardopbouw; geen planning van de PT'er zelf. Puur.

const WEKEN = Array.from({ length: TRAJECT_WEKEN + 1 }, (_, i) => i)

function weekTitel(week: number): string {
  const momenten = MOMENTEN.filter((m) => m.week === week).map((m) => m.label)
  const naam = week === 0 ? 'Week 0 (intake)' : `Week ${week}`
  return momenten.length > 0 ? `${naam}: ${momenten.join('; ')}` : naam
}

function stand(week: number, nu: number): string {
  if (week === nu) return 'ffdos-week ffdos-week--nu'
  return week < nu ? 'ffdos-week ffdos-week--voorbij' : 'ffdos-week'
}

export function TrajectTijdlijn({ startdatum, vandaag }: { startdatum: string; vandaag: string }) {
  const s = trajectStand(startdatum, vandaag)
  const vastTot = eindeVastePeriode(startdatum)
  const kopTekst = s.week === 0 ? 'Nog niet gestart' : s.afgerond ? `Afgerond · week ${s.week}` : `Week ${s.week} van ${TRAJECT_WEKEN}`
  return (
    <section className="ptd-kaart ffdos-traject" aria-labelledby="ffdos-traject-kop">
      <div className="ptd-sectiekop">
        <h2 id="ffdos-traject-kop">Traject</h2>
        <span className="ffdos-weeknr">{kopTekst}</span>
      </div>
      {s.fase ? (
        <p className="ptd-tekst">
          <strong className="ffdos-fase">Fase {s.fase.nr} · {s.fase.naam}.</strong> {s.fase.focus}
        </p>
      ) : null}

      <div className="ffdos-tijdlijn">
        <ol className="ffdos-weken" aria-label="Weken van het traject">
          {WEKEN.map((w) => {
            const moment = MOMENTEN.some((m) => m.week === w)
            return (
              <li key={w} className={stand(w, s.week)} aria-current={w === s.week ? 'step' : undefined} title={weekTitel(w)}>
                <span aria-hidden>{w}</span>
                {moment ? <span className="ffdos-stip" aria-hidden /> : null}
                <span className="sr-only">{weekTitel(w)}{w === s.week ? ' (deze week)' : ''}</span>
              </li>
            )
          })}
        </ol>
        <div className="ffdos-fases" aria-hidden>
          {FASES.map((f) => (
            <span key={f.nr} className={s.fase?.nr === f.nr ? 'ffdos-faseband ffdos-faseband--nu' : 'ffdos-faseband'} style={{ gridColumn: `${f.vanWeek + 1} / ${f.totWeek + 2}` }}>
              {f.nr}. {f.naam}
            </span>
          ))}
        </div>
      </div>

      <div className="ffdos-deze-week">
        <p className="ptd-label">Deze week{s.bereik ? ` · ${dagKort(s.bereik.van)} – ${dagKort(s.bereik.tot)}` : ''}</p>
        <ul className="ffdos-taken">
          {s.taken.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        {s.volgende && s.volgende.moment.week !== s.week ? (
          <p className="ptd-hint">
            Volgende: {s.volgende.moment.label} (week {s.volgende.moment.week}, vanaf {dagKort(s.volgende.van)})
          </p>
        ) : null}
        <p className="ptd-hint">Vaste periode van het abonnement t/m {dagKort(vastTot)}.</p>
      </div>
    </section>
  )
}
