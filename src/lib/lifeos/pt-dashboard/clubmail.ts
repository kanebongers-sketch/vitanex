// ─── PT-app — wekelijkse clubmail voor een clubmanager (PUUR) ──────────────
// Elke maandag: wat er afgelopen week in zijn club(s) gebeurde. Bewust zonder
// namen van leads of klanten — mail is minder goed beveiligd dan de app; de
// details staan in de app achter de pincode. Alleen aantallen per PT'er en een
// link naar de app.

import type { Lead } from '@/lib/lifeos/leads/leads'
import { moetOpvolgen } from '@/lib/lifeos/leads/leads'
import { plusDagen, type PtKlant } from './abonnementen'
import type { PtTeamGegevens } from './team-opslag'

export interface ClubWeekRij {
  naam: string
  nieuweLeads: number
  teLaat: number
  nieuweKlanten: number
  gestopt: number
}

export interface ClubWeek {
  rijen: ClubWeekRij[]
  totaal: Omit<ClubWeekRij, 'naam'>
}

const gestoptDezeWeek = (k: PtKlant, van: string, tot: string) =>
  (k.status === 'opgezegd' || k.status === 'gestopt') && k.opgezegdOp !== null && k.opgezegdOp >= van && k.opgezegdOp < tot

/** De week vóór `vandaag` (7 dagen, vandaag niet meegeteld) voor de al op club gefilterde gegevens. */
export function clubWeek(g: Pick<PtTeamGegevens, 'team' | 'leads' | 'klanten'>, vandaag: string): ClubWeek {
  const van = plusDagen(vandaag, -7)
  const rijen = g.team
    .map((p): ClubWeekRij => {
      const leads: readonly Lead[] = g.leads.get(p.id) ?? []
      const klanten: readonly PtKlant[] = g.klanten.get(p.id) ?? []
      return {
        naam: p.naam,
        nieuweLeads: leads.filter((l) => l.gesprokenOp >= van && l.gesprokenOp < vandaag).length,
        teLaat: leads.filter((l) => moetOpvolgen(l, vandaag) && l.opvolgdatum !== vandaag).length,
        nieuweKlanten: klanten.filter((k) => k.startdatum >= van && k.startdatum < vandaag).length,
        gestopt: klanten.filter((k) => gestoptDezeWeek(k, van, vandaag)).length,
      }
    })
    .filter((r) => r.nieuweLeads + r.teLaat + r.nieuweKlanten + r.gestopt > 0)
    .sort((a, b) => a.naam.localeCompare(b.naam, 'nl'))
  const som = (f: (r: ClubWeekRij) => number) => rijen.reduce((s, r) => s + f(r), 0)
  return { rijen, totaal: { nieuweLeads: som((r) => r.nieuweLeads), teLaat: som((r) => r.teLaat), nieuweKlanten: som((r) => r.nieuweKlanten), gestopt: som((r) => r.gestopt) } }
}

function escape(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/** Onderwerp, platte tekst en html van de clubmail. */
export function bouwClubmail(naam: string, clubNaam: string, week: ClubWeek, appUrl: string): { onderwerp: string; tekst: string; html: string } {
  const t = week.totaal
  const onderwerp = `PT ${clubNaam}: ${t.nieuweLeads} nieuwe ${t.nieuweLeads === 1 ? 'lead' : 'leads'}, ${t.nieuweKlanten} nieuwe ${t.nieuweKlanten === 1 ? 'klant' : 'klanten'}`
  const regels = week.rijen.map((r) => `- ${r.naam}: ${r.nieuweLeads} leads, ${r.teLaat} te laat, ${r.nieuweKlanten} nieuwe klanten, ${r.gestopt} gestopt`)
  const leeg = week.rijen.length === 0
  const tekst = [
    `Hoi ${naam},`,
    '',
    `Afgelopen week bij de PT in ${clubNaam}:`,
    `${t.nieuweLeads} nieuwe leads · ${t.teLaat} opvolgingen te laat · ${t.nieuweKlanten} nieuwe klanten · ${t.gestopt} gestopt of opgezegd`,
    '',
    ...(leeg ? ['Er is afgelopen week niets ingevuld.'] : ['Per PT\'er:', ...regels]),
    '',
    `Alle details (achter je pincode): ${appUrl}`,
  ].join('\n')
  const rijenHtml = week.rijen
    .map((r) => `<tr><td>${escape(r.naam)}</td><td>${r.nieuweLeads}</td><td>${r.teLaat}</td><td>${r.nieuweKlanten}</td><td>${r.gestopt}</td></tr>`)
    .join('')
  const html = `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.5;color:#111">
<p>Hoi ${escape(naam)},</p>
<p>Afgelopen week bij de PT in <strong>${escape(clubNaam)}</strong>:<br>
<strong>${t.nieuweLeads}</strong> nieuwe leads · <strong>${t.teLaat}</strong> opvolgingen te laat · <strong>${t.nieuweKlanten}</strong> nieuwe klanten · <strong>${t.gestopt}</strong> gestopt of opgezegd</p>
${leeg ? '<p>Er is afgelopen week niets ingevuld.</p>' : `<table cellpadding="6" style="border-collapse:collapse"><thead><tr><th align="left">PT'er</th><th>Leads</th><th>Te laat</th><th>Nieuwe klanten</th><th>Gestopt</th></tr></thead><tbody>${rijenHtml}</tbody></table>`}
<p><a href="${escape(appUrl)}">Open de PT-app</a> voor alle details (achter je pincode).</p>
</div>`
  return { onderwerp, tekst, html }
}
