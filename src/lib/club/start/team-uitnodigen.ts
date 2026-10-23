// ─── Club, startwizard: medewerkers meteen uitnodigen in stap Team (PUUR) ───
// Per medewerker een knop die dezelfde uitnodiging maakt als bij Medewerkers
// (PATCH /api/club/medewerker-toegang/[id]). De uitnodiging is een eenmalige
// link die de eigenaar zelf doorstuurt: Club mailt die link niet.

import type { LoginStaat } from '@/lib/club/medewerker-login/medewerker-login'

export interface UitnodigStand {
  /** De tekst op de knop, of null als er niets uit te nodigen valt. */
  knop: string | null
  chip: { label: string; klasse: string } | null
  /** Korte uitleg onder de naam, of null. */
  hint: string | null
}

/** Wat de rij van een medewerker toont, uit het e-mailadres en de stand van de login. */
export function uitnodigStand(email: string | null, staat: LoginStaat, loginAan: boolean): UitnodigStand {
  if (!loginAan) return { knop: null, chip: null, hint: 'Inloggen voor medewerkers staat nog uit.' }
  if (staat === 'actief') return { knop: null, chip: { label: 'Kan inloggen', klasse: 'club-chip--ok' }, hint: null }
  if (!email) return { knop: null, chip: null, hint: 'Vul hierboven een e-mailadres in en sla op, dan kun je uitnodigen.' }
  if (staat === 'uitgenodigd') return { knop: 'Nieuwe link', chip: { label: 'Uitgenodigd', klasse: 'club-chip--merk' }, hint: null }
  if (staat === 'verlopen') return { knop: 'Opnieuw uitnodigen', chip: { label: 'Link verlopen', klasse: 'club-chip--let-op' }, hint: null }
  return { knop: 'Uitnodigen', chip: null, hint: null }
}

/** De volledige link uit het pad dat de API teruggeeft, op het adres van de sportschool als dat er is. */
export function uitnodigLink(pad: unknown, basis: string | null, oorsprong: string): string | null {
  if (typeof pad !== 'string' || !pad.startsWith('/clubinloggen/medewerker/')) return null
  return `${(basis ?? oorsprong).replace(/\/+$/, '')}${pad}`
}
