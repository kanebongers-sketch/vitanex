// De oproep om te beginnen en de geruststelling eronder (src/components/aiyourgym/site/Actie.tsx).
// Het Nederlands is GERUSTSTELLING uit inhoud/conversie.ts (daar staat ook waarom elke zin klopt);
// het Engels zegt precies hetzelfde, niets meer.

import { PROEFDAGEN } from '@/lib/aiyourgym/pakketten'
import { GERUSTSTELLING } from '@/components/aiyourgym/inhoud/conversie'
import { woordenboek } from '../../woordenboek'

export const ACTIE = woordenboek({
  nl: {
    zonderRisico: 'Zonder risico',
    probeerDagen: (dagen: number) => `Probeer ${dagen} dagen gratis`,
    planDemo: 'Plan een gratis demo',
    ofLiveDemo: 'Of bekijk de live demo',
    geruststelling: GERUSTSTELLING,
  },
  en: {
    zonderRisico: 'No risk',
    probeerDagen: (dagen: number) => `Try it free for ${dagen} days`,
    planDemo: 'Book a free demo',
    ofLiveDemo: 'Or explore the live demo',
    // Plannamen (Start, Club, Keten) zijn productnamen uit pakketten.ts en blijven gelijk.
    geruststelling: [
      `Try it free for ${PROEFDAGEN} days`,
      'Cancelling during the trial costs nothing',
      'No set-up fee for now',
      'Your data stays yours',
      'Personal help in the Club and Keten plans',
      'Data stored in the EU',
    ],
  },
})
