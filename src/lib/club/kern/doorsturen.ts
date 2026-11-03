// ─── Club: een oud adres naar de nieuwe plek, met de zoekstring erbij (PUUR) ─
// Ontwerp "Club in 10 minuten" (03-11-2026): elk oud adres blijft werken, met
// een 308 naar de nieuwe plek. De zoekparameters gaan mee (vestiging, week,
// lid), behalve wat de oude plek betekende en op de nieuwe plek anders heet.

type Zoek = Record<string, string | string[] | undefined>

/**
 * Het nieuwe pad binnen /club met de oude zoekstring, zonder de sleutels in
 * `weg`, plus `extra` (gaat voor), en optioneel een anker.
 */
export function doorstuurPad(pad: string, zoek: Zoek, extra: Record<string, string> = {}, weg: readonly string[] = [], anker?: string): string {
  const uit = new URLSearchParams()
  for (const [sleutel, waarde] of Object.entries(zoek)) {
    if (waarde === undefined || weg.includes(sleutel) || sleutel in extra) continue
    for (const w of Array.isArray(waarde) ? waarde : [waarde]) uit.append(sleutel, w)
  }
  for (const [sleutel, waarde] of Object.entries(extra)) uit.set(sleutel, waarde)
  const basis = `/club${pad.startsWith('/') ? pad : `/${pad}`}`
  const vraag = uit.toString()
  return `${basis}${vraag ? `?${vraag}` : ''}${anker ? `#${anker}` : ''}`
}
