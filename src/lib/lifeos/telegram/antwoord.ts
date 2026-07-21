// ─── LifeOS — van intentie naar Telegram-actie + antwoord ───────────────────
// Puur: gegeven een `Intentie`, wélke actie de app moet nemen en wát de bot
// terugstuurt. De uitvoering (echt een taak/afspraak/notitie aanmaken) gebeurt
// in de webhook-route; hier zit alleen de beslissing en de tekst.

import type { Intentie } from '@/lib/lifeos/intentie/intentie'

export type TelegramActie =
  | 'maak_taak'
  | 'maak_agenda'
  | 'maak_notitie'

/**
 * Welke actie hoort bij deze intentie?
 *
 * De bot VRAAGT NOOIT TERUG (Kane's expliciete wens): elk bericht/elke spraakmemo
 * belandt automatisch op de juiste plek. De afweging is verschoven — vroeger woog
 * "liever vragen dan verkeerd handelen", maar in de praktijk is elke terugvraag
 * wrijving en is de duurste vergissing (een verkeerd geplande AFSPRAAK) al
 * afgedekt: een agenda-afspraak ontstaat alleen bij een échte tijd, en het brein
 * verzint nooit een tijd (zie `intentie.ts`). Taak↔notitie fout is goedkoop:
 * beide zijn in één tik te verplaatsen.
 *
 * Daarom: soort met een tijd en agenda-bedoeling → afspraak; een to-do of
 * herinnering → taak; en al het overige, inclusief 'onduidelijk', → notitie (de
 * veilige vangbak, zodat geen enkele memo zoekraakt).
 */
export function bepaalActie(intentie: Intentie): TelegramActie {
  switch (intentie.soort) {
    case 'agenda':
      // Een afspraak zonder tijd kunnen we niet in de agenda zetten; dan is het
      // eerder een taak. Val daar veilig op terug — nooit terugvragen.
      return intentie.wanneer ? 'maak_agenda' : 'maak_taak'
    case 'taak':
    case 'herinnering':
    case 'follow_up':
      return 'maak_taak'
    case 'notitie':
    case 'idee':
      return 'maak_notitie'
    case 'onduidelijk':
    default:
      // Geen terugvraag meer: onduidelijk → notitie. Een notitie verplaatsen kost
      // niets, en zo raakt geen bericht zoek terwijl we het toch niet plaatsten.
      return 'maak_notitie'
  }
}

/** Een leesbaar moment ("vrijdag 09:00") uit een ISO-string, of null. */
export function leesMoment(wanneer: string | null): string | null {
  if (!wanneer) return null
  const d = new Date(wanneer)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleString('nl-NL', {
    timeZone: 'Europe/Amsterdam',
    weekday: 'long', day: 'numeric', month: 'long',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  })
}

/**
 * De tekst die de bot terugstuurt. Beschrijft wát er gebeurde (of gevraagd
 * wordt), zodat je onderweg meteen ziet dat je memo goed begrepen is.
 *
 * `gelukt=false` → de actie mislukte server-side; zeg dat eerlijk in plaats van
 * te bevestigen wat niet gebeurde.
 */
export function antwoordTekst(
  intentie: Intentie,
  actie: TelegramActie,
  gelukt = true,
): string {
  if (!gelukt) {
    return `Ik begreep "${intentie.titel}", maar het opslaan lukte niet. Probeer het zo nog eens.`
  }

  const moment = leesMoment(intentie.wanneer)
  switch (actie) {
    case 'maak_agenda':
      return `📅 Afspraak gezet: ${intentie.titel}${moment ? ` — ${moment}` : ''}.`
    case 'maak_taak':
      return `✅ Taak toegevoegd: ${intentie.titel}${moment ? ` (${moment})` : ''}.`
    case 'maak_notitie': {
      const cat = intentie.categorie !== 'onbekend' ? ` [${intentie.categorie}]` : ''
      return `📝 Notitie bewaard${cat}: ${intentie.titel}.`
    }
  }
}
