// ─── AI Your Gym: getypte woordenboeken (PUUR) ──────────────────────────────
// Elk gebied heeft eigen woordenboeken in ./woorden/<gebied>/<onderdeel>.ts:
//
//   export const KOP = woordenboek({
//     nl: { menu: 'Menu', proef: (dagen: number) => `Probeer ${dagen} dagen gratis` },
//     en: { menu: 'Menu', proef: (days: number) => `Try ${days} days free` },
//   })
//
// Het type komt uit de Nederlandse bron. Het Engels moet precies dezelfde
// sleutels hebben (een ontbrekende of extra sleutel is een typefout) en
// dezelfde vorm: tekst blijft tekst, een functie houdt dezelfde parameters,
// een lijst blijft een lijst. De test woordenboek.test.ts controleert daarnaast
// alles tijdens het draaien (ook even lange lijsten en de schrijfregels).
// Gebruik: tekst(KOP, taal).menu, of in een clientcomponent useTekst(KOP).

import type { Taal } from './taal'

/** Een woordenboek in beide talen, met de vorm van de Nederlandse bron. */
export interface Woordenboek<T> {
  readonly nl: T
  readonly en: T
}

/**
 * De vorm van een tekst zonder letterlijke waarden: 'Menu' wordt string, zodat
 * het Engels iets anders mag zeggen maar wel dezelfde opbouw moet hebben.
 */
export type Vorm<T> = T extends string
  ? string
  : T extends number | boolean | null | undefined
    ? T
    : T extends (...args: infer A) => infer R
      ? (...args: A) => Vorm<R>
      : T extends readonly (infer E)[]
        ? readonly Vorm<E>[]
        : T extends object
          ? { readonly [K in keyof T]: Vorm<T[K]> }
          : T

/**
 * Maak een woordenboek. De Nederlandse tekst is de bron van het type; het
 * Engels wordt daartegen gecontroleerd (NoInfer: het Engels bepaalt niets).
 */
export function woordenboek<const T>(boek: { nl: T; en: NoInfer<Vorm<T>> }): Woordenboek<Vorm<T>> {
  return Object.freeze({ nl: boek.nl as Vorm<T>, en: boek.en })
}

/** De teksten van een woordenboek in een taal. */
export function tekst<T>(boek: Woordenboek<T>, taal: Taal): T {
  return boek[taal]
}

/** Is dit een woordenboek (precies de sleutels nl en en)? Voor de test over alle woordenboeken. */
export function isWoordenboek(waarde: unknown): waarde is Woordenboek<unknown> {
  if (typeof waarde !== 'object' || waarde === null) return false
  const sleutels = Object.keys(waarde).sort()
  return sleutels.length === 2 && sleutels[0] === 'en' && sleutels[1] === 'nl'
}
