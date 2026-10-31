// De oproep om te beginnen en de geruststelling eronder (src/components/aiyourgym/site/Actie.tsx).
// Het Nederlands is GERUSTSTELLING uit inhoud/conversie.ts (daar staat ook waarom elke zin klopt);
// het Engels zegt precies hetzelfde, niets meer. Geen proefperiode (besluit Kane 30-10-2026):
// na het aanmelden betaal je meteen, dus geen "gratis proberen".

import { woordenboek } from '../../woordenboek'
import { GERUSTSTELLING } from '@/components/aiyourgym/inhoud/conversie'

export const ACTIE = woordenboek({
  nl: {
    zonderRisico: 'Waar je op kunt rekenen',
    start: 'Start je club',
    planDemo: 'Plan een demo',
    ofLiveDemo: 'Of bekijk de live demo',
    geruststelling: GERUSTSTELLING,
  },
  en: {
    zonderRisico: 'What you can count on',
    start: 'Start your club',
    planDemo: 'Book a demo',
    ofLiveDemo: 'Or explore the live demo',
    // De losse pakketten staan in pakketten.ts; hier geen pakketnamen.
    geruststelling: [
      'No set-up fee for now',
      'Your data stays yours',
      'Data stored in the EU',
      'Personal help with setting up',
      'Import your member list from Excel or CSV',
    ],
  },
})
