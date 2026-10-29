// ─── Club, startwizard: medewerkers meteen uitnodigen in stap Team (PUUR) ───
// Per medewerker een knop die dezelfde uitnodiging maakt als bij Medewerkers
// (PATCH /api/club/medewerker-toegang/[id], met mailen: true). Is er een
// afzender ingesteld, dan mailt Club de eenmalige link naar de medewerker; de
// link staat daarnaast altijd in beeld om zelf door te sturen. We zeggen
// eerlijk wat er gebeurde: gemaild, of (nog) niet en waarom.

import type { LoginStaat } from '@/lib/club/medewerker-login/medewerker-login'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { START_LIB } from '@/lib/aiyourgym/taal/woorden/club/start-lib'

export interface UitnodigStand {
  /** De tekst op de knop, of null als er niets uit te nodigen valt. */
  knop: string | null
  chip: { label: string; klasse: string } | null
  /** Korte uitleg onder de naam, of null. */
  hint: string | null
}

/** Wat de rij van een medewerker toont, uit het e-mailadres en de stand van de login. */
export function uitnodigStand(email: string | null, staat: LoginStaat, loginAan: boolean, taal: Taal = 'nl'): UitnodigStand {
  const t = START_LIB[taal].uitnodigen
  if (!loginAan) return { knop: null, chip: null, hint: t.loginUit }
  if (staat === 'actief') return { knop: null, chip: { label: t.kanInloggen, klasse: 'club-chip--ok' }, hint: null }
  if (!email) return { knop: null, chip: null, hint: t.geenEmail }
  if (staat === 'uitgenodigd') return { knop: t.opnieuw, chip: { label: t.uitgenodigd, klasse: 'club-chip--merk' }, hint: null }
  if (staat === 'verlopen') return { knop: t.opnieuw, chip: { label: t.verlopen, klasse: 'club-chip--let-op' }, hint: null }
  return { knop: t.uitnodigen, chip: null, hint: null }
}

/** De volledige link uit het pad dat de API teruggeeft, op het adres van de sportschool als dat er is. */
export function uitnodigLink(pad: unknown, basis: string | null, oorsprong: string): string | null {
  if (typeof pad !== 'string' || !pad.startsWith('/clubinloggen/medewerker/')) return null
  return `${(basis ?? oorsprong).replace(/\/+$/, '')}${pad}`
}

export type Gemaild = 'verstuurd' | 'niet_ingesteld' | 'mislukt'

export function isGemaild(v: unknown): v is Gemaild {
  return v === 'verstuurd' || v === 'niet_ingesteld' || v === 'mislukt'
}

/** Wat de eigenaar ziet na uitnodigen: of de mail is verstuurd, en anders dat hij de link zelf doorstuurt. */
export function uitnodigMelding(gemaild: Gemaild | null, voornaam: string, email: string, taal: Taal = 'nl'): { ok: boolean; tekst: string } {
  const t = START_LIB[taal].uitnodigen
  if (gemaild === 'verstuurd') return { ok: true, tekst: t.verstuurd(email, voornaam) }
  if (gemaild === 'mislukt') return { ok: false, tekst: t.mislukt(voornaam) }
  return { ok: false, tekst: t.nietIngesteld(voornaam) }
}
