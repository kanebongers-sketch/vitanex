// ─── PT-app — "Belangrijk": wie mag wat (SERVER-ONLY, maar puur) ────────────
// Los van belangrijk.ts omdat leads/links.ts serverzaken importeert; de
// browser-componenten gebruiken alleen belangrijk.ts.

import { krijgtBelangrijk, magAandachtspuntenBeheren, type LinkRol } from '@/lib/lifeos/leads/links'
import { isBeheerActie, type BelangrijkActie } from './belangrijk'

/**
 * Mag deze rol deze actie doen? Beheren (toevoegen, wijzigen, volgorde, aan/uit,
 * verwijderen) alleen de beheerder (Kane); afvinken en kledingmaten alleen een
 * PT'er, voor zichzelf. Eigenaren (Ruben) en clubmanagers niets.
 */
export function magActie(rol: LinkRol, a: BelangrijkActie): boolean {
  return isBeheerActie(a) ? magAandachtspuntenBeheren(rol) : krijgtBelangrijk(rol)
}

/** De foutmelding als een rol een actie niet mag. */
export function geweigerd(a: BelangrijkActie): string {
  return isBeheerActie(a) ? 'De belangrijke punten beheert Kane.' : "Afvinken en kledingmaten doorgeven doet de PT'er zelf."
}
