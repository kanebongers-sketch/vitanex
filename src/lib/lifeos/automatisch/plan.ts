// ─── LifeOS — wat mag automatisch? (puur) ───────────────────────────────────
// Van de PT-signalen naar concrete acties die LifeOS zélf uitvoert, zonder tik:
//   - status_actief:      traint al (≥2× in 8 weken), staat als prospect → Actieve klant;
//   - typfout:            "Kevnin" → "Kevin" in je agenda (per afspraak);
//   - persoon_toegevoegd: "Darren PT" niet in je CRM → toevoegen als PT-klant.
//
// Twee harde regels:
//   1. Nooit twee keer. `gedaan` bevat alles wat ooit automatisch gebeurde (het
//      logboek, migratie 300). Draai jij iets terug, dan blijft het teruggedraaid.
//   2. Alleen wat op een persoon lijkt wordt toegevoegd. "Vergadering Fit Factory
//      PT" is geen klant; zo'n titel blijft een vraag op de PT-kaart. En pas bij
//      MIN_SESSIES_VOOR_TOEVOEGEN keer: één losse afspraak is nog geen klant.
//   3. Hernoemen alleen bij een PT-afspraak. "Anna" (privé) lijkt op klant
//      "Anne", maar zonder "PT" in de titel raken we je agenda niet aan; dan
//      blijft het een vraag in de ochtendmail.

import type { MogelijkeTypfout, OnbekendePtSessie, PtStatusHint } from '@/lib/lifeos/pt-klant/klantstatus'
import { woordTokens } from '@/lib/lifeos/crm/agenda-match'
import { isPtTitel } from '@/lib/lifeos/pt-klant/pt-klant'
import { isVergadering } from '@/lib/lifeos/agenda/vergadering'

/** Zo vaak moet een onbekende naam als PT-sessie voorkomen voordat LifeOS hem zelf toevoegt. */
export const MIN_SESSIES_VOOR_TOEVOEGEN = 2

export type ActieSoort = 'status_actief' | 'typfout' | 'persoon_toegevoegd'

export type GeplandeActie =
  | { soort: 'status_actief'; sleutel: string; omschrijving: string; persoonId: string }
  | { soort: 'typfout'; sleutel: string; omschrijving: string; eventId: string; nieuweTitel: string }
  | { soort: 'persoon_toegevoegd'; sleutel: string; omschrijving: string; naam: string }

export interface PlanInvoer {
  statusHints: readonly PtStatusHint[]
  typfouten: readonly MogelijkeTypfout[]
  onbekend: readonly OnbekendePtSessie[]
}

/** De unieke sleutel in het logboek: soort + sleutel. */
export function logSleutel(soort: ActieSoort, sleutel: string): string {
  return `${soort}:${sleutel}`
}

/** Woorden die op een afspraak wijzen, niet op een persoon. */
const GEEN_PERSOON = new Set([
  'vergadering', 'overleg', 'meeting', 'bespreking', 'teamoverleg', 'evaluatie', 'workshop', 'cursus',
  'groep', 'groepsles', 'bootcamp', 'clinic', 'event', 'fit', 'factory', 'gym', 'sportschool', 'studio',
  'social', 'media', 'content', 'marketing', 'administratie', 'planning', 'team', 'mt', 'nieuwe', 'klant',
  'klanten', 'proef', 'demo', 'bellen', 'appen', 'mail', 'lunch', 'borrel',
])

/** Lijkt dit op een naam? 1–4 woorden, alleen letters, geen afspraak-woorden. */
export function isPersoonsnaam(naam: string): boolean {
  const woorden = naam.trim().split(/\s+/).filter((w) => w.length > 0)
  if (woorden.length === 0 || woorden.length > 4) return false
  if (!woorden.every((w) => /^[\p{L}'-]+$/u.test(w))) return false
  return !woordTokens(naam).some((t) => GEEN_PERSOON.has(t))
}

export function planAutomatischeActies(invoer: PlanInvoer, gedaan: ReadonlySet<string>): GeplandeActie[] {
  const uit: GeplandeActie[] = []
  const nieuw = (soort: ActieSoort, sleutel: string) => !gedaan.has(logSleutel(soort, sleutel))

  for (const h of invoer.statusHints) {
    if (!nieuw('status_actief', h.id)) continue
    uit.push({
      soort: 'status_actief',
      sleutel: h.id,
      persoonId: h.id,
      omschrijving: `${h.naam} op Actieve klant gezet (${h.sessies}× getraind in 8 weken)`,
    })
  }

  for (const t of invoer.typfouten) {
    if (t.nieuweTitel === t.titel) continue
    if (!isPtTitel(woordTokens(t.titel)) || isVergadering(t.titel)) continue
    for (const eventId of t.eventIds) {
      if (!nieuw('typfout', eventId)) continue
      uit.push({
        soort: 'typfout',
        sleutel: eventId,
        eventId,
        nieuweTitel: t.nieuweTitel,
        omschrijving: `"${t.titel}" in je agenda verbeterd naar "${t.nieuweTitel}"`,
      })
    }
  }

  for (const o of invoer.onbekend) {
    const sleutel = woordTokens(o.naam).join(' ')
    if (!sleutel || !isPersoonsnaam(o.naam) || !nieuw('persoon_toegevoegd', sleutel)) continue
    if (o.aantal < MIN_SESSIES_VOOR_TOEVOEGEN) continue
    uit.push({
      soort: 'persoon_toegevoegd',
      sleutel,
      naam: o.naam,
      omschrijving: `${o.naam} toegevoegd als PT-klant (uit "${o.titel}")`,
    })
  }

  return uit
}
