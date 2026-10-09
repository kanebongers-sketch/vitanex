// ─── PT-team — de week in een paar regels, voor de weekmail (PUUR) ──────────
// Per PT'er wat hij de afgelopen zeven dagen in zijn dashboard invulde: nieuwe
// leads, gestarte PT-klanten, opvolgingen die nu te laat zijn en de lopende
// abonnementen. Alleen PT'ers met iets te melden krijgen een regel; daaronder één
// regel totaal. Alles afgeleid uit wat er is ingevuld — niets geschat.

import { OPEN_STATUSSEN, type Lead } from '@/lib/lifeos/leads/leads'
import { euro, isLopend, klantPrijs, plusDagen, type PtKlant } from './abonnementen'

export interface PtWeekCijfers {
  leads: number
  nieuweKlanten: number
  teLaat: number
  lopend: number
  /** Som van de maandprijzen van lopende, niet-bevroren abonnementen (incl. btw). */
  maandwaarde: number
}

export interface PtTeamWeek {
  /** Eén regel per PT'er met iets te melden: "Joey — 3 leads · 1 nieuwe klant". */
  regels: { naam: string; tekst: string }[]
  totaal: string
}

const meervoud = (n: number, een: string, meer: string): string => `${n} ${n === 1 ? een : meer}`

export function ptWeekCijfers(leads: readonly Lead[], klanten: readonly PtKlant[], vandaag: string): PtWeekCijfers {
  const van = plusDagen(vandaag, -7)
  const lopend = klanten.filter((k) => isLopend(k, vandaag))
  return {
    leads: leads.filter((l) => l.gesprokenOp >= van && l.gesprokenOp < vandaag).length,
    nieuweKlanten: klanten.filter((k) => k.startdatum >= van && k.startdatum < vandaag).length,
    teLaat: leads.filter((l) => OPEN_STATUSSEN.includes(l.status) && l.opvolgdatum !== null && l.opvolgdatum < vandaag).length,
    lopend: lopend.length,
    // Wat klanten écht betalen (afwijkende prijs telt mee), net als in het team-overzicht.
    maandwaarde: lopend.filter((k) => k.status !== 'bevroren').reduce((s, k) => s + klantPrijs(k), 0),
  }
}

function heeftIets(c: PtWeekCijfers): boolean {
  return c.leads > 0 || c.nieuweKlanten > 0 || c.teLaat > 0 || c.lopend > 0
}

/** "3 leads · 1 nieuwe klant · 2 opvolgingen te laat · 4 lopende abonnementen (€1.796 p/m)" — nullen vallen weg. */
export function weekTekst(c: PtWeekCijfers): string {
  const delen: string[] = []
  if (c.leads > 0) delen.push(meervoud(c.leads, 'lead', 'leads'))
  if (c.nieuweKlanten > 0) delen.push(meervoud(c.nieuweKlanten, 'nieuwe klant', 'nieuwe klanten'))
  if (c.teLaat > 0) delen.push(`${meervoud(c.teLaat, 'opvolging', 'opvolgingen')} te laat`)
  if (c.lopend > 0) {
    delen.push(`${meervoud(c.lopend, 'lopend abonnement', 'lopende abonnementen')} (${euro(c.maandwaarde)} p/m)`)
  }
  return delen.join(' · ')
}

/**
 * De weekmail-sectie voor het PT-team. `vandaag` = de verzenddag (YYYY-MM-DD);
 * "de week" is de zeven dagen ervóór. Null zonder PT'ers: dan geen sectie.
 */
export function bouwPtTeamWeek(
  team: readonly { id: string; naam: string }[],
  leads: ReadonlyMap<string, readonly Lead[]>,
  klanten: ReadonlyMap<string, readonly PtKlant[]>,
  vandaag: string,
): PtTeamWeek | null {
  if (team.length === 0) return null
  const perPt = team.map((p) => ({ naam: p.naam, c: ptWeekCijfers(leads.get(p.id) ?? [], klanten.get(p.id) ?? [], vandaag) }))
  const som: PtWeekCijfers = perPt.reduce(
    (s, { c }) => ({
      leads: s.leads + c.leads,
      nieuweKlanten: s.nieuweKlanten + c.nieuweKlanten,
      teLaat: s.teLaat + c.teLaat,
      lopend: s.lopend + c.lopend,
      maandwaarde: s.maandwaarde + c.maandwaarde,
    }),
    { leads: 0, nieuweKlanten: 0, teLaat: 0, lopend: 0, maandwaarde: 0 },
  )
  const regels = perPt.filter(({ c }) => heeftIets(c)).map(({ naam, c }) => ({ naam, tekst: weekTekst(c) }))
  const totaal = heeftIets(som)
    ? `Team: ${som.leads === 0 ? 'geen nieuwe leads · ' : ''}${weekTekst(som)}`
    : 'Niemand van het PT-team vulde afgelopen week iets in.'
  return { regels, totaal }
}
