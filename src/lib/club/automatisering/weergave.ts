// ─── Club: opvolgtaken klaarzetten voor het scherm (PUUR) ───────────────────
// Van taak plus regel naar wat de opvolglijst toont: naam, aanleiding, wie het
// oppakt en de ingevulde voorbeeldtekst. Zo hoeft de browser niets te rekenen.

import { initialen } from '@/lib/club/kern/lid'
import { REGEL_DEFINITIES, wieTekst, type Regel, type RegelSleutel } from './regels'
import { vulSjabloon } from './sjabloon'
import { TAAK_STATUS_LABEL, sjabloonWaarden, type RegelGroep, type Taak, type TaakStatus } from './taken'

export interface OpvolgItem {
  id: string
  lidId: string
  regelTitel: string
  naam: string
  initialen: string
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

export function naarItem(taak: Taak, ctx: Context): OpvolgItem {
  const regel = ctx.regels.find((r) => r.sleutel === taak.regel)
  const sjabloon = regel?.sjabloon ?? REGEL_DEFINITIES[taak.regel].sjabloon
  const lid = taak.lid ?? { voornaam: 'Onbekend', achternaam: 'lid', telefoon: null, email: null }
  return {
    id: taak.id,
    lidId: taak.lidId,
    regelTitel: REGEL_DEFINITIES[taak.regel].titel,
    naam: `${lid.voornaam} ${lid.achternaam}`.trim(),
    initialen: initialen({ voornaam: lid.voornaam, achternaam: lid.achternaam || lid.voornaam }),
    reden: taak.reden,
    wie: wieTekst(taak.wie, ctx.medewerkers),
    tekst: vulSjabloon(sjabloon, sjabloonWaarden(taak, ctx.vestigingNaam)),
    telefoon: lid.telefoon,
    email: lid.email,
    notitie: taak.notitie,
    sinds: taak.aangemaaktOp.slice(0, 10),
    status: taak.status,
    statusLabel: TAAK_STATUS_LABEL[taak.status],
    afgehandeldDoor: taak.afgehandeldDoor,
    afgehandeldOp: taak.afgehandeldOp,
  }
}

export function naarGroepen(groepen: readonly RegelGroep[], ctx: Context): OpvolgGroep[] {
  return groepen.map((g) => ({
    regel: g.regel,
    titel: REGEL_DEFINITIES[g.regel].titel,
    uitleg: REGEL_DEFINITIES[g.regel].waarom,
    items: g.taken.map((t) => naarItem(t, ctx)),
  }))
}
