// ─── LifeOS — wekelijkse terugblik-mail (puur) ──────────────────────────────
// Elke maandagochtend een persoonlijke week-review: wat je afrondde, hoe de maand
// er financieel voor staat, en welke contacten verwateren. Geen fetch, geen DB:
// selectors + builder zijn puur (data in → regels/HTML uit), zodat de route ze
// best-effort voedt en dit bestand zonder mailserver of database testbaar is.
//
// EERLIJK (branding.md): elke regel steunt op een écht feit uit je eigen data. Een
// lege bron levert een eerlijke "niets deze week"-regel of geen sectie — nooit een
// verzonnen cijfer. "Fout ≠ leeg" leeft in de route: die geeft `null` door voor een
// bron die omviel, en dan valt de sectie weg i.p.v. een misleidende nul te tonen.

import type { Taak } from '@/lib/lifeos/taken/taken'
import type { Persoon } from '@/lib/lifeos/crm/crm'
import { contactVersheid } from '@/lib/lifeos/crm/versheid'

const TIJDZONE = 'Europe/Amsterdam'

/** Zoveel afgeronde taken en koude contacten tonen we bij naam; de rest als telling. */
const TAKEN_LIMIET = 12
const CONTACTEN_LIMIET = 8

const EURO_FMT = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' })

// ─── Selectors (puur) ───────────────────────────────────────────────────────

/**
 * De taken die je in [vanaf, tot) afvinkte. Keyt op `klaarOp` (het moment van
 * afvinken), niet op `datum` (de dag waarvoor hij gepland stond): een taak van
 * vorige maand die je deze week afmaakte, telt deze week. Een onleesbare `klaarOp`
 * telt niet mee — dan weten we het niet, en dan zeggen we het niet.
 */
export function afgerondeTakenSinds(taken: readonly Taak[], vanaf: Date, tot: Date): Taak[] {
  return taken.filter((t) => {
    if (!t.klaar || t.klaarOp === null) return false
    const moment = new Date(t.klaarOp)
    if (Number.isNaN(moment.getTime())) return false
    return moment.getTime() >= vanaf.getTime() && moment.getTime() < tot.getTime()
  })
}

/**
 * Contacten die verwateren: je sprak ze ooit, maar te lang geleden (`contactVersheid`
 * → koud). Nooit-gesproken telt hier NIET als koud (zie `versheid.ts`) — een lead die
 * je nog moet benaderen hoort in de dagmail-opvolging, niet in "je laat dit verwateren".
 * Langst-stil bovenaan: dat is degene die het eerst aandacht verdient.
 */
export function koudeContacten(
  personen: readonly Persoon[],
  vandaag: Date,
): { naam: string; dagen: number }[] {
  return personen
    .map((p) => ({ naam: p.naam, versheid: contactVersheid(p.laatsteContactOp, vandaag) }))
    .filter((x) => x.versheid.koud && x.versheid.dagen !== null)
    .map((x) => ({ naam: x.naam, dagen: x.versheid.dagen as number }))
    .sort((a, b) => b.dagen - a.dagen)
}

// ─── Builder (puur) ─────────────────────────────────────────────────────────

/** De financiële maandstand, of `null` als de bron omviel (dan geen finance-sectie). */
export interface WeekFinance {
  /** Leesbaar maandlabel, bv. 'september'. */
  maandLabel: string
  omzet: number
  kosten: number
  winst: number
  openstaand: number
  verlopenAantal: number
}

/**
 * Wat LifeOS zélf deed, voor de zelf-evaluatie. `null` = niet nagegaan (geen sectie).
 * Eerlijk: `hernoemd` telt de afspraken die LifeOS aantoonbaar zelf benoemde
 * (met geheugen), `gecorrigeerd` hoe vaak jij dat terugdraaide.
 */
export interface WeekZelf {
  hernoemd: number
  gecorrigeerd: number
}

export interface WeekmailInvoer {
  /** Titels van wat je deze week afvinkte (al gefilterd + begrensd hoort niet: dat doet de builder). */
  afgerondeTaken: readonly string[]
  finance: WeekFinance | null
  koudeContacten: readonly { naam: string; dagen: number }[]
  /**
   * PT-klanten die afhaken (zie `pt-klant/afhaak`): lopend abonnement, maar al
   * weken niet op PT. Optioneel: niet nagegaan of niemand → geen sectie.
   */
  afhaak?: readonly { naam: string; wekenGeleden: number }[]
  zelf: WeekZelf | null
}

export interface Weekmail {
  onderwerp: string
  html: string
  tekst: string
}

function datumLang(d: Date): string {
  return d.toLocaleDateString('nl-NL', { timeZone: TIJDZONE, day: 'numeric', month: 'long', year: 'numeric' })
}

function escape(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function euro(bedrag: number): string {
  return EURO_FMT.format(bedrag)
}

/** "3 weken" / "2 maanden" — grof, zoals de tegel-tekst; precisie hoort hier niet. */
function duurTekst(dagen: number): string {
  if (dagen < 14) return `${dagen} dagen`
  if (dagen < 60) return `${Math.round(dagen / 7)} weken`
  if (dagen < 365) return `${Math.round(dagen / 30)} maanden`
  const jaren = Math.floor(dagen / 365)
  return jaren === 1 ? '1 jaar' : `${jaren} jaar`
}

/**
 * De zelf-evaluatie-regels: wat LifeOS deed en hoe vaak jij het corrigeerde. Leeg
 * als er niets te melden is (geen hernoemingen, geen correcties) — geen sectie dan.
 */
function zelfRegels(zelf: WeekZelf | null): string[] {
  if (!zelf || (zelf.hernoemd === 0 && zelf.gecorrigeerd === 0)) return []
  const regels: string[] = []
  if (zelf.hernoemd > 0) {
    regels.push(
      `Ik benoemde ${zelf.hernoemd} ${zelf.hernoemd === 1 ? 'afspraak' : 'afspraken'} automatisch naar de juiste persoon.`,
    )
  }
  if (zelf.gecorrigeerd > 0) {
    regels.push(
      `Je corrigeerde me ${zelf.gecorrigeerd} keer — ${zelf.gecorrigeerd === 1 ? 'die afspraak laat' : 'die afspraken laat'} ik voortaan met rust.`,
    )
  }
  return regels
}

/**
 * Bouwt de week-terugblik. `dag` is de maandag waarop hij verstuurd wordt; de
 * secties beschrijven de zeven dagen ervóór.
 */
export function bouwWeekmail(dag: Date, invoer: WeekmailInvoer): Weekmail {
  const datum = datumLang(dag)
  const { afgerondeTaken, finance, koudeContacten: koud } = invoer
  const afhaak = invoer.afhaak ?? []
  const zelf = zelfRegels(invoer.zelf)

  const onderwerp = `Je week — terugblik ${datum}`

  // ── Afgerond ──
  const takenZichtbaar = afgerondeTaken.slice(0, TAKEN_LIMIET)
  const takenRest = afgerondeTaken.length - takenZichtbaar.length

  // ── Tekst (plain) ──
  const tekstAfgerond = afgerondeTaken.length
    ? [
        `AFGEROND (${afgerondeTaken.length})`,
        ...takenZichtbaar.map((t) => `- ${t}`),
        ...(takenRest > 0 ? [`- en nog ${takenRest} meer`] : []),
      ]
    : ['AFGEROND', 'Niets afgevinkt deze week. Dat zegt iets over het logboek, niet over je week.']

  const tekstFinance = finance
    ? [
        '',
        `FINANCE (${finance.maandLabel})`,
        `- Omzet: ${euro(finance.omzet)}`,
        `- Kosten: ${euro(finance.kosten)}`,
        `- Winst: ${euro(finance.winst)}`,
        `- Openstaand: ${euro(finance.openstaand)}${finance.verlopenAantal > 0 ? ` (${finance.verlopenAantal} over de vervaldatum)` : ''}`,
      ]
    : []

  const tekstKoud = koud.length
    ? [
        '',
        'VERWATEREND CONTACT',
        ...koud.slice(0, CONTACTEN_LIMIET).map((c) => `- ${c.naam} — ${duurTekst(c.dagen)} geen contact`),
        ...(koud.length > CONTACTEN_LIMIET ? [`- en nog ${koud.length - CONTACTEN_LIMIET} meer`] : []),
      ]
    : []

  const wekenTekst = (w: number): string => `${w} ${w === 1 ? 'week' : 'weken'} niet op PT`

  const tekstAfhaak = afhaak.length
    ? [
        '',
        'PT-KLANTEN DIE AFHAKEN',
        ...afhaak.slice(0, CONTACTEN_LIMIET).map((a) => `- ${a.naam} — ${wekenTekst(a.wekenGeleden)}`),
        ...(afhaak.length > CONTACTEN_LIMIET ? [`- en nog ${afhaak.length - CONTACTEN_LIMIET} meer`] : []),
      ]
    : []

  const tekstZelf = zelf.length ? ['', 'VAN LIFEOS ZELF', ...zelf.map((r) => `- ${r}`)] : []

  const tekst = [`Je week — terugblik ${datum}`, '', ...tekstAfgerond, ...tekstFinance, ...tekstAfhaak, ...tekstKoud, ...tekstZelf].join(
    '\n',
  )

  // ── HTML ── (inline styles: mailclients negeren <style>-blokken vaak)
  const kop = (t: string): string =>
    `<h2 style="margin:24px 0 0;font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:#5b6b86;">${escape(t)}</h2>`

  const afgerondHtml = afgerondeTaken.length
    ? `${kop(`Afgerond (${afgerondeTaken.length})`)}
      <ul style="margin:6px 0 0;padding-left:18px;font-size:14px;line-height:1.7;color:#0b1b3a;">${takenZichtbaar
        .map((t) => `<li>${escape(t)}</li>`)
        .join('')}${takenRest > 0 ? `<li style="color:#5b6b86;">en nog ${takenRest} meer</li>` : ''}</ul>`
    : `${kop('Afgerond')}<p style="margin:6px 0 0;font-size:14px;color:#5b6b86;">Niets afgevinkt deze week — dat zegt iets over het logboek, niet over je week.</p>`

  const financeHtml = finance
    ? `${kop(`Finance — ${finance.maandLabel}`)}
      <table style="margin:6px 0 0;border-collapse:collapse;width:100%;font-size:14px;color:#0b1b3a;">
        <tr><td style="padding:3px 0;color:#5b6b86;">Omzet</td><td style="padding:3px 0;text-align:right;font-variant-numeric:tabular-nums;">${euro(finance.omzet)}</td></tr>
        <tr><td style="padding:3px 0;color:#5b6b86;">Kosten</td><td style="padding:3px 0;text-align:right;font-variant-numeric:tabular-nums;">${euro(finance.kosten)}</td></tr>
        <tr><td style="padding:3px 0;font-weight:600;">Winst</td><td style="padding:3px 0;text-align:right;font-weight:600;font-variant-numeric:tabular-nums;color:#0a7c8a;">${euro(finance.winst)}</td></tr>
        <tr><td style="padding:3px 0;color:#5b6b86;">Openstaand</td><td style="padding:3px 0;text-align:right;font-variant-numeric:tabular-nums;">${euro(finance.openstaand)}${finance.verlopenAantal > 0 ? ` <span style="color:#0a7c8a;">(${finance.verlopenAantal} te laat)</span>` : ''}</td></tr>
      </table>`
    : ''

  const koudHtml = koud.length
    ? `${kop('Verwaterend contact')}
      <ul style="margin:6px 0 0;padding-left:18px;font-size:14px;line-height:1.7;color:#0b1b3a;">${koud
        .slice(0, CONTACTEN_LIMIET)
        .map((c) => `<li>${escape(c.naam)} <span style="color:#5b6b86;">— ${duurTekst(c.dagen)} geen contact</span></li>`)
        .join('')}${koud.length > CONTACTEN_LIMIET ? `<li style="color:#5b6b86;">en nog ${koud.length - CONTACTEN_LIMIET} meer</li>` : ''}</ul>`
    : ''

  const afhaakHtml = afhaak.length
    ? `${kop('PT-klanten die afhaken')}
      <ul style="margin:6px 0 0;padding-left:18px;font-size:14px;line-height:1.7;color:#0b1b3a;">${afhaak
        .slice(0, CONTACTEN_LIMIET)
        .map((a) => `<li>${escape(a.naam)} <span style="color:#5b6b86;">— ${wekenTekst(a.wekenGeleden)}</span></li>`)
        .join('')}${afhaak.length > CONTACTEN_LIMIET ? `<li style="color:#5b6b86;">en nog ${afhaak.length - CONTACTEN_LIMIET} meer</li>` : ''}</ul>`
    : ''

  const zelfHtml = zelf.length
    ? `${kop('Van LifeOS zelf')}
      <ul style="margin:6px 0 0;padding-left:18px;font-size:14px;line-height:1.7;color:#5b6b86;">${zelf
        .map((r) => `<li>${escape(r)}</li>`)
        .join('')}</ul>`
    : ''

  const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0b1b3a;">
    <p style="margin:0 0 2px;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#5b6b86;">Je week — terugblik</p>
    <h1 style="margin:0 0 4px;font-size:20px;color:#0b1b3a;">${escape(datum)}</h1>
    <p style="margin:0 0 8px;font-size:13px;color:#8a97ad;">De afgelopen zeven dagen op een rij.</p>
    ${afgerondHtml}
    ${financeHtml}
    ${afhaakHtml}
    ${koudHtml}
    ${zelfHtml}
  </div>`

  return { onderwerp, html, tekst }
}
