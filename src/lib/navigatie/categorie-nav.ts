// Eén bron van waarheid voor de hoofdcategorieën. De navbar linkt rechtstreeks
// naar de landingspagina; die pagina toont de onderdelen als keuzemenu.
//
// Consumenten-gericht opgeschoond (8-8-2026): alleen gezondheids-categorieën, het
// B2B/werk-OS-spul (werkgeluk, psych-veiligheid, DISC, coaching-gesprekken,
// team-uitdagingen …) is uit de consumenten-navigatie gehaald. Enkel bestaande,
// bewezen items + iconen — geen nieuwe icoonnamen, zodat er niets kapot rendert.

export interface CategorieItem {
  href: string
  label: string
  icoon?: string
}

export interface CategorieDef {
  sleutel: string
  titel: string
  intro: string
  kleur: string
  icoon: string
  items: CategorieItem[]
}

export const CATEGORIEEN: Record<'welzijn' | 'actief' | 'groeien' | 'profiel', CategorieDef> = {
  welzijn: {
    sleutel: 'welzijn',
    titel: 'Mentaal',
    intro: 'Hoe gaat het echt met je? Log je gevoel en ontdek je patronen.',
    kleur: 'var(--mf-green)',
    icoon: 'heart-pulse',
    items: [
      { href: '/stemming',   label: 'Stemming',   icoon: 'smile' },
      { href: '/slaap',      label: 'Slaap',      icoon: 'moon'  },
      { href: '/stress',     label: 'Stress',     icoon: 'zap'   },
      { href: '/meditatie',  label: 'Meditatie',  icoon: 'leaf'  },
      { href: '/ademhaling', label: 'Ademhaling', icoon: 'wind'  },
      { href: '/inzichten',  label: 'Inzichten',  icoon: 'sparkles' },
    ],
  },
  actief: {
    sleutel: 'actief',
    titel: 'Fysiek',
    intro: 'Je lichaam in beweging — training, voeding, stappen en meer.',
    kleur: 'var(--mf-orange)',
    icoon: 'activity',
    items: [
      { href: '/voeding',    label: 'Voeding',    icoon: 'apple'    },
      { href: '/sport',      label: 'Training',   icoon: 'dumbbell' },
      { href: '/stappen',    label: 'Stappen',    icoon: 'activity' },
      { href: '/water',      label: 'Water',      icoon: 'droplets' },
      { href: '/gezondheid', label: 'Lichaam',    icoon: 'heart'    },
      { href: '/focus',      label: 'Focus',      icoon: 'target'   },
    ],
  },
  groeien: {
    sleutel: 'groeien',
    titel: 'Groeien',
    intro: 'Werk aan jezelf — met je coach, je doelen en rustmomenten.',
    kleur: 'var(--mf-purple)',
    icoon: 'layers',
    items: [
      { href: '/coach',        label: 'Vita',         icoon: 'bot'          },
      { href: '/doelen',       label: 'Doelen',       icoon: 'flag'         },
      { href: '/journal',      label: 'Dagboek',      icoon: 'notebook-pen' },
      { href: '/dankbaarheid', label: 'Dankbaarheid', icoon: 'hand-heart'   },
      { href: '/reflectie',    label: 'Reflectie',    icoon: 'telescope'    },
      { href: '/groeiplan',    label: 'Groeiplan',    icoon: 'trending-up'  },
    ],
  },
  profiel: {
    sleutel: 'profiel',
    titel: 'Profiel',
    intro: 'Jouw account, voortgang en instellingen op één plek.',
    kleur: 'var(--mf-blue)',
    icoon: 'user',
    items: [
      { href: '/achievements', label: 'Achievements',    icoon: 'trophy'         },
      { href: '/voortgang',    label: 'Voortgang',       icoon: 'bar-chart-2'    },
      { href: '/prestaties',   label: 'Lichaamsmetingen', icoon: 'activity'      },
      { href: '/koppelingen',  label: 'Koppelingen',     icoon: 'link'           },
      { href: '/mijn-rapport', label: 'Mijn rapport',    icoon: 'file-bar-chart' },
      { href: '/instellingen', label: 'Instellingen',    icoon: 'settings'       },
    ],
  },
}
