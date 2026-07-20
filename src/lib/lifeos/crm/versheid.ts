// ─── LifeOS — CRM: contact-versheid ─────────────────────────────────────────
// Hoe lang is het geleden dat je iemand sprak? Puur, geen React. Geeft de UI een
// leesbare NL-tekst én een "koud"-vlag (te lang niets van je laten horen) zodat
// een kaart zacht kan waarschuwen: dit contact verwatert.
//
// Nooit-gesproken is NIET koud: een net toegevoegde lead hoort geen rood vinkje
// te krijgen omdat je 'm nog niet belde — daar is de status/follow-up voor.
// "Koud" gaat puur over verlopen tijd sinds een écht contactmoment.

export interface Versheid {
  /** Hele dagen sinds het laatste contact, of null als er nooit contact was. */
  dagen: number | null
  /** Leesbare NL-tekst: "vandaag", "3 dagen geleden", "nog geen contact". */
  tekst: string
  /** Langer dan de drempel geen contact. Nooit-gesproken telt hier NIET als koud. */
  koud: boolean
}

/** Vanaf hoeveel dagen zonder contact we het "koud" noemen. */
export const KOUD_NA_DAGEN = 30

/** Middernacht (lokaal) van een datum — zodat "dagen geleden" op daggrenzen telt. */
function naarDagbegin(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

/**
 * Versheid van het laatste contact t.o.v. `vandaag`.
 *
 * `laatsteContactOp` is een ISO-moment (of null). `vandaag` mag null zijn tijdens
 * SSR/eerste render — dan is er nog geen "nu" om tegen te rekenen en geven we een
 * neutrale, niet-koude uitkomst terug.
 */
export function contactVersheid(
  laatsteContactOp: string | null,
  vandaag: Date | null,
): Versheid {
  if (!vandaag || !laatsteContactOp) {
    return { dagen: null, tekst: 'nog geen contact', koud: false }
  }

  const toen = new Date(laatsteContactOp)
  if (Number.isNaN(toen.getTime())) {
    return { dagen: null, tekst: 'nog geen contact', koud: false }
  }

  const dagen = Math.max(0, Math.floor((naarDagbegin(vandaag) - naarDagbegin(toen)) / 86_400_000))

  return { dagen, tekst: versheidTekst(dagen), koud: dagen >= KOUD_NA_DAGEN }
}

/** Dagen sinds contact → korte NL-tekst. Rondt grof af; precisie hoort hier niet. */
export function versheidTekst(dagen: number): string {
  if (dagen <= 0) return 'vandaag'
  if (dagen === 1) return 'gisteren'
  if (dagen < 14) return `${dagen} dagen geleden`
  if (dagen < 60) return `${Math.round(dagen / 7)} weken geleden`
  if (dagen < 365) return `${Math.round(dagen / 30)} maanden geleden`
  const jaren = Math.floor(dagen / 365)
  return jaren === 1 ? '1 jaar geleden' : `${jaren} jaar geleden`
}
