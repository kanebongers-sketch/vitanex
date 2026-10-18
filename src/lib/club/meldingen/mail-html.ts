// ─── Club, meldingen: de mail in de huisstijl van de sportschool (PUUR) ─────
// Eenvoudige HTML (tabellen en inline stijl, zodat elke mailapp het goed
// toont) plus de platte tekst. Naam, logo en accentkleur van de sportschool;
// de accentkleur wordt zo nodig donkerder voor genoeg contrast op wit.

import { HEX, bruikbaarAccent, inktOp } from '@/lib/club/kern/huisstijl'

export interface MailHuisstijl {
  naam: string
  /** Een openbare (of ondertekende) url van het logo, of null: dan de naam als woordmerk. */
  logoUrl: string | null
  accent: string
  /** Donker thema: de kop krijgt de donkere achtergrond van de sportschool (voor lichte logo's). */
  donker: boolean
}

export interface MailInhoud {
  tekst: string
  /** Link naar de app of website, voor de knop. */
  knop: { label: string; url: string } | null
  /** Afmeldlink (bij herinneringen), of null. */
  afmeldUrl: string | null
}

export function escape(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c)
}

function veiligeUrl(url: string): string | null {
  return /^https:\/\/[^\s"'<>]+$/.test(url) ? url : null
}

/** De platte tekst, met de afmeldregel eronder. */
export function platteTekst(inhoud: MailInhoud): string {
  const delen = [inhoud.tekst]
  if (inhoud.knop) delen.push(`${inhoud.knop.label}: ${inhoud.knop.url}`)
  if (inhoud.afmeldUrl) delen.push(`Geen herinneringen meer per mail? Meld je af: ${inhoud.afmeldUrl}`)
  return delen.join('\n\n')
}

function kop(h: MailHuisstijl, accent: string): string {
  const logo = h.logoUrl ? veiligeUrl(h.logoUrl) : null
  const achtergrond = h.donker ? '#0A0B09' : '#FFFFFF'
  const inkt = h.donker ? '#FFFFFF' : '#111111'
  const merk = logo
    ? `<img src="${escape(logo)}" alt="${escape(h.naam)}" height="40" style="display:block;height:40px;width:auto;max-width:220px;border:0">`
    : `<span style="font-size:20px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${inkt}">${escape(h.naam)}</span>`
  return `<tr><td style="padding:24px 32px;background:${achtergrond};border-radius:12px 12px 0 0;border-bottom:4px solid ${accent}">${merk}</td></tr>`
}

function alineas(tekst: string): string {
  return tekst
    .split(/\n{2,}/)
    .map((a) => `<p style="margin:0 0 16px">${escape(a).replace(/\n/g, '<br>')}</p>`)
    .join('')
}

function knopHtml(knop: MailInhoud['knop'], accent: string): string {
  const url = knop ? veiligeUrl(knop.url) : null
  if (!knop || !url) return ''
  return `<p style="margin:8px 0 8px"><a href="${escape(url)}" style="display:inline-block;padding:12px 22px;border-radius:999px;background:${accent};color:${inktOp(accent)};font-weight:700;text-decoration:none">${escape(knop.label)}</a></p>`
}

function voet(h: MailHuisstijl, afmeldUrl: string | null): string {
  const url = afmeldUrl ? veiligeUrl(afmeldUrl) : null
  const afmelden = url ? `<br><a href="${escape(url)}" style="color:#6b6b66">Geen herinneringen meer per mail</a>` : ''
  return `<tr><td style="padding:18px 32px 28px;font-size:12px;line-height:1.5;color:#6b6b66;border-top:1px solid #ecebe6">Je krijgt dit bericht omdat je lid bent van ${escape(h.naam)}.${afmelden}</td></tr>`
}

/** De HTML-mail. */
export function mailHtml(h: MailHuisstijl, inhoud: MailInhoud): string {
  const accent = bruikbaarAccent(HEX.test(h.accent) ? h.accent : '#B58E5C', 'licht').kleur
  return [
    '<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>',
    '<body style="margin:0;padding:0;background:#f4f3ef">',
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f3ef"><tr><td align="center" style="padding:24px 12px">',
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;font-family:Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#1a1a18">',
    kop(h, accent),
    `<tr><td style="padding:28px 32px 12px">${alineas(inhoud.tekst)}${knopHtml(inhoud.knop, accent)}</td></tr>`,
    voet(h, inhoud.afmeldUrl),
    '</table></td></tr></table></body></html>',
  ].join('')
}
