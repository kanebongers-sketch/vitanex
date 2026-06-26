// Eén bron van waarheid voor de hoofdcategorieën. De navbar linkt rechtstreeks
// naar de landingspagina; die pagina toont de onderdelen als keuzemenu.

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
    titel: 'Welzijn',
    intro: 'Hoe gaat het echt met je? Log je gevoel en ontdek je patronen.',
    kleur: 'var(--mf-green)',
    icoon: 'heart-pulse',
    items: [
      { href: '/stemming',          label: 'Stemming',          icoon: 'smile'          },
      { href: '/slaap',             label: 'Slaap',             icoon: 'moon'           },
      { href: '/stress',            label: 'Stress',            icoon: 'zap'            },
      { href: '/werkgeluk',         label: 'Werkgeluk',         icoon: 'sun'            },
      { href: '/psych-veiligheid',  label: 'Psych. veiligheid', icoon: 'shield'         },
      { href: '/inzichten',         label: 'Inzichten',         icoon: 'sparkles'       },
      { href: '/patronen',          label: 'Mijn patronen',     icoon: 'git-branch'     },
      { href: '/rapport',           label: 'Rapport',           icoon: 'file-text'      },
      { href: '/stemming-kalender', label: 'Stemming kalender', icoon: 'calendar'       },
    ],
  },
  actief: {
    sleutel: 'actief',
    titel: 'Actief',
    intro: 'Je lichaam in beweging — sport, voeding, water en focus.',
    kleur: 'var(--mf-orange)',
    icoon: 'activity',
    items: [
      { href: '/sport',      label: 'Sport',      icoon: 'dumbbell'   },
      { href: '/voeding',    label: 'Voeding',    icoon: 'apple'      },
      { href: '/water',      label: 'Water',      icoon: 'droplets'   },
      { href: '/gezondheid', label: 'Gezondheid', icoon: 'heart'      },
      { href: '/focus',      label: 'Focus',      icoon: 'target'     },
    ],
  },
  groeien: {
    sleutel: 'groeien',
    titel: 'Groeien',
    intro: 'Werk aan jezelf — met je coach, je doelen en rustmomenten.',
    kleur: 'var(--mf-purple)',
    icoon: 'layers',
    items: [
      { href: '/coach',        label: 'AI Coach',     icoon: 'bot'            },
      { href: '/doelen',       label: 'Doelen',       icoon: 'flag'           },
      { href: '/journal',      label: 'Journal',      icoon: 'notebook-pen'   },
      { href: '/meditatie',    label: 'Meditatie',    icoon: 'leaf'           },
      { href: '/ademhaling',   label: 'Ademhaling',   icoon: 'wind'           },
      { href: '/dankbaarheid', label: 'Dankbaarheid', icoon: 'hand-heart'     },
      { href: '/reflectie',    label: 'Reflectie',    icoon: 'telescope'      },
      { href: '/groeiplan',    label: 'Groeiplan',    icoon: 'trending-up'    },
      { href: '/disc',         label: 'DISC',         icoon: 'pie-chart'      },
    ],
  },
  profiel: {
    sleutel: 'profiel',
    titel: 'Profiel',
    intro: 'Jouw account, voortgang en instellingen op één plek.',
    kleur: 'var(--mf-blue)',
    icoon: 'user',
    items: [
      { href: '/mijn-gesprekken', label: 'Mijn gesprekken', icoon: 'message-circle'  },
      { href: '/achievements',    label: 'Achievements',    icoon: 'trophy'          },
      { href: '/voortgang',       label: 'Voortgang',       icoon: 'bar-chart-2'     },
      { href: '/koppelingen',     label: 'Koppelingen',     icoon: 'link'            },
      { href: '/mijn-rapport',    label: 'Mijn rapport',    icoon: 'file-bar-chart'  },
      { href: '/instellingen',    label: 'Instellingen',    icoon: 'settings'        },
    ],
  },
}
