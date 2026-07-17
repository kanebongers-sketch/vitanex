// ─── LifeOS — snelheidslimiet voor de Telegram-webhook ──────────────────────
// Elk geldig bericht kost een Whisper-transcriptie én een Claude-aanroep. Dat is
// echt geld en echte quota, en de webhook is een publieke route: het secret is
// het enige dat ertussen zit. Lekt dat ooit, dan is "onbeperkt vaak" het verschil
// tussen een incident en een factuur.
//
// ─── PUUR GENOEG OM TE TESTEN ───────────────────────────────────────────────
// `nu` komt als argument binnen; de teller zit in een closure, niet in een
// module-global. Een test maakt zijn eigen limiet met zijn eigen klok — zelfde
// patroon als de rest van LifeOS.
//
// ─── WAT DIT NIET IS (eerlijk) ──────────────────────────────────────────────
// Dit is een geheugen-teller PER PROCES. Draait de app op meerdere instances
// (of op serverless, waar elke cold start een nieuw proces is), dan heeft elke
// instance zijn eigen teller en is de effectieve limiet dus N × MAX. Een
// herstart zet 'm op nul.
//
// Noem dit dus geen rate limiting-garantie — het is een drempel. Voor de échte
// dreiging (een lek secret dat in een lus gepompt wordt) is een drempel per
// instance precies genoeg: hij verandert "onbeperkt" in "begrensd", zonder een
// Redis-afhankelijkheid voor een single-tenant bot van één man. Wil je een harde
// garantie, dan hoort de teller in de database (of Upstash) — dat is een andere
// beslissing dan deze, en die staat hier bewust niet.

/** Hoeveel berichten per venster. Ruim voor een mens, krap voor een lus. */
export const MAX_PER_VENSTER = 20

/** De lengte van het venster. */
export const VENSTER_MS = 60_000

/**
 * Zoveel chats houden we tegelijk bij.
 *
 * In normaal bedrijf is dit 1: de allowlist draait vóór de limiet, dus alleen
 * jouw eigen chat-id's komen hier ooit langs. De grens is er voor leer-modus,
 * waar élk chat-id doorgelaten wordt en een vreemde de map anders vol zou kunnen
 * pompen tot het proces omvalt.
 */
export const MAX_SLEUTELS = 500

export type LimietBesluit =
  | { soort: 'ruimte' }
  | { soort: 'te_snel'; opnieuwOverSeconden: number }

export interface LimietOpties {
  maxPerVenster: number
  vensterMs: number
  maxSleutels: number
}

export interface Limiet {
  /** Registreert een poging en zegt of hij door mag. `nu` = epoch-ms. */
  toets(sleutel: string, nu: number): LimietBesluit
}

const STANDAARD: LimietOpties = Object.freeze({
  maxPerVenster: MAX_PER_VENSTER,
  vensterMs: VENSTER_MS,
  maxSleutels: MAX_SLEUTELS,
})

/**
 * Een schuivend venster per sleutel.
 *
 * Schuivend en niet vast: bij een vast venster mag je op de grens twee volle
 * vensters achter elkaar sturen (2× MAX in een oogwenk). De prijs is dat we per
 * sleutel de tijdstippen bewaren — maximaal `maxPerVenster` getallen, dus dat is
 * verwaarloosbaar.
 */
export function maakLimiet(opties: Partial<LimietOpties> = {}): Limiet {
  const { maxPerVenster, vensterMs, maxSleutels } = { ...STANDAARD, ...opties }
  const pogingen = new Map<string, number[]>()

  /** Gooit vervallen tijdstippen weg en ruimt lege sleutels op. */
  function schoon(nu: number): void {
    const grens = nu - vensterMs
    for (const [sleutel, tijden] of pogingen) {
      const vers = tijden.filter((t) => t > grens)
      if (vers.length === 0) pogingen.delete(sleutel)
      else pogingen.set(sleutel, vers)
    }
  }

  return {
    toets(sleutel: string, nu: number): LimietBesluit {
      schoon(nu)

      const tijden = pogingen.get(sleutel) ?? []

      // Map vol én dit is een nieuwe sleutel: weigeren. Fail-closed — bij een
      // limiet is "nee" de veilige kant. Zie MAX_SLEUTELS: dit kan in de praktijk
      // alleen in leer-modus, waar er toch niets wordt uitgevoerd.
      if (tijden.length === 0 && pogingen.size >= maxSleutels) {
        return { soort: 'te_snel', opnieuwOverSeconden: Math.ceil(vensterMs / 1000) }
      }

      if (tijden.length >= maxPerVenster) {
        // De oudste poging bepaalt wanneer er weer ruimte is.
        const oudste = tijden[0] ?? nu
        const vrijOp = oudste + vensterMs
        return {
          soort: 'te_snel',
          opnieuwOverSeconden: Math.max(1, Math.ceil((vrijOp - nu) / 1000)),
        }
      }

      pogingen.set(sleutel, [...tijden, nu])
      return { soort: 'ruimte' }
    },
  }
}

/**
 * De gedeelde limiet van de webhook-route.
 *
 * Module-niveau, dus hij overleeft requests binnen hetzelfde proces — dat is
 * precies de bedoeling en meteen de grens van wat dit kan (zie de kop).
 */
export const webhookLimiet: Limiet = maakLimiet()

/**
 * Hoe vaak we mógen zeggen dát je te snel gaat: één keer per venster.
 *
 * Anders is de waarschuwing zelf het lek. `webhookLimiet` stopt de dure kant
 * (Whisper + Claude) na 20 berichten, maar wie daarna blíjft pompen, zou 80 keer
 * een "even rustig"-bericht uitlokken — dan is de rem een versterker geworden.
 *
 * Eén per minuut is de goede afweging tussen die twee kwaden: je krijgt te horen
 * wat er aan de hand is (fout ≠ stil), en niet vaker dan nodig om het te snappen.
 */
export const waarschuwLimiet: Limiet = maakLimiet({ maxPerVenster: 1, vensterMs: VENSTER_MS })

/** Wat de bot terugstuurt als je te snel gaat. Kort en eerlijk. */
export function teSnelAntwoord(seconden: number): string {
  return `Even rustig — ik verwerk er maximaal ${MAX_PER_VENSTER} per minuut. Probeer het over ${seconden} seconden nog eens.`
}
