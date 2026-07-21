// ─── LifeOS — capture: de echte opslag-adapter (Telegram + WhatsApp) ────────
// SERVER-ONLY. De databaseschrijf-operaties voor `voerUit`, gedeeld door de
// capture-kanalen (Telegram-bot, WhatsApp-bot). Beide webhooks houden `voerUit`
// puur en injecteerbaar; hier krijgt hij de échte opslaglaag op het LifeOS-project.
//
// ÉÉN service-role-client, per aanroep vers gebouwd (geen module-const):
// `createLifeosAdminClient()` leest de LifeOS-env en gooit als die ontbreekt. Door
// 'm pas hier — ná de secret/handtekening- en allowlist-gate van de webhook — te
// bouwen, heeft een import van een webhook-route geen LifeOS-env nodig en bouwt de
// afgewezen-tak nooit een client.

import type { UitvoerDeps } from '@/lib/lifeos/telegram/uitvoeren'
import { createLifeosAdminClient } from '@/lib/lifeos/admin'
import { maakTaak as maakTaakInDb } from '@/lib/lifeos/taken/opslag'
import { maakNotitie as maakNotitieInDb } from '@/lib/lifeos/notities/opslag'
import { maakAgendaEvent } from '@/lib/lifeos/agenda/schrijven'
import { leesGekozenKalender } from '@/lib/lifeos/agenda/koppeling'

/**
 * De echte schrijf-adapters op de vaste LifeOS-gebruiker.
 *
 * De MentaForce-opslagfuncties nemen `admin` als EERSTE parameter; de adapters
 * geven de gedeelde client door en houden zo het `UitvoerDeps`-contract
 * `(userId, nieuw)` intact.
 *
 * `maakAgendaEvent` GOOIT bij mislukking (`AgendaSchrijfFout`) en geeft anders het
 * event terug — een andere vorm dan `maakTaak`/`maakNotitie`, die een `Uitkomst`
 * teruggeven. De agenda-adapter maakt er één contract van: gelukt=true/false. De
 * fout wordt server-side gelogd (fout ≠ stil) en niet als een leeg succes verstopt.
 * Er wordt bewust alleen de fout gelogd — nooit de intentie-inhoud of de tokens.
 * De afspraak gaat naar de GEKOZEN agenda (null = primary), net als de UI.
 */
export function maakOpslag(): UitvoerDeps {
  const admin = createLifeosAdminClient()
  return {
    maakTaak: (userId, nieuw) => maakTaakInDb(admin, userId, nieuw),
    maakNotitie: (userId, nieuw) => maakNotitieInDb(admin, userId, nieuw),
    maakAgenda: async (userId, invoer) => {
      try {
        const kalenderId = await leesGekozenKalender(admin, userId)
        await maakAgendaEvent(admin, userId, invoer, kalenderId)
        return { ok: true }
      } catch (fout) {
        console.error('[lifeos/capture] agenda-afspraak aanmaken mislukt', fout)
        return { ok: false }
      }
    },
  }
}
