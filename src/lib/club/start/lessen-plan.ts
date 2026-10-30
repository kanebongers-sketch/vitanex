// ─── Club startwizard: lestypen en de vaste week in een keer (PUUR) ─────────
// De stap Lessen toont alles meteen: de lestypen als keuze (voorbeelden staan
// er, maar niets is aangevinkt tot de eigenaar het kiest, besluit Kane
// 30-10-2026), per gekozen lestype naam, duur en uitleg, en voorbeeldlessen
// voor de week die de eigenaar zelf aanzet. Per les kies je dag, tijd, duur,
// plekken, zaal en instructeur. Bij verder maken we er een plan van: wat er
// nieuw komt, wat er verandert en wat er uit gaat. Niets gaat ooit weg uit de
// database: uitzetten is actief = false (de historie blijft kloppen).

import type { LesSoort } from '@/lib/club/rooster/typen'
import { zelfdeNaam, type VoorbeeldLes, type VoorbeeldLestype } from './voorbeelden'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { START_LIB } from '@/lib/aiyourgym/taal/woorden/club/start-lib'

export type Intensiteit = 1 | 2 | 3

export interface BestaandType {
  id: string
  naam: string
  omschrijving: string | null
  soort: LesSoort
  duurMin: number
  intensiteit: number
  /** Uitgezet in Instellingen: staat in de keuze, maar niet aangevinkt. */
  actief?: boolean
}

export interface BestaandeSerie {
  id: string
  lestypeId: string
  zaalId: string | null
  instructeurId: string | null
  weekdag: number
  starttijd: string
  duurMin: number
  capaciteit: number
}

export interface TypeRij {
  /** "id:<uuid>" voor een bestaand lestype, "vb:<naam>" voor een voorbeeld, "nieuw:<n>" voor een eigen lestype. */
  sleutel: string
  id: string | null
  naam: string
  omschrijving: string
  soort: LesSoort
  duurMin: number
  intensiteit: Intensiteit
  aan: boolean
}

export interface LesRij {
  /** "id:<uuid>" voor een bestaande les, anders een vaste sleutel van het voorstel of "nieuw:<n>". */
  sleutel: string
  id: string | null
  typeSleutel: string
  weekdag: number
  starttijd: string
  duurMin: number
  capaciteit: number
  zaalId: string | null
  instructeurId: string | null
  aan: boolean
}

function intensiteit(n: number): Intensiteit {
  return n <= 1 ? 1 : n >= 3 ? 3 : 2
}

function typeUitVoorbeeld(v: VoorbeeldLestype): TypeRij {
  return { sleutel: `vb:${v.naam}`, id: null, naam: v.naam, omschrijving: v.omschrijving, soort: v.soort, duurMin: v.duurMin, intensiteit: v.intensiteit, aan: false }
}

/**
 * De lestypen om uit te kiezen: eerst wat er al is (aan zoals in de database),
 * dan de voorbeelden die er nog niet zijn. Een voorbeeld staat nooit vooraf
 * aan: de eigenaar kiest zelf.
 */
export function beginTypen(bestaand: readonly BestaandType[], bibliotheek: readonly VoorbeeldLestype[]): TypeRij[] {
  const eigen: TypeRij[] = bestaand.map((t) => ({
    sleutel: `id:${t.id}`,
    id: t.id,
    naam: t.naam,
    omschrijving: t.omschrijving ?? '',
    soort: t.soort,
    duurMin: t.duurMin,
    intensiteit: intensiteit(t.intensiteit),
    aan: t.actief !== false,
  }))
  const voorbeelden = bibliotheek.filter((v) => !bestaand.some((t) => zelfdeNaam(t.naam, v.naam))).map(typeUitVoorbeeld)
  return [...eigen, ...voorbeelden]
}

function lesSleutel(typeSleutel: string, l: VoorbeeldLes): string {
  return `vs:${typeSleutel}:${l.weekdag}:${l.starttijd}`
}

/**
 * De week: de vaste lessen die er al zijn, plus voorbeeldlessen voor elk
 * lestype dat nog geen vaste les heeft. Een voorbeeldles staat uit tot de
 * eigenaar hem aanzet; je ziet hem zodra het lestype is gekozen.
 */
export function beginLessen(typen: readonly TypeRij[], series: readonly BestaandeSerie[], voorbeelden: readonly VoorbeeldLes[], zaalId: string | null): LesRij[] {
  const bestaand: LesRij[] = series.map((s) => ({
    sleutel: `id:${s.id}`,
    id: s.id,
    typeSleutel: `id:${s.lestypeId}`,
    weekdag: s.weekdag,
    starttijd: s.starttijd.slice(0, 5),
    duurMin: s.duurMin,
    capaciteit: s.capaciteit,
    zaalId: s.zaalId,
    instructeurId: s.instructeurId,
    aan: true,
  }))
  const voorstel = typen
    .filter((t) => !series.some((s) => t.id !== null && s.lestypeId === t.id))
    .flatMap((t) =>
      voorbeelden
        .filter((l) => zelfdeNaam(l.lestype, t.naam))
        .map((l): LesRij => ({ sleutel: lesSleutel(t.sleutel, l), id: null, typeSleutel: t.sleutel, weekdag: l.weekdag, starttijd: l.starttijd, duurMin: t.duurMin, capaciteit: l.capaciteit, zaalId, instructeurId: null, aan: false })),
    )
  return [...bestaand, ...voorstel]
}

/** De lessen die je ziet: alleen van gekozen lestypen, op volgorde van de week. */
export function zichtbareLessen(lessen: readonly LesRij[], typen: readonly TypeRij[]): LesRij[] {
  const aan = new Set(typen.filter((t) => t.aan).map((t) => t.sleutel))
  return lessen.filter((l) => aan.has(l.typeSleutel)).sort((a, b) => a.weekdag - b.weekdag || a.starttijd.localeCompare(b.starttijd))
}

const TIJD = /^([01]\d|2[0-3]):[0-5]\d$/

function binnen(n: number, min: number, max: number): boolean {
  return Number.isInteger(n) && n >= min && n <= max
}

/** Klopt alles wat aan staat? Dezelfde grenzen als de API, in gewone taal. Null = goed. */
export function controleerLessen(typen: readonly TypeRij[], lessen: readonly LesRij[], taal: Taal = 'nl'): string | null {
  const c = START_LIB[taal].controle
  const gekozen = typen.filter((t) => t.aan)
  for (const t of gekozen) {
    if (!t.naam.trim()) return c.typeNaam
    if (t.naam.trim().length > 60) return c.typeNaamLang(t.naam.trim().slice(0, 20))
    if (!binnen(t.duurMin, 10, 240)) return c.typeDuur(t.naam.trim())
    if (t.omschrijving.length > 600) return c.typeUitleg(t.naam.trim())
  }
  const namen = gekozen.map((t) => t.naam.trim().toLowerCase().replace(/\s+/g, ' '))
  const dubbel = namen.find((n, i) => namen.indexOf(n) !== i)
  if (dubbel) return c.dubbel(dubbel)
  for (const l of zichtbareLessen(lessen, typen).filter((x) => x.aan)) {
    if (!binnen(l.weekdag, 1, 7)) return c.lesDag
    if (!TIJD.test(l.starttijd)) return c.lesTijd
    if (!binnen(l.duurMin, 10, 240)) return c.lesDuur
    if (!binnen(l.capaciteit, 1, 500)) return c.lesPlekken
  }
  return null
}

// ── Het plan bij verder ───────────────────────────────────────────────────

export interface TypeVelden {
  naam: string
  omschrijving: string | null
  soort: LesSoort
  duurMin: number
  intensiteit: Intensiteit
}

export interface LesVelden {
  weekdag: number
  starttijd: string
  duurMin: number
  capaciteit: number
  zaalId: string | null
  instructeurId: string | null
}

export interface LessenPlan {
  /** Bestaande vaste lessen die uit gaan (uitgezet, of het lestype gaat uit). */
  lessenUit: string[]
  typenUit: string[]
  /** Aangepast, of weer aangezet (dan met actief: true). */
  typenWijzig: { id: string; velden: Partial<TypeVelden> & { actief?: true } }[]
  typenNieuw: TypeRij[]
  lessenWijzig: { id: string; velden: Partial<LesVelden> }[]
  /** Nieuwe vaste lessen; typeSleutel wijst naar een bestaand of een nieuw lestype. */
  lessenNieuw: LesRij[]
}

export function typeVelden(t: TypeRij): TypeVelden {
  const uitleg = t.omschrijving.trim()
  return { naam: t.naam.trim().replace(/\s+/g, ' '), omschrijving: uitleg || null, soort: t.soort, duurMin: t.duurMin, intensiteit: t.intensiteit }
}

export function lesVelden(l: LesRij): LesVelden {
  return { weekdag: l.weekdag, starttijd: l.starttijd, duurMin: l.duurMin, capaciteit: l.capaciteit, zaalId: l.zaalId, instructeurId: l.instructeurId }
}

/** Alleen de velden die anders zijn dan in de database. */
function verschil<T extends object>(nu: T, was: T): Partial<T> {
  return Object.fromEntries(Object.entries(nu).filter(([k, v]) => (was as Record<string, unknown>)[k] !== v)) as Partial<T>
}

/** Wat er moet gebeuren om van `basis` (de database) naar wat er op het scherm staat te komen. */
export function lessenPlan(typen: readonly TypeRij[], lessen: readonly LesRij[], basisTypen: readonly TypeRij[], basisLessen: readonly LesRij[]): LessenPlan {
  const typeAan = new Set(typen.filter((t) => t.aan).map((t) => t.sleutel))
  const basisTypeAan = new Set(basisTypen.filter((t) => t.aan).map((t) => t.sleutel))
  const lesAan = (l: LesRij) => l.aan && typeAan.has(l.typeSleutel)
  const lesWasAan = (l: LesRij) => {
    const was = basisLessen.find((b) => b.sleutel === l.sleutel)
    return Boolean(was?.aan && basisTypeAan.has(was.typeSleutel))
  }
  const typenWijzig = typen.flatMap((t) => {
    const was = basisTypen.find((b) => b.sleutel === t.sleutel)
    if (!t.aan || !t.id || !was) return []
    const velden = { ...verschil(typeVelden(t), typeVelden(was)), ...(was.aan ? {} : { actief: true as const }) }
    return Object.keys(velden).length > 0 ? [{ id: t.id, velden }] : []
  })
  const lessenWijzig = lessen.flatMap((l) => {
    const was = basisLessen.find((b) => b.sleutel === l.sleutel)
    if (!lesAan(l) || !l.id || !was) return []
    const velden = verschil(lesVelden(l), lesVelden(was))
    return Object.keys(velden).length > 0 ? [{ id: l.id, velden }] : []
  })
  return {
    lessenUit: lessen.filter((l) => l.id && !lesAan(l) && lesWasAan(l)).map((l) => l.id as string),
    typenUit: typen.filter((t) => t.id && !t.aan && basisTypeAan.has(t.sleutel)).map((t) => t.id as string),
    typenWijzig,
    typenNieuw: typen.filter((t) => t.aan && !t.id),
    lessenWijzig,
    lessenNieuw: lessen.filter((l) => lesAan(l) && !l.id),
  }
}

/** Hoeveel er verandert; 0 = niets op te slaan. */
export function aantalWijzigingen(p: LessenPlan): number {
  return p.lessenUit.length + p.typenUit.length + p.typenWijzig.length + p.typenNieuw.length + p.lessenWijzig.length + p.lessenNieuw.length
}

/** Een nieuwe, lege les voor het eerste gekozen lestype (of null zonder gekozen lestype). */
export function legeLes(typen: readonly TypeRij[], n: number, zaalId: string | null): LesRij | null {
  const type = typen.find((t) => t.aan)
  if (!type) return null
  return { sleutel: `nieuw:${n}`, id: null, typeSleutel: type.sleutel, weekdag: 1, starttijd: '19:00', duurMin: type.duurMin, capaciteit: 12, zaalId, instructeurId: null, aan: true }
}

/** Een nieuw, eigen lestype (staat meteen aan). */
export function leegType(n: number): TypeRij {
  return { sleutel: `nieuw:${n}`, id: null, naam: '', omschrijving: '', soort: 'overig', duurMin: 45, intensiteit: 2, aan: true }
}
