import Link from 'next/link'
import { eigenaarGegevens } from '@/lib/lifeos/pt-dashboard/sessie'
import { huidigeWeek, weekLabel } from '@/lib/lifeos/pt-dashboard/checkin'
import { haalCheckinsVoor } from '@/lib/lifeos/pt-dashboard/checkin-opslag'
import { haalOpenPunten } from '@/lib/lifeos/pt-coaching/opslag'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { CheckinKaart } from './CheckinKaart'
import { TEAM_FOUT } from './teksten'
import { CoachgesprekkenBeheer } from '@/components/lifeos/pt-beheer/CoachgesprekkenBeheer'

// /<eigenaar>/coach — wat elke PT'er deze week invulde ter voorbereiding op het
// coachgesprek met Kane, plus de open aandachtspunten uit eerdere gesprekken.
// Hetzelfde wat de PT'er zelf op zijn coach-pagina ziet. Alleen lezen.

export async function EigenaarCoach({ code, beheerder = false }: { code: string; beheerder?: boolean }) {
  const g = await eigenaarGegevens(code)
  if (!g) return null
  if (!g.team) return <Foutmelding bericht={TEAM_FOUT} />
  const week = huidigeWeek(new Date())
  // Alleen PT'ers: de beheerder traint wel klanten, maar heeft geen coachgesprek.
  const pts = g.team.team.filter((p) => p.id !== g.team?.beheerderId)
  const ids = pts.map((p) => p.id)
  const [checkins, punten] = await Promise.all([
    haalCheckinsVoor(g.admin, g.link.userId, ids, week),
    haalOpenPunten(g.admin, g.link.userId, ids),
  ])
  const ingevuld = pts.filter((p) => checkins.has(p.id)).length

  return (
    <>
      {beheerder ? <CoachgesprekkenBeheer /> : null}
      <section className="ptd-sectie" aria-labelledby="eig-coach-kop">
        <div className="ptd-sectiekop">
          <h2 id="eig-coach-kop">Check-ins van het team</h2>
          <span>{weekLabel(week)} · {ingevuld} van {pts.length} ingevuld</span>
        </div>
        <p className="ptd-hint">De weekcheck-in die elke PT&apos;er invult vóór het gesprek met Kane, en de aandachtspunten die nog openstaan.</p>
        <ul className="ptd-lijst">
          {pts.map((p) => {
            const c = checkins.get(p.id)
            const open = punten.get(p.id) ?? []
            return (
              <li key={p.id} className="ptd-kaart ptd-coach-pt">
                <div className="ptd-rij-kop">
                  <Link className="ptd-naam ptd-link" href={`/${code}/team/${p.id}`}>{p.naam}</Link>
                  <span className={c ? 'ptd-badge ptd-badge--accent' : 'ptd-badge ptd-badge--stil'}>{c ? 'Check-in ingevuld' : 'Nog geen check-in'}</span>
                </div>
                {c ? <CheckinKaart checkin={c} /> : null}
                {open.length > 0 ? (
                  <div>
                    <p className="ptd-label">Open aandachtspunten · {open.length}</p>
                    <ul className="ptd-punten">
                      {open.map((x) => <li key={x.id} className="ptd-tekst">{x.tekst}</li>)}
                    </ul>
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>
      </section>
    </>
  )
}
