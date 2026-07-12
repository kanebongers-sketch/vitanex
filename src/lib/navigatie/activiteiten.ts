/**
 * Gedeelde activiteiten-definitie — kleuren, routes en labels komen
 * hier vandaan. WeekRingen.tsx en alle activiteitspagina's importeren
 * hier zodat de kleurcode altijd overeenkomt met het taartdiagram.
 */

export const ACTIVITEITEN = [
  {
    key:   'mentaal',
    label: 'Mentaal',
    kleur: '#8B5CF6',
    href:  '/stemming',
    emoji: '🧠',
    beschrijving: 'Stemming & energie',
  },
  {
    key:   'fysiek',
    label: 'Fysiek',
    kleur: '#10B981',
    href:  '/sport',
    emoji: '💪',
    beschrijving: 'Sport & beweging',
  },
  {
    key:   'water',
    label: 'Water',
    kleur: '#06B6D4',
    href:  '/water',
    emoji: '💧',
    beschrijving: 'Hydratatie',
  },
  {
    key:   'rust',
    label: 'Rust',
    kleur: '#6366F1',
    href:  '/slaap',
    emoji: '😴',
    beschrijving: 'Slaap & herstel',
  },
  {
    key:   'meditatie',
    label: 'Meditatie',
    kleur: '#F59E0B',
    href:  '/meditatie',
    emoji: '🧘',
    beschrijving: 'Ademhaling & rust',
  },
  {
    key:   'dankbaarheid',
    label: 'Dankbaarheid',
    kleur: '#F97316',
    href:  '/dankbaarheid',
    emoji: '🙏',
    beschrijving: 'Positieve reflectie',
  },
] as const

export type ActiviteitKey = typeof ACTIVITEITEN[number]['key']

export function getActiviteit(key: ActiviteitKey) {
  return ACTIVITEITEN.find(a => a.key === key)!
}

/** Kleine gekleurde badge-balk voor bovenaan een activiteitspagina. */
export function activiteitKleur(key: ActiviteitKey): string {
  return getActiviteit(key).kleur
}
