// ─── Club: voorbeeldtekst invullen (PUUR) ───────────────────────────────────
// Een sjabloon met {voornaam}, {vestiging}, {dagen} en {bezoeken}. Onbekende of
// lege plekken blijven zichtbaar staan, zodat het team ziet wat nog moet.

export const SJABLOON_VELDEN = ['voornaam', 'vestiging', 'dagen', 'bezoeken'] as const
export type SjabloonVeld = (typeof SJABLOON_VELDEN)[number]

export type SjabloonWaarden = Partial<Record<SjabloonVeld, string | number | null>>

function isVeld(v: string): v is SjabloonVeld {
  return (SJABLOON_VELDEN as readonly string[]).includes(v)
}

/** Vult de plekken in: "Hoi {voornaam}" met { voornaam: 'Sanne' } wordt "Hoi Sanne". */
export function vulSjabloon(sjabloon: string, waarden: SjabloonWaarden): string {
  return sjabloon.replace(/\{([a-z]+)\}/g, (heel, naam: string) => {
    if (!isVeld(naam)) return heel
    const w = waarden[naam]
    if (w === null || w === undefined) return heel
    const tekst = String(w).trim()
    return tekst === '' ? heel : tekst
  })
}

/** De plekken in een sjabloon die Club niet kent, voor een waarschuwing bij het opslaan. */
export function onbekendeVelden(sjabloon: string): string[] {
  const namen = [...sjabloon.matchAll(/\{([^{}]*)\}/g)].map((m) => m[1])
  return [...new Set(namen.filter((n) => !isVeld(n)))]
}
