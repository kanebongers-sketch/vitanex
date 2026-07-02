export type TileId =
  | 'checkin' | 'coach' | 'rapport' | 'verlof' | 'uren'
  | 'declaraties' | 'loonstroken' | 'nieuws' | 'directory'
  | 'protocollen' | 'surveys' | 'team' | 'niveau'

export type TileDef = {
  id: TileId
  label: string
  sublabel: string
  icon: string
  path: string
  kleur: string         // primary accent
  bg: string            // icon background
  hrOnly?: boolean      // only show in config for HR
}

export const ALLE_TILES: TileDef[] = [
  {
    id: 'checkin',
    label: 'Check-in',
    sublabel: 'Hoe voel je je deze week?',
    icon: 'CI',
    path: '/checkin',
    kleur: 'var(--mf-green)',
    bg: 'var(--mf-green-light)',
  },
  {
    id: 'coach',
    label: 'AI Coach',
    sublabel: 'Persoonlijke begeleiding',
    icon: 'AI',
    path: '/coach',
    kleur: 'var(--mf-blue)',
    bg: 'var(--mf-blue-light)',
  },
  {
    id: 'rapport',
    label: 'Mijn rapport',
    sublabel: 'Jouw vitaliteitsoverzicht',
    icon: 'RP',
    path: '/rapport',
    kleur: 'var(--mf-purple)',
    bg: 'var(--mf-purple-light)',
  },
  {
    id: 'verlof',
    label: 'Verlof',
    sublabel: 'Aanvragen en overzicht',
    icon: 'VL',
    path: '/verlof',
    kleur: 'var(--mf-green-dark)',
    bg: 'var(--mf-green-light)',
  },
  {
    id: 'uren',
    label: 'Urenregistratie',
    sublabel: 'Werkuren bijhouden',
    icon: 'UR',
    path: '/uren',
    kleur: 'var(--mf-amber)',
    bg: 'var(--mf-amber-light)',
  },
  {
    id: 'declaraties',
    label: 'Declaraties',
    sublabel: 'Kosten indienen',
    icon: 'DC',
    path: '/declaraties',
    kleur: 'var(--mf-red)',
    bg: 'var(--mf-red-light)',
  },
  {
    id: 'loonstroken',
    label: 'Loonstroken',
    sublabel: 'Salarisoverzicht',
    icon: 'LS',
    path: '/loonstroken',
    kleur: 'var(--mf-green-mid)',
    bg: 'var(--mf-green-light)',
  },
  {
    id: 'nieuws',
    label: 'Nieuws',
    sublabel: 'Bedrijfsberichten',
    icon: 'NW',
    path: '/nieuws',
    kleur: 'var(--mf-blue)',
    bg: 'var(--mf-blue-light)',
  },
  {
    id: 'directory',
    label: "Collega's",
    sublabel: 'Personeelsgids',
    icon: 'CL',
    path: '/directory',
    kleur: 'var(--mf-purple)',
    bg: 'var(--mf-purple-light)',
  },
  {
    id: 'protocollen',
    label: 'Protocollen',
    sublabel: 'Beleid en procedures',
    icon: 'PR',
    path: '/protocollen',
    kleur: 'var(--mf-amber-dark)',
    bg: 'var(--mf-amber-light)',
  },
  {
    id: 'surveys',
    label: 'Enquetes',
    sublabel: 'Anonieme vragenlijsten',
    icon: 'EQ',
    path: '/surveys',
    kleur: 'var(--mf-rose)',
    bg: 'var(--mf-rose-light)',
  },
  {
    id: 'team',
    label: 'Team dashboard',
    sublabel: 'Teamwelzijn (HR)',
    icon: 'TD',
    path: '/team',
    kleur: 'var(--mf-blue-mid)',
    bg: 'var(--mf-blue-light)',
    hrOnly: true,
  },
  {
    id: 'niveau',
    label: 'Fit Level',
    sublabel: 'XP & achievements',
    icon: 'LV',
    path: '/niveau',
    kleur: 'var(--mf-purple)',
    bg: 'var(--mf-purple-light)',
  },
]

export const DEFAULT_TILES: TileId[] = [
  'checkin', 'coach', 'rapport', 'niveau', 'verlof', 'uren',
  'declaraties', 'loonstroken', 'nieuws', 'directory', 'protocollen', 'surveys',
]

export function getTileDef(id: string): TileDef | undefined {
  return ALLE_TILES.find(t => t.id === id)
}
