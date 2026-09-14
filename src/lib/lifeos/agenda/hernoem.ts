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
  | { staat: 'ok'; hernoemd: number; geblokkeerd: number; bekeken: number }
  | { staat: 'niet_gekoppeld' }
  | { staat: 'onbereikbaar' }

/** Wat LifeOS onthoudt per afspraak, om te leren van correcties (migratie 220). */
interface HernoemStaat {
  /** De titel die wij zelf schreven, of null als we deze afspraak nooit hernoemden. */
  geschreven: string | null
  /** true = gebruiker corrigeerde onze hernoem; met rust laten. */
  geblokkeerd: boolean
}

/** Leest de hernoem-staat per extern_id uit de cache. Fout → lege map (dan gedraagt het zich als "nog nooit hernoemd"). */
async function leesHernoemStaat(
  admin: SupabaseClient,
  userId: string,
  externIds: readonly string[],
): Promise<Map<string, HernoemStaat>> {
  const staat = new Map<string, HernoemStaat>()
  if (externIds.length === 0) return staat
  const { data, error } = await admin
    .from('agenda_events')
    .select('extern_id, hernoem_geschreven, hernoem_geblokkeerd')
    .eq('user_id', userId)
    .in('extern_id', externIds)
  if (error || !Array.isArray(data)) {
    console.error('[agenda-hernoem] hernoem-staat lezen mislukt:', error?.message ?? 'onverwacht antwoord')
    return staat
  }
  for (const rij of data) {
    if (typeof rij?.extern_id !== 'string') continue
    staat.set(rij.extern_id, {
      geschreven: typeof rij.hernoem_geschreven === 'string' ? rij.hernoem_geschreven : null,
      geblokkeerd: rij.hernoem_geblokkeerd === true,
    })
  }
  return staat
}

/**
 * Hernoemt de kale-naam-afspraken in de persoonlijke agenda, en LEERT van correcties:
 * heb je onze hernoem teruggedraaid of aangepast, dan raakt LifeOS die afspraak nooit
 * meer aan (migratie 220). Idempotent: een titel die al canoniek is, wordt overgeslagen.
 */
export async function hernoemAfspraken(admin: SupabaseClient, userId: string): Promise<HernoemUitkomst> {
  const token = await geldigToken(admin, userId)
  if (token.staat === 'niet_gekoppeld') return { staat: 'niet_gekoppeld' }
  if (token.staat === 'fout') return { staat: 'onbereikbaar' }

  // Geen personen → niets om naar te koppelen. Geen fout, gewoon niets te doen.
  const personenU = await haalPersonen(admin, userId).catch(() => ({ ok: false as const, reden: 'db' as const }))
  if (!personenU.ok || personenU.waarde.length === 0) return { staat: 'ok', hernoemd: 0, geblokkeerd: 0, bekeken: 0 }
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

  const staat = await leesHernoemStaat(admin, userId, uit.events.map((e) => e.externId))

  let hernoemd = 0
  let geblokkeerd = 0
  for (const event of uit.events) {
    const eigen = staat.get(event.externId)

    // 1. Al geblokkeerd (jij hebt 'm ooit gecorrigeerd) → met rust laten.
    if (eigen?.geblokkeerd) continue

    // 2. Wij schreven ooit een titel, maar die is nu anders → JIJ hebt 'm gecorrigeerd.
    //    Zet de "handen af"-vlag en raak deze afspraak nooit meer aan.
    if (eigen?.geschreven != null && (event.titel ?? '') !== eigen.geschreven) {
      const { error } = await admin
        .from('agenda_events')
        .update({ hernoem_geblokkeerd: true })
        .eq('user_id', userId)
        .eq('extern_id', event.externId)
      if (error) console.error(`[agenda-hernoem] blokkeren van ${event.externId} mislukt: ${error.message}`)
      else geblokkeerd++
      continue
    }

    // 3. Nog niet aangeraakt: hernoemen als het een kale naam is die eenduidig matcht.
    const doel = bepaalHernoem(event.titel, personen)
    if (!doel) continue
    try {
      await wijzigAgendaEvent(admin, userId, event.externId, { titel: doel.nieuweTitel }, kalenderId)
      // Onthoud wat we schreven, zodat een latere wijziging als correctie telt.
      const { error } = await admin
        .from('agenda_events')
        .update({ hernoem_geschreven: doel.nieuweTitel })
        .eq('user_id', userId)
        .eq('extern_id', event.externId)
      if (error) console.error(`[agenda-hernoem] onthouden van ${event.externId} mislukt: ${error.message}`)
      hernoemd++
    } catch (oorzaak) {
      // Best-effort: bv. een 403 op een uitnodiging van iemand anders (die je niet
      // mag hertitelen) mag de rest van de ronde niet blokkeren.
      const melding = oorzaak instanceof Error ? oorzaak.message : 'onbekend'
      console.error(`[agenda-hernoem] kon event ${event.externId} niet hernoemen: ${melding}`)
    }
  }

  return { staat: 'ok', hernoemd, geblokkeerd, bekeken: uit.events.length }
}
