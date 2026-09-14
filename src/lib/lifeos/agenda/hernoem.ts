// ─── LifeOS — afspraken automatisch hernoemen naar de CRM-persoon ───────────
// SERVER-ONLY. Loopt over de afspraken in je PERSOONLIJKE agenda en herschrijft een
// "kale naam"-titel naar de volledige naam + rol-tag ("Kevin" → "Kevin Cranenbroeck
// PT"). Dit SCHRIJFT naar je echte Google-agenda, dus de waarborgen zitten strak:
//
//   • ALLEEN de persoonlijke agenda. We lezen én patchen uitsluitend de door jou
//     gekozen schrijf-kalender (`leesGekozenKalender`; null = je primary). NOOIT een
//     andere agenda — geen enkele van de andere gesyncte kalenders wordt aangeraakt.
//   • ALLEEN bij één zekere match, en alleen een kale-naam-titel — nooit bij twijfel,
//     nooit een rijkere titel mangelen, nooit al-canonieke titels opnieuw schrijven.
//     Die drie regels zitten in `bepaalHernoem` (getest).
//   • BEST-EFFORT per event: een event dat je niet mag patchen (bv. een uitnodiging
//     van iemand anders → 403) of een netwerkhik slaat de rest niet over.
//
// De beslissing (wat wordt wat) is puur en getest in `crm/agenda-match.ts`; dit
// bestand doet alleen de I/O eromheen.

import type { SupabaseClient } from '@supabase/supabase-js'
import { forceerVernieuwing, geldigToken, leesGekozenKalender } from './koppeling'
import { haalEvents } from './google'
import { wijzigAgendaEvent } from './schrijven'
import { haalPersonen } from '@/lib/lifeos/crm/opslag'
import { bepaalHernoem } from '@/lib/lifeos/crm/agenda-match'

/** Zoveel dagen vooruit kijken vanaf nu. Verder vooruit hernoemen heeft geen doel. */
const DAGEN_VOORUIT = 7

export type HernoemUitkomst =
  | { staat: 'ok'; hernoemd: number; bekeken: number }
  | { staat: 'niet_gekoppeld' }
  | { staat: 'onbereikbaar' }

/**
 * Hernoemt de kale-naam-afspraken in de persoonlijke agenda. Idempotent: een titel
 * die al canoniek is, wordt overgeslagen — dus dit mag elke sync-ronde draaien.
 */
export async function hernoemAfspraken(admin: SupabaseClient, userId: string): Promise<HernoemUitkomst> {
  const token = await geldigToken(admin, userId)
  if (token.staat === 'niet_gekoppeld') return { staat: 'niet_gekoppeld' }
  if (token.staat === 'fout') return { staat: 'onbereikbaar' }

  // Geen personen → niets om naar te koppelen. Geen fout, gewoon niets te doen.
  const personenU = await haalPersonen(admin, userId).catch(() => ({ ok: false as const, reden: 'db' as const }))
  if (!personenU.ok || personenU.waarde.length === 0) return { staat: 'ok', hernoemd: 0, bekeken: 0 }
  const personen = personenU.waarde

  // DE PERSOONLIJKE AGENDA, en alleen die. Zelfde kalender waar de dagmail al je
  // sport/wandel-blokken in zet. `null` = je primary.
  const kalenderId = await leesGekozenKalender(admin, userId)

  // VANAF NU, niet vanaf middernacht: een afspraak van vanochtend die al voorbij is
  // laten we met rust. Alleen wat nog komt (of nu bezig is) wordt hernoemd.
  const van = new Date()
  const tot = new Date(van)
  tot.setDate(tot.getDate() + DAGEN_VOORUIT + 1)

  let uit = await haalEvents(token.toegangstoken, van, tot, kalenderId)
  if (uit.staat === 'verlopen') {
    const vers = await forceerVernieuwing(admin, userId)
    if (vers.staat === 'niet_gekoppeld') return { staat: 'niet_gekoppeld' }
    if (vers.staat === 'fout') return { staat: 'onbereikbaar' }
    uit = await haalEvents(vers.toegangstoken, van, tot, kalenderId)
  }
  if (uit.staat === 'verlopen') return { staat: 'niet_gekoppeld' }
  if (uit.staat === 'fout') return { staat: 'onbereikbaar' }

  let hernoemd = 0
  for (const event of uit.events) {
    const doel = bepaalHernoem(event.titel, personen)
    if (!doel) continue
    try {
      await wijzigAgendaEvent(admin, userId, event.externId, { titel: doel.nieuweTitel }, kalenderId)
      hernoemd++
    } catch (oorzaak) {
      // Best-effort: bv. een 403 op een uitnodiging van iemand anders (die je niet
      // mag hertitelen) mag de rest van de ronde niet blokkeren.
      const melding = oorzaak instanceof Error ? oorzaak.message : 'onbekend'
      console.error(`[agenda-hernoem] kon event ${event.externId} niet hernoemen: ${melding}`)
    }
  }

  return { staat: 'ok', hernoemd, bekeken: uit.events.length }
}
