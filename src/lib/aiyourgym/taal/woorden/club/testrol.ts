import { woordenboek } from '../../woordenboek'

// Testen als een rol (opdracht Kane 30-10-2026): alleen voor het master
// account in een testaccount. Code: src/lib/club/rollen/testrol.ts.

export const TESTROL = woordenboek({
  nl: {
    label: 'Testen als rol',
    uit: 'Je ziet alles als master account. Kies een of meer rollen om Club te zien en te gebruiken zoals die rol.',
    aan: (rollen: string) => `Testmodus: je ziet en werkt in Club als ${rollen}. Alleen in deze sportschool; na 8 uur stopt het vanzelf.`,
    toepassen: 'Bekijk als deze rollen',
    stoppen: 'Terug naar master account',
    bezig: 'Bezig...',
    kies: 'Kies minstens een rol.',
    fout: 'Wisselen lukte niet. Probeer het opnieuw.',
    en: 'en',
  },
  en: {
    label: 'Test as role',
    uit: 'You see everything as the master account. Pick one or more roles to see and use Club as that role.',
    aan: (rollen: string) => `Test mode: you see and work in Club as ${rollen}. Only in this gym; it stops by itself after 8 hours.`,
    toepassen: 'View as these roles',
    stoppen: 'Back to master account',
    bezig: 'Working...',
    kies: 'Pick at least one role.',
    fout: 'Switching failed. Please try again.',
    en: 'and',
  },
})
