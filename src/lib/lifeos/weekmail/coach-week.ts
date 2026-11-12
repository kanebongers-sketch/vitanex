// ─── LifeOS — weekmail: blok coachgesprekken met de PT'ers (PUUR) ───────────
// Besluit Kane 12-11-2026: de weekmail van maandagochtend zegt kort hoe de
// coachgesprekken van deze week ervoor staan. "x van y gesprekken deze week
// ingepland", wie deze week nog niet is ingepland, en wie vorige week een gesprek
// had zonder vervolgafspraak, met een link naar de coachpagina van Kane.
// Geen fetch, geen DB: de route geeft de rijen uit `haalCoachTeam` mee.
//
// EERLIJK: zonder leesbare agenda geen tellingen of namen (die zouden niet
// kloppen), alleen de melding dat de afspraken niet te lezen waren.

import { moetDoorplannen, nietDezeWeek, telCoach, type CoachRij } from '@/lib/lifeos/pt-coaching/coach-overzicht'

const DAG_MS = 24 * 60 * 60 * 1000

export type CoachWeek =
  | {
      staat: 'ok'
      /** Gesprek deze week: geweest of ingepland tussen maandag en zondag. */
      dezeWeek: number
      totaal: number
      nietIngepland: string[]
      zonderVervolg: string[]
      link: string | null
    }
  | { staat: 'geen_agenda' | 'fout'; link: string | null }

/** Wat de route weet over de agenda: gelezen, niet gekoppeld of fout. */
export type CoachAgendaStaat = 'ok' | 'niet_gekoppeld' | 'fout'

/**
 * Wie vorige week (maandag tot en met zondag) een coachgesprek had en nu nog geen
 * volgende afspraak in de agenda heeft. Zelfde regel als `moetDoorplannen`, maar
 * dan voor de week ervoor: op maandagochtend is "deze week" nog leeg.
 */
export function vorigeWeekZonderVervolg(rijen: readonly CoachRij[], nu: Date): CoachRij[] {
  return moetDoorplannen(rijen, new Date(nu.getTime() - 7 * DAG_MS))
}

function opNaam(rijen: readonly CoachRij[]): string[] {
  return rijen.map((r) => r.naam).sort((a, b) => a.localeCompare(b, 'nl'))
}

/** Het blok voor de weekmail uit de rijen van `haalCoachTeam`. */
export function bouwCoachWeek(
  rijen: readonly CoachRij[],
  agenda: CoachAgendaStaat,
  nu: Date,
  link: string | null,
): CoachWeek {
  if (agenda === 'niet_gekoppeld') return { staat: 'geen_agenda', link }
  if (agenda === 'fout') return { staat: 'fout', link }
  const t = telCoach(rijen, nu)
  return {
    staat: 'ok',
    dezeWeek: t.dezeWeek,
    totaal: t.totaal,
    nietIngepland: opNaam(nietDezeWeek(rijen, nu)),
    zonderVervolg: opNaam(vorigeWeekZonderVervolg(rijen, nu)),
    link,
  }
}

const NIET_TE_LEZEN: Record<'geen_agenda' | 'fout', string> = {
  geen_agenda: 'De agenda is niet gekoppeld, dus de afspraken waren niet te lezen. Bekijk de stand op de coachpagina.',
  fout: 'De afspraken waren nu niet te lezen. Bekijk de stand op de coachpagina.',
}

/** De regels van het blok (zonder kop), voor de platte tekst en de HTML. */
export function coachWeekRegels(blok: CoachWeek): string[] {
  if (blok.staat !== 'ok') return [NIET_TE_LEZEN[blok.staat]]
  if (blok.totaal === 0) return ['Er staan nog geen PT\'ers in het team.']
  const regels = [`${blok.dezeWeek} van ${blok.totaal} gesprekken deze week ingepland.`]
  if (blok.nietIngepland.length > 0) regels.push(`Deze week nog niet ingepland: ${blok.nietIngepland.join(', ')}.`)
  else regels.push('Iedereen heeft deze week een gesprek.')
  if (blok.zonderVervolg.length > 0) {
    regels.push(`Vorige week een gesprek, nog geen vervolgafspraak: ${blok.zonderVervolg.join(', ')}.`)
  }
  return regels
}

/** Platte tekst: kop, regels en de link. */
export function coachWeekTekst(blok: CoachWeek): string[] {
  return ['', 'COACHGESPREKKEN DEZE WEEK', ...coachWeekRegels(blok).map((r) => `- ${r}`), ...(blok.link ? [`Naar de coachpagina: ${blok.link}`] : [])]
}

function escape(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/** HTML met inline stijlen, in de stijl van de weekmail. */
export function coachWeekHtml(blok: CoachWeek): string {
  const kop = `<h2 style="margin:24px 0 0;font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:#5b6b86;">Coachgesprekken deze week</h2>`
  const regels = coachWeekRegels(blok)
    .map((r) => `<li>${escape(r)}</li>`)
    .join('')
  const link = blok.link
    ? `<p style="margin:8px 0 0;font-size:14px;"><a href="${escape(blok.link)}" style="color:#0b1b3a;font-weight:600;">Naar de coachpagina</a></p>`
    : ''
  return `${kop}<ul style="margin:6px 0 0;padding-left:18px;font-size:14px;line-height:1.7;color:#0b1b3a;">${regels}</ul>${link}`
}
