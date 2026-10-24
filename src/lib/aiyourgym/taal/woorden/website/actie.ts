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
    // De aanmeldband onderaan elke pagina (site/AanmeldBand.tsx)
    bandLabel: (dagen: number) => `${dagen} dagen gratis proberen`,
    bandTitel: 'Zet je sportschool er vandaag in.',
    bandLead: (dagen: number) => `Je krijgt een eigen omgeving met je eigen logo en kleuren. Probeer alles ${dagen} dagen met je team, of laat het je eerst persoonlijk zien.`,
    geruststelling: GERUSTSTELLING,
  },
  en: {
    zonderRisico: 'No risk',
    probeerDagen: (dagen: number) => `Try it free for ${dagen} days`,
    planDemo: 'Book a free demo',
    ofLiveDemo: 'Or explore the live demo',
    bandLabel: (dagen: number) => `${dagen}-day free trial`,
    bandTitel: 'Bring your gym on board today.',
    bandLead: (dagen: number) => `You get your own environment with your own logo and colours. Try everything with your team for ${dagen} days, or let us show you in person first.`,
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
