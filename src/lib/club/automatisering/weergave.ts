// ─── Club: opvolgtaken klaarzetten voor het scherm (PUUR) ───────────────────
// Van taak plus regel naar wat de opvolglijst toont: naam, aanleiding, wie het
// oppakt en de ingevulde voorbeeldtekst. Zo hoeft de browser niets te rekenen.

import { initialen } from '@/lib/club/kern/lid'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { OPVOLGEN } from '@/lib/aiyourgym/taal/woorden/club/opvolgen'
import { REGEL_DEFINITIES, type Regel, type RegelSleutel, type Wie } from './regels'
import { vulSjabloon } from './sjabloon'
import { sjabloonWaarden, type RegelGroep, type Taak, type TaakStatus } from './taken'

export interface OpvolgItem {
  id: string
  lidId: string
  regelTitel: string
  naam: string
  initialen: string
  /** Versie van de profielfoto van het lid, of null. */
  foto?: string | null
  reden: string
  wie: string
  tekst: string
  telefoon: string | null
  email: string | null
  notitie: string | null
  /** YYYY-MM-DD waarop de taak klaarstond. */
  sinds: string
  status: TaakStatus
  statusLabel: string
  afgehandeldDoor: string | null
  afgehandeldOp: string | null
}

export interface OpvolgGroep {
  regel: RegelSleutel
  titel: string
  uitleg: string
  items: OpvolgItem[]
}

export interface Context {
  vestigingNaam: string
  regels: readonly Regel[]
  medewerkers: ReadonlyMap<string, string>
}

/** Wie een taak oppakt, in de gekozen taal: iedereen, een rol of een medewerker. */
function wieInTaal(wie: Wie, medewerkers: ReadonlyMap<string, string>, taal: Taal): string {
  const t = OPVOLGEN[taal].wie
  if (wie.soort === 'iedereen') return t.iedereen
  if (wie.soort === 'rol') return t.rol[wie.rol]
  return medewerkers.get(wie.id) ?? t.onbekend
}

export function naarItem(taak: Taak, ctx: Context, taal: Taal = 'nl'): OpvolgItem {
  const t = OPVOLGEN[taal]
  const regel = ctx.regels.find((r) => r.sleutel === taak.regel)
  const sjabloon = regel?.sjabloon ?? REGEL_DEFINITIES[taak.regel].sjabloon
  const lid = taak.lid ?? { voornaam: t.wie.onbekendLid, achternaam: '', telefoon: null, email: null }
  return {
    id: taak.id,
    lidId: taak.lidId,
    regelTitel: t.regel[taak.regel].titel,
    naam: `${lid.voornaam} ${lid.achternaam}`.trim(),
    initialen: initialen({ voornaam: lid.voornaam, achternaam: lid.achternaam || lid.voornaam }),
    foto: taak.lid?.foto ?? null,
    reden: taak.reden,
    wie: wieInTaal(taak.wie, ctx.medewerkers, taal),
    tekst: vulSjabloon(sjabloon, sjabloonWaarden(taak, ctx.vestigingNaam)),
    telefoon: lid.telefoon,
    email: lid.email,
    notitie: taak.notitie,
    sinds: taak.aangemaaktOp.slice(0, 10),
    status: taak.status,
    statusLabel: t.status[taak.status],
    afgehandeldDoor: taak.afgehandeldDoor,
    afgehandeldOp: taak.afgehandeldOp,
  }
}

export function naarGroepen(groepen: readonly RegelGroep[], ctx: Context, taal: Taal = 'nl'): OpvolgGroep[] {
  return groepen.map((g) => ({
    regel: g.regel,
    titel: OPVOLGEN[taal].regel[g.regel].titel,
    uitleg: OPVOLGEN[taal].regel[g.regel].waarom,
    items: g.taken.map((t) => naarItem(t, ctx, taal)),
  }))
}
