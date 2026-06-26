// Eén bron van waarheid voor de hoofdcategorieën. De navbar linkt rechtstreeks
// naar de landingspagina; die pagina toont de onderdelen als keuzemenu.

export interface CategorieItem {
  href: string
  label: string
}

export interface CategorieDef {
  sleutel: string
  titel: string
  intro: string
  kleur: string
  items: CategorieItem[]
}

export const CATEGORIEEN: Record<'welzijn' | 'actief' | 'groeien' | 'profiel', CategorieDef> = {
  welzijn: {
    sleutel: 'welzijn',
    titel: 'Welzijn',
    intro: 'Hoe gaat het echt met je? Log je gevoel en ontdek je patronen.',
    kleur: 'var(--mf-green)',
    items: [
      { href: '/stemming',          label: 'Stemming'          },
      { href: '/slaap',             label: 'Slaap'             },
      { href: '/stress',            label: 'Stress'            },
      { href: '/werkgeluk',         label: 'Werkgeluk'         },
      { href: '/psych-veiligheid',  label: 'Psych. veiligheid' },
      { href: '/inzichten',         label: 'Inzichten'         },
      { href: '/patronen',          label: 'Mijn patronen'     },
      { href: '/rapport',           label: 'Rapport'           },
      { href: '/stemming-kalender', label: 'Stemming kalender' },
    ],
  },
  actief: {
    sleutel: 'actief',
    titel: 'Actief',
    intro: 'Je lichaam in beweging — sport, voeding, water en focus.',
    kleur: 'var(--mf-orange)',
    items: [
      { href: '/sport',      label: 'Sport'      },
      { href: '/voeding',    label: 'Voeding'    },
      { href: '/water',      label: 'Water'      },
      { href: '/gezondheid', label: 'Gezondheid' },
      { href: '/focus',      label: 'Focus'      },
    ],
  },
  groeien: {
    sleutel: 'groeien',
    titel: 'Groeien',
    intro: 'Werk aan jezelf — met je coach, je doelen en rustmomenten.',
    kleur: 'var(--mf-purple)',
    items: [
      { href: '/coach',        label: 'AI Coach'     },
      { href: '/doelen',       label: 'Doelen'       },
      { href: '/journal',      label: 'Journal'      },
      { href: '/meditatie',    label: 'Meditatie'    },
      { href: '/ademhaling',   label: 'Ademhaling'   },
      { href: '/dankbaarheid', label: 'Dankbaarheid' },
      { href: '/reflectie',    label: 'Reflectie'    },
      { href: '/groeiplan',    label: 'Groeiplan'    },
      { href: '/disc',         label: 'DISC'         },
    ],
  },
  profiel: {
    sleutel: 'profiel',
    titel: 'Profiel',
    intro: 'Jouw account, voortgang en instellingen op één plek.',
    kleur: 'var(--mf-blue)',
    items: [
      { href: '/mijn-gesprekken', label: 'Mijn gesprekken' },
      { href: '/achievements',    label: 'Achievements'    },
      { href: '/voortgang',       label: 'Voortgang'       },
      { href: '/koppelingen',     label: 'Koppelingen'     },
      { href: '/mijn-rapport',    label: 'Mijn rapport'    },
      { href: '/instellingen',    label: 'Instellingen'    },
    ],
  },
}
