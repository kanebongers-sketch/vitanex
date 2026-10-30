// ─── Club, rollen v2: de rijen van Rechten per rol (PUUR) ───────────────────
// De groepen zoals het menu, plus een groep Instellingen en bedrijf voor wat
// niet in het menu staat. Elke sleutel uit RECHT_SLEUTELS staat er precies een
// keer in (behalve Hulp: die heeft iedereen). Een rij met een slot is alleen
// voor de eigenaar; een rij buiten het pakket wordt grijs, niet weggelaten.

import { GROEPEN, ONDERDELEN, groepInTaal, inMenu, onderdeelInTaal } from '@/components/club/shell/onderdelen'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import type { Verborgen } from '@/lib/club/kern/pakketten'
import { ROLLEN_TEKST } from '@/lib/aiyourgym/taal/woorden/club/rollen'
import { bestaatVoorSportschool } from '@/lib/club/rollen/model'
import { ALLEEN_EIGENAAR, EXTRA_SLEUTELS, RECHT_SLEUTELS } from '@/lib/club/rollen/typen'
import { START_OPTIES } from '@/lib/club/rollen/standaard'

export interface RechtenRij {
  sleutel: string
  label: string
  uitleg: string
  /** Alleen voor de eigenaar: vast, niet te wijzigen. */
  slot: boolean
  /** Niet afgenomen of uit gezet: grijs. */
  buiten: boolean
}

export interface RechtenGroepV2 {
  sleutel: string
  label: string
  rijen: RechtenRij[]
}

/** Extra sleutels die in een groep van het menu horen (naast hun onderdeel). */
const EXTRA_IN_GROEP: Readonly<Record<string, string>> = { uren: 'planning' }

type Extra = (typeof EXTRA_SLEUTELS)[number]

function rijVoor(sleutel: string, uit: readonly Verborgen[], taal: Taal): RechtenRij {
  const extra = ROLLEN_TEKST[taal].extra[sleutel as Extra]
  const o = ONDERDELEN.find((x) => x.sleutel === sleutel)
  const t = extra ?? (o ? onderdeelInTaal(o, taal) : { label: sleutel, uitleg: '' })
  return { sleutel, label: t.label, uitleg: t.uitleg, slot: ALLEEN_EIGENAAR.has(sleutel), buiten: !bestaatVoorSportschool(uit, sleutel) }
}

export function rechtenGroepenV2(uit: readonly Verborgen[], taal: Taal = 'nl'): RechtenGroepV2[] {
  const dagelijks = (s: string) => {
    const o = ONDERDELEN.find((x) => x.sleutel === s)
    return o !== undefined && (inMenu(o) || Boolean(o.sectie))
  }
  const teTonen = RECHT_SLEUTELS.filter((s) => s !== 'hulp')
  const groepen: RechtenGroepV2[] = GROEPEN.map((g) => ({
    sleutel: g.sleutel,
    label: groepInTaal(g, taal).label,
    rijen: teTonen
      .filter((s) => (dagelijks(s) && ONDERDELEN.find((x) => x.sleutel === s)?.groep === g.sleutel) || EXTRA_IN_GROEP[s] === g.sleutel)
      .map((s) => rijVoor(s, uit, taal)),
  }))
  const gebruikt = new Set(groepen.flatMap((g) => g.rijen.map((r) => r.sleutel)))
  const rest = teTonen.filter((s) => !gebruikt.has(s)).map((s) => rijVoor(s, uit, taal))
  return [...groepen, { sleutel: 'instellingen', label: ROLLEN_TEKST[taal].rechten.instellingen, rijen: rest }].filter((g) => g.rijen.length > 0)
}

/** De keuzes voor de startpagina met hun naam in de gekozen taal. */
export function startKeuzes(taal: Taal = 'nl'): { sleutel: string; label: string }[] {
  return START_OPTIES.map((o) => ({ sleutel: o.sleutel, label: rijVoor(o.sleutel, [], taal).label }))
}
