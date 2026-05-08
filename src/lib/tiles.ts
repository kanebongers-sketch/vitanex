export type TileId =
  | 'checkin' | 'coach' | 'rapport' | 'verlof' | 'uren'
  | 'declaraties' | 'loonstroken' | 'nieuws' | 'directory'
  | 'protocollen' | 'surveys' | 'team'

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
    icon: '✅',
    path: '/checkin',
    kleur: '#1D9E75',
    bg: '#E1F5EE',
  },
  {
    id: 'coach',
    label: 'AI Coach',
    sublabel: 'Persoonlijke begeleiding',
    icon: '🧠',
    path: '/coach',
    kleur: '#185FA5',
    bg: '#E6F1FB',
  },
  {
    id: 'rapport',
    label: 'Mijn rapport',
    sublabel: 'Jouw vitaliteitsoverzicht',
    icon: '📊',
    path: '/rapport',
    kleur: '#7C3AED',
    bg: '#EDE9FE',
  },
  {
    id: 'verlof',
    label: 'Verlof',
    sublabel: 'Aanvragen en overzicht',
    icon: '🌴',
    path: '/verlof',
    kleur: '#0F6E56',
    bg: '#D1FAE5',
  },
  {
    id: 'uren',
    label: 'Urenregistratie',
    sublabel: 'Werkuren bijhouden',
    icon: '⏱️',
    path: '/uren',
    kleur: '#B45309',
    bg: '#FEF3C7',
  },
  {
    id: 'declaraties',
    label: 'Declaraties',
    sublabel: 'Kosten indienen',
    icon: '🧾',
    path: '/declaraties',
    kleur: '#DC2626',
    bg: '#FEE2E2',
  },
  {
    id: 'loonstroken',
    label: 'Loonstroken',
    sublabel: 'Salarisoverzicht',
    icon: '💶',
    path: '/loonstroken',
    kleur: '#065F46',
    bg: '#ECFDF5',
  },
  {
    id: 'nieuws',
    label: 'Nieuws',
    sublabel: 'Bedrijfsberichten',
    icon: '📰',
    path: '/nieuws',
    kleur: '#1D4ED8',
    bg: '#EFF6FF',
  },
  {
    id: 'directory',
    label: "Collega's",
    sublabel: 'Personeelsgids',
    icon: '👥',
    path: '/directory',
    kleur: '#6D28D9',
    bg: '#F5F3FF',
  },
  {
    id: 'protocollen',
    label: 'Protocollen',
    sublabel: 'Beleid en procedures',
    icon: '📋',
    path: '/protocollen',
    kleur: '#92400E',
    bg: '#FEF3C7',
  },
  {
    id: 'surveys',
    label: 'Enquetes',
    sublabel: 'Anonieme vragenlijsten',
    icon: '📝',
    path: '/surveys',
    kleur: '#9D174D',
    bg: '#FDF2F8',
  },
  {
    id: 'team',
    label: 'Team dashboard',
    sublabel: 'Teamwelzijn (HR)',
    icon: '📈',
    path: '/team',
    kleur: '#0369A1',
    bg: '#E0F2FE',
    hrOnly: true,
  },
]

export const DEFAULT_TILES: TileId[] = [
  'checkin', 'coach', 'rapport', 'verlof', 'uren',
  'declaraties', 'loonstroken', 'nieuws', 'directory', 'protocollen', 'surveys',
]

export function getTileDef(id: string): TileDef | undefined {
  return ALLE_TILES.find(t => t.id === id)
}
