// Statische kennisinhoud voor de tabs Beweging, Voeding, Slaap en Mentaal.
// Hier alleen structuur (sleutels, aantallen, kleuren); de teksten staan in het
// woordenboek onder mentaal.kennis.*. maakKennis(t) bouwt de vertaalde inhoud.

import type { Params } from '@/lib/i18n/vertaal'

export type Vertaler = (sleutel: string, params?: Params) => string

export type Intensiteit = 'laag' | 'gemiddeld' | 'hoog'

export interface BureauOefening {
  naam: string
  afk: string
  duur: string
  stappen: string[]
  waarom: string
  intensiteit: Intensiteit
}

export interface SchemaRij {
  tijd: string
  actie: string
}

export interface KennisTip {
  titel: string
  tekst: string
}

export interface VoedingCategorie {
  titel: string
  afk: string
  kleur: string
  tips: KennisTip[]
}

export interface DagritmeBlok {
  tijd: string
  kleur: string
  items: string[]
}

export interface SlaapSectieData {
  titel: string
  afk: string
  kleur: string
  items: KennisTip[]
}

export interface SlaapFeit {
  label: string
  waarde: string
  kleur: string
}

export interface WinddownStap {
  tijd: string
  kleur: string
  actie: string
}

export interface MentaalTechniek {
  naam: string
  afk: string
  duur: string
  kleur: string
  beschrijving: string
  stappen: string[]
}

export interface KennisInhoud {
  bureauoefeningen: BureauOefening[]
  bewegingsschema: SchemaRij[]
  voedingCategorieen: VoedingCategorie[]
  voedingDagritme: DagritmeBlok[]
  slaapSecties: SlaapSectieData[]
  slaapFeiten: SlaapFeit[]
  winddownRoutine: WinddownStap[]
  mentaalTechnieken: MentaalTechniek[]
  stressSignalen: string[]
}

const K = 'mentaal.kennis'

const OEFENINGEN: readonly { sleutel: string; afk: string; minuten: number; stappen: number; intensiteit: Intensiteit }[] = [
  { sleutel: 'nekSchouder', afk: 'NS', minuten: 2, stappen: 4, intensiteit: 'laag' },
  { sleutel: 'rugstrek', afk: 'RG', minuten: 2, stappen: 5, intensiteit: 'laag' },
  { sleutel: 'standingDesk', afk: 'SD', minuten: 3, stappen: 4, intensiteit: 'gemiddeld' },
  { sleutel: 'polsHand', afk: 'PH', minuten: 2, stappen: 4, intensiteit: 'laag' },
  { sleutel: 'core', afk: 'CA', minuten: 3, stappen: 4, intensiteit: 'gemiddeld' },
  { sleutel: 'oogKaak', afk: 'OG', minuten: 2, stappen: 4, intensiteit: 'laag' },
  { sleutel: 'energieboost', afk: 'SE', minuten: 4, stappen: 5, intensiteit: 'hoog' },
  { sleutel: 'spierontspanning', afk: 'PS', minuten: 5, stappen: 7, intensiteit: 'laag' },
]

const SCHEMA_TIJDEN = ['09:00', '10:30', '12:00', '14:30', '16:00'] as const

const VOEDING: readonly { sleutel: string; afk: string; kleur: string; tips: number }[] = [
  { sleutel: 'hydratatie', afk: 'H2O', kleur: 'var(--mf-blue)', tips: 4 },
  { sleutel: 'focusEten', afk: 'F', kleur: 'var(--mf-green)', tips: 5 },
  { sleutel: 'energie', afk: 'E', kleur: 'var(--mf-amber)', tips: 5 },
  { sleutel: 'antiStress', afk: 'AS', kleur: 'var(--mf-purple)', tips: 4 },
]

const DAGRITME: readonly { sleutel: string; kleur: string; items: number }[] = [
  { sleutel: 'ochtend', kleur: 'var(--mf-green)', items: 3 },
  { sleutel: 'middag', kleur: 'var(--mf-blue)', items: 3 },
  { sleutel: 'avond', kleur: 'var(--mf-purple)', items: 3 },
]

const SLAAP: readonly { sleutel: string; afk: string; kleur: string; tips: number }[] = [
  { sleutel: 'routine', afk: 'SR', kleur: 'var(--mf-purple)', tips: 4 },
  { sleutel: 'stress', afk: 'SS', kleur: 'var(--mf-blue)', tips: 4 },
  { sleutel: 'powernap', afk: 'PN', kleur: 'var(--mf-green)', tips: 4 },
  { sleutel: 'supplementen', afk: 'ML', kleur: 'var(--mf-amber)', tips: 4 },
]

const FEITEN: readonly { sleutel: string; kleur: string }[] = [
  { sleutel: 'slaapduur', kleur: 'var(--mf-purple)' },
  { sleutel: 'nap', kleur: 'var(--mf-green)' },
  { sleutel: 'schermen', kleur: 'var(--mf-blue)' },
]

const WINDDOWN: readonly { sleutel: string; kleur: string }[] = [
  { sleutel: 't60', kleur: 'var(--mf-purple)' },
  { sleutel: 't45', kleur: 'var(--mf-purple)' },
  { sleutel: 't30', kleur: 'var(--mf-blue)' },
  { sleutel: 't20', kleur: 'var(--mf-blue)' },
  { sleutel: 't10', kleur: 'var(--mf-green)' },
  { sleutel: 'inBed', kleur: 'var(--mf-green)' },
]

const TECHNIEKEN: readonly { sleutel: string; afk: string; minuten: number; kleur: string; stappen: number }[] = [
  { sleutel: 'grounding', afk: 'GR', minuten: 2, kleur: 'var(--mf-green)', stappen: 5 },
  { sleutel: 'ontluchting', afk: 'MO', minuten: 5, kleur: 'var(--mf-blue)', stappen: 5 },
  { sleutel: 'herstructurering', afk: 'CH', minuten: 5, kleur: 'var(--mf-purple)', stappen: 5 },
  { sleutel: 'bodyscan', afk: 'BS', minuten: 8, kleur: 'var(--mf-amber)', stappen: 7 },
  { sleutel: 'dankbaarheid', afk: 'DK', minuten: 3, kleur: 'var(--mf-green)', stappen: 5 },
  { sleutel: 'stresscheck', afk: 'SC', minuten: 1, kleur: 'var(--mf-red)', stappen: 5 },
]

const SIGNALEN = ['kortaf', 'kaken', 'focus', 'adem', 'leeg', 'groot', 'slapen', 'scrollen'] as const

/** Genummerde teksten: <basis>1, <basis>2, ... */
function reeks(t: Vertaler, basis: string, aantal: number): string[] {
  return Array.from({ length: aantal }, (_, i) => t(`${basis}${i + 1}`))
}

function tips(t: Vertaler, basis: string, aantal: number): KennisTip[] {
  return Array.from({ length: aantal }, (_, i) => ({
    titel: t(`${basis}.tip${i + 1}.titel`),
    tekst: t(`${basis}.tip${i + 1}.tekst`),
  }))
}

/** Bouwt alle kennisinhoud in de taal van de meegegeven vertaalfunctie. */
export function maakKennis(t: Vertaler): KennisInhoud {
  return {
    bureauoefeningen: OEFENINGEN.map(o => ({
      naam: t(`${K}.oefening.${o.sleutel}.naam`),
      afk: o.afk,
      duur: t(`${K}.minuten`, { aantal: o.minuten }),
      stappen: reeks(t, `${K}.oefening.${o.sleutel}.stap`, o.stappen),
      waarom: t(`${K}.oefening.${o.sleutel}.waarom`),
      intensiteit: o.intensiteit,
    })),
    bewegingsschema: SCHEMA_TIJDEN.map((tijd, i) => ({ tijd, actie: t(`${K}.schema.rij${i + 1}`) })),
    voedingCategorieen: VOEDING.map(c => ({
      titel: t(`${K}.voeding.${c.sleutel}.titel`),
      afk: c.afk,
      kleur: c.kleur,
      tips: tips(t, `${K}.voeding.${c.sleutel}`, c.tips),
    })),
    voedingDagritme: DAGRITME.map(b => ({
      tijd: t(`${K}.dagritme.${b.sleutel}.tijd`),
      kleur: b.kleur,
      items: reeks(t, `${K}.dagritme.${b.sleutel}.item`, b.items),
    })),
    slaapSecties: SLAAP.map(s => ({
      titel: t(`${K}.slaap.${s.sleutel}.titel`),
      afk: s.afk,
      kleur: s.kleur,
      items: tips(t, `${K}.slaap.${s.sleutel}`, s.tips),
    })),
    slaapFeiten: FEITEN.map(f => ({
      label: t(`${K}.feit.${f.sleutel}.label`),
      waarde: t(`${K}.feit.${f.sleutel}.waarde`),
      kleur: f.kleur,
    })),
    winddownRoutine: WINDDOWN.map(w => ({
      tijd: t(`${K}.winddown.${w.sleutel}.tijd`),
      kleur: w.kleur,
      actie: t(`${K}.winddown.${w.sleutel}.actie`),
    })),
    mentaalTechnieken: TECHNIEKEN.map(m => ({
      naam: t(`${K}.techniek.${m.sleutel}.naam`),
      afk: m.afk,
      duur: t(`${K}.minuten`, { aantal: m.minuten }),
      kleur: m.kleur,
      beschrijving: t(`${K}.techniek.${m.sleutel}.beschrijving`),
      stappen: reeks(t, `${K}.techniek.${m.sleutel}.stap`, m.stappen),
    })),
    stressSignalen: SIGNALEN.map(s => t(`${K}.signaal.${s}`)),
  }
}
