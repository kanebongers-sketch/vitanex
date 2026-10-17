// ─── Club, intakevragen: de kernvragen en de standaardset (PUUR) ────────────
// De vaste vragen die het intakeformulier altijd had. Ze vullen de velden van
// de intake waar het schemavoorstel op draait (doelen, ervaring, dagen,
// minuten) en de gezondheidsvelden. Een sportschool past tekst, uitleg, sectie
// en volgorde aan en zet ze aan of uit; soort en opties liggen vast.
// Een sportschool zonder eigen vragen krijgt precies deze set.

import { PARQ_VRAGEN } from '@/lib/club/training/intake'
import { DOEL_LABEL, DOELEN, NIVEAU_LABEL, NIVEAUS, VOORKEUR_LABEL, VOORKEUREN, ZONE_LABEL, ZONES } from '@/lib/club/training/typen'
import type { IntakeVraag, VraagSoort } from './soorten'

export interface KernDef {
  sleutel: string
  vraag: string
  uitleg: string | null
  soort: VraagSoort
  sectie: string
  /** Opties zoals het lid ze ziet (alleen ter info: ze liggen vast). */
  opties: string[]
  verplicht: boolean
  gezondheid: boolean
  /** Nodig voor het schemavoorstel: kan niet uit. */
  vast: boolean
}

function kern(d: Omit<KernDef, 'uitleg' | 'opties' | 'verplicht' | 'gezondheid' | 'vast'> & Partial<KernDef>): KernDef {
  return { uitleg: null, opties: [], verplicht: false, gezondheid: false, vast: false, ...d }
}

export const PARQ_PREFIX = 'parq_'

export const KERN_VRAGEN: readonly KernDef[] = [
  kern({ sleutel: 'doelen', vraag: 'Wat zijn je doelen?', soort: 'meerkeuze', sectie: 'Doelen', opties: DOELEN.map((d) => DOEL_LABEL[d]), verplicht: true, vast: true }),
  kern({ sleutel: 'motivatie', vraag: 'Motivatie in eigen woorden', uitleg: 'Waarom nu, wat wil het lid over drie maanden kunnen?', soort: 'kort', sectie: 'Doelen' }),
  kern({ sleutel: 'niveau', vraag: 'Ervaring met krachttraining', soort: 'keuze', sectie: 'Ervaring', opties: NIVEAUS.map((n) => NIVEAU_LABEL[n]), verplicht: true, vast: true }),
  kern({ sleutel: 'dagen_per_week', vraag: 'Dagen per week', soort: 'getal', sectie: 'Leefstijl', verplicht: true, vast: true }),
  kern({ sleutel: 'minuten_per_sessie', vraag: 'Minuten per training', soort: 'getal', sectie: 'Leefstijl', verplicht: true, vast: true }),
  kern({ sleutel: 'voorkeuren', vraag: 'Voorkeur', soort: 'meerkeuze', sectie: 'Leefstijl', opties: VOORKEUREN.map((v) => VOORKEUR_LABEL[v]) }),
  kern({ sleutel: 'blessures', vraag: 'Blessures of klachten aan', soort: 'meerkeuze', sectie: 'Gezondheid', opties: ZONES.map((z) => ZONE_LABEL[z]), gezondheid: true }),
  kern({ sleutel: 'blessure_toelichting', vraag: 'Toelichting blessure', uitleg: 'Bijvoorbeeld: meniscus links, 2024', soort: 'kort', sectie: 'Gezondheid', gezondheid: true }),
  kern({ sleutel: 'klachten', vraag: 'Andere klachten', soort: 'kort', sectie: 'Gezondheid', gezondheid: true }),
  kern({ sleutel: 'medicatie', vraag: 'Medicatie', soort: 'kort', sectie: 'Gezondheid', gezondheid: true }),
  ...PARQ_VRAGEN.map((p) => kern({ sleutel: `${PARQ_PREFIX}${p.sleutel}`, vraag: p.vraag, soort: 'ja_nee', sectie: 'Gezondheid', gezondheid: true })),
]

const PER_SLEUTEL = new Map(KERN_VRAGEN.map((k) => [k.sleutel, k]))

export function kernDef(sleutel: string | null): KernDef | null {
  return sleutel === null ? null : PER_SLEUTEL.get(sleutel) ?? null
}

export function isKernSleutel(v: unknown): v is string {
  return typeof v === 'string' && PER_SLEUTEL.has(v)
}

/** Het tijdelijke id van een kernvraag die nog niet in de database staat. */
export const STANDAARD_ID = (sleutel: string) => `kern:${sleutel}`

export function standaardSleutel(id: string): string | null {
  return id.startsWith('kern:') && isKernSleutel(id.slice(5)) ? id.slice(5) : null
}

/** De volgorde van de standaardset: 10, 20, 30 ... zodat er ruimte tussen zit. */
export function standaardVolgorde(sleutel: string): number {
  return (KERN_VRAGEN.findIndex((k) => k.sleutel === sleutel) + 1) * 10
}

export function standaardVraag(k: KernDef): IntakeVraag {
  return {
    id: STANDAARD_ID(k.sleutel),
    sleutel: k.sleutel,
    vraag: k.vraag,
    uitleg: k.uitleg,
    soort: k.soort,
    opties: [...k.opties],
    verplicht: k.verplicht,
    gezondheid: k.gezondheid,
    sectie: k.sectie,
    volgorde: standaardVolgorde(k.sleutel),
    actief: true,
  }
}

/** De standaard intakevragen voor een sportschool zonder eigen set. */
export function standaardVragen(): IntakeVraag[] {
  return KERN_VRAGEN.map(standaardVraag)
}

/**
 * Een kernvraag uit de database met de vaste eigenschappen van Club erover:
 * soort, opties, verplicht en gezondheid kan een sportschool niet wijzigen, en
 * een vaste vraag staat altijd aan.
 */
export function metKernRegels(v: IntakeVraag): IntakeVraag {
  const k = kernDef(v.sleutel)
  if (!k) return v
  return { ...v, soort: k.soort, opties: [...k.opties], verplicht: k.verplicht, gezondheid: k.gezondheid, actief: k.vast ? true : v.actief }
}
