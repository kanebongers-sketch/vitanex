// ─── Vertalen (puur) ─────────────────────────────────────────────────────────
// Een woordenboek is een geneste boom van teksten. Sleutels met punten:
// t('nav.home'). Variabelen met accolades: t('home.groet', { naam: 'Kane' }).
// Ontbreekt een vertaling, dan valt hij terug op het Nederlands (de bron), en
// pas daarna op de sleutel zelf — nooit een lege plek in de UI.

export type Woordenboek = { [sleutel: string]: string | Woordenboek }
export type Params = Record<string, string | number>

function zoek(boek: Woordenboek, sleutel: string): string | undefined {
  let hier: string | Woordenboek | undefined = boek
  for (const deel of sleutel.split('.')) {
    if (typeof hier !== 'object' || hier === null) return undefined
    hier = hier[deel]
  }
  return typeof hier === 'string' ? hier : undefined
}

export function vulIn(tekst: string, params?: Params): string {
  if (!params) return tekst
  return tekst.replace(/\{(\w+)\}/g, (heel, naam: string) =>
    Object.prototype.hasOwnProperty.call(params, naam) ? String(params[naam]) : heel,
  )
}

export function vertaal(boek: Woordenboek, bron: Woordenboek, sleutel: string, params?: Params): string {
  return vulIn(zoek(boek, sleutel) ?? zoek(bron, sleutel) ?? sleutel, params)
}

/** Alle sleutels (met punten) in een woordenboek — voor de volledigheidstest. */
export function alleSleutels(boek: Woordenboek, voorvoegsel = ''): string[] {
  return Object.entries(boek).flatMap(([k, v]) =>
    typeof v === 'string' ? [`${voorvoegsel}${k}`] : alleSleutels(v, `${voorvoegsel}${k}.`),
  )
}

/** De {variabelen} in een tekst, gesorteerd — vertalingen moeten dezelfde hebben. */
export function variabelen(tekst: string): string[] {
  return [...tekst.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort()
}
