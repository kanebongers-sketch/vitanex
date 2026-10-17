// ─── Club: Vandaag voor een clubmanager (PUUR) ──────────────────────────────
// De startpagina haalt alles van de vestiging in een keer op. Een clubmanager
// ziet daarvan alleen wat bij de onderdelen hoort die de eigenaar hem gaf; de
// rest gaat leeg de pagina in, zodat er niets van naar de browser gaat. De
// tellers van check-ins blijven staan: dat zijn aantallen, geen gegevens van
// personen.

import type { Vandaag } from '@/lib/club/cijfers/haal-vandaag'

export function beperkVandaag(data: Vandaag, mag: (onderdeel: string) => boolean): Vandaag {
  const leads = mag('leads')
  const leden = mag('leden')
  return {
    ...data,
    lessen: mag('rooster') ? data.lessen : [],
    proeflessen: leads ? data.proeflessen : [],
    opvolgen: leads ? data.opvolgen : [],
    opvolgenTotaal: leads ? data.opvolgenTotaal : 0,
    risico: leden ? data.risico : [],
    laatsteOoit: leden ? data.laatsteOoit : new Map(),
    nieuw: leden ? data.nieuw : [],
    jarig: leden ? data.jarig : [],
    werkvloer: {
      ...data.werkvloer,
      diensten: mag('personeel') ? data.werkvloer.diensten : [],
      taken: mag('taken') ? data.werkvloer.taken : null,
      heeftTaken: mag('taken') ? data.werkvloer.heeftTaken : false,
    },
  }
}
