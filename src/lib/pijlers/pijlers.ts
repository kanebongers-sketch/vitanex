// ─── MentaForce — canonieke 6 pijlers ───────────────────────────────────────
// DÉ bron van waarheid voor het pijler-model. Home, de pijler-detailpagina's,
// Progress, Vita en de check-in leiden hier allemaal uit af. Nooit dupliceren.
//
// Volgorde = merk-volgorde (brein-regio's, zie marketing/theme.ts).
// De 6e pijler is bewust "Stemming" (niet "Mentale gezondheid"): consistent met
// merk + data (stemming_logs), en eerlijk — MentaForce meet geen klinische
// mentale gezondheid.
//
// Let op: dit bestand is PUUR (geen React/lucide/DB-import) zodat het testbaar
// blijft. Iconen worden als lucide-naam-string bewaard; de UI mapt die naar een
// component.

export type PijlerKey =
  | 'energie'
  | 'slaap'
  | 'stress'
  | 'stemming'
  | 'beweging'
  | 'voeding'

export interface PijlerDef {
  key: PijlerKey
  /** Weergavenaam (NL). */
  label: string
  /** Eén-zins definitie — wat de pijler meet. */
  omschrijving: string
  /** lucide-react icoonnaam (UI mapt naar component). */
  icoon: string
  /** 0-based positie in de canonieke volgorde. */
  volgorde: number
}

export const PIJLERS: readonly PijlerDef[] = [
  {
    key: 'energie',
    label: 'Energie',
    omschrijving: 'Hoeveel energie en vitaliteit je door de week ervaart.',
    icoon: 'Zap',
    volgorde: 0,
  },
  {
    key: 'slaap',
    label: 'Slaap',
    omschrijving: 'Je slaapkwaliteit, -duur en hoe uitgerust je opstaat.',
    icoon: 'Moon',
    volgorde: 1,
  },
  {
    key: 'stress',
    label: 'Stress',
    omschrijving: 'Ervaren spanning en je gevoel van controle daarover.',
    icoon: 'Activity',
    volgorde: 2,
  },
  {
    key: 'stemming',
    label: 'Stemming',
    omschrijving: 'Je algemene stemming en mentale balans van dag tot dag.',
    icoon: 'Smile',
    volgorde: 3,
  },
  {
    key: 'beweging',
    label: 'Beweging',
    omschrijving: 'Fysieke activiteit in je dagelijks leven — stappen en training.',
    icoon: 'Footprints',
    volgorde: 4,
  },
  {
    key: 'voeding',
    label: 'Voeding',
    omschrijving: 'Voeding en hydratatie — vol te houden, zonder obsessie.',
    icoon: 'Apple',
    volgorde: 5,
  },
] as const

export const PIJLER_KEYS: readonly PijlerKey[] = PIJLERS.map((p) => p.key)

const PIJLER_MAP: Readonly<Record<PijlerKey, PijlerDef>> = Object.freeze(
  Object.fromEntries(PIJLERS.map((p) => [p.key, p])) as Record<PijlerKey, PijlerDef>,
)

/** Pijlerdefinitie op key, of undefined bij een onbekende key. */
export function pijlerDef(key: string): PijlerDef | undefined {
  return PIJLER_MAP[key as PijlerKey]
}

/** True als een string een geldige canonieke pijler-key is. */
export function isPijlerKey(key: string): key is PijlerKey {
  return key in PIJLER_MAP
}
