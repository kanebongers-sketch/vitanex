// ─── Fit Factory Club: eenvoudige opmaak voor notities (PUUR) ──────────────
// Notities blijven gewone tekst (geen HTML, dus geen XSS), met een paar
// afspraken die in de leesweergave tot opmaak worden:
//   [ ] taak   → een afvinkvakje (aangevinkt: [x] taak)
//   - punt     → een opsommingsteken
//   # Kop      → een tussenkop
// Alles anders is een gewone regel; lege regels scheiden alinea's.

export type Regel =
  | { soort: 'vink'; index: number; klaar: boolean; tekst: string }
  | { soort: 'punt'; index: number; tekst: string }
  | { soort: 'kop'; index: number; tekst: string }
  | { soort: 'tekst'; index: number; tekst: string }
  | { soort: 'leeg'; index: number }

const VINK = /^\s*\[( |x|X)\]\s?(.*)$/
const PUNT = /^\s*[-*]\s+(.*)$/
const KOP = /^\s*#{1,3}\s+(.*)$/

/** De inhoud regel voor regel, met wat elke regel is. `index` = regelnummer in de inhoud. */
export function regels(inhoud: string): Regel[] {
  return inhoud.split('\n').map((r, index): Regel => {
    const v = VINK.exec(r)
    if (v) return { soort: 'vink', index, klaar: v[1] !== ' ', tekst: v[2] }
    const p = PUNT.exec(r)
    if (p) return { soort: 'punt', index, tekst: p[1] }
    const k = KOP.exec(r)
    if (k) return { soort: 'kop', index, tekst: k[1] }
    return r.trim() ? { soort: 'tekst', index, tekst: r } : { soort: 'leeg', index }
  })
}

/** Vink een afvinkregel aan of uit; andere regels blijven precies gelijk. */
export function wisselVinkje(inhoud: string, index: number): string {
  const lijst = inhoud.split('\n')
  const r = lijst[index]
  if (r === undefined) return inhoud
  const v = VINK.exec(r)
  if (!v) return inhoud
  lijst[index] = r.replace(/\[( |x|X)\]/, v[1] === ' ' ? '[x]' : '[ ]')
  return lijst.join('\n')
}

/** Hoeveel afvinkregels er zijn en hoeveel daarvan klaar. */
export function vinkStand(inhoud: string): { klaar: number; totaal: number } {
  const vinken = regels(inhoud).filter((r): r is Extract<Regel, { soort: 'vink' }> => r.soort === 'vink')
  return { klaar: vinken.filter((r) => r.klaar).length, totaal: vinken.length }
}

/** Een nieuwe afvinkregel achteraan (met een lege regel ertussen als de laatste regel tekst is). */
export function voegVinkToe(inhoud: string): string {
  if (!inhoud.trim()) return '[ ] '
  const zonderEind = inhoud.replace(/\n+$/, '')
  const eindigtMetVink = VINK.test(zonderEind.split('\n').at(-1) ?? '')
  return `${zonderEind}\n${eindigtMetVink ? '' : '\n'}[ ] `
}
