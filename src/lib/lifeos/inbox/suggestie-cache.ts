// ─── LifeOS — onthouden welke mails al geanalyseerd zijn ────────────────────
// SERVER-ONLY (geheugen per proces). De inbox ververst elke 5 minuten en stuurde
// elke keer tot 40 mails opnieuw naar het model — voor mails die al geanalyseerd
// waren. Dit bestand onthoudt per mail de suggestie, zodat alleen NIEUWE mails
// een modelcall kosten.
//
// De sleutel is mail-id + onderwerp + Amsterdamse dag. De dag zit erin omdat de
// suggestie relatief is ("morgen" in het onderwerp is morgen vanaf vandaag); een
// nieuwe dag analyseert dus opnieuw. Mislukte analyses (vertrouwen 0, geen actie)
// worden niet onthouden: die mogen het bij de volgende verversing nog eens proberen.
//
// Bewust geen databasetabel: het is een kostenrem, geen administratie, en we
// willen afzenders en onderwerpen van derden niet langer bewaren dan nodig.

import { dagVan } from '@/lib/lifeos/blokken/tijd'
import type { MailKenmerk, Suggestie } from './analyse'

/** Bovengrens zodat het geheugen niet onbeperkt groeit. Ruim boven een dag inbox. */
export const MAX_REGELS = 500

const geheugen = new Map<string, Suggestie>()

export function cacheSleutel(mail: MailKenmerk, nu: Date): string {
  return `${dagVan(nu)}|${mail.externId}|${mail.onderwerp ?? ''}`
}

/** Een mislukte of lege analyse: niet onthouden, volgende keer opnieuw proberen. */
function isMislukt(s: Suggestie): boolean {
  return s.soort === 'geen' && s.vertrouwen === 0
}

/**
 * Splitst de mails in wat we al weten en wat nog geanalyseerd moet worden.
 * Puur op het geheugen; roept zelf geen model aan.
 */
export function splitsBekend(
  mails: readonly MailKenmerk[],
  nu: Date,
): { bekend: Suggestie[]; nieuw: MailKenmerk[] } {
  const bekend: Suggestie[] = []
  const nieuw: MailKenmerk[] = []
  for (const mail of mails) {
    const hit = geheugen.get(cacheSleutel(mail, nu))
    if (hit) bekend.push(hit)
    else nieuw.push(mail)
  }
  return { bekend, nieuw }
}

/** Onthoud de nieuwe suggesties (behalve de mislukte). */
export function onthoud(mails: readonly MailKenmerk[], suggesties: readonly Suggestie[], nu: Date): void {
  if (geheugen.size + suggesties.length > MAX_REGELS) geheugen.clear()
  const perId = new Map(suggesties.map((s) => [s.externId, s]))
  for (const mail of mails) {
    const s = perId.get(mail.externId)
    if (s && !isMislukt(s)) geheugen.set(cacheSleutel(mail, nu), s)
  }
}

/** Alleen voor tests. */
export function legeSuggestieCache(): void {
  geheugen.clear()
}
