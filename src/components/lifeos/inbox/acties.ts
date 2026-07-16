// ─── LifeOS — inbox: de aanmaak-call ────────────────────────────────────────
// Eén dun laagje boven `haalJson`: het stuurt het POST-verzoek dat `verzoekVoorActie`
// heeft samengesteld. Apart van `suggestie-actie.ts` gehouden omdat dít bestand
// `haalJson` (en daarmee de supabase-client) aanraakt — de pure mapping ernaast
// blijft zo zonder netwerk testbaar.
//
// `leesNiets`: we hebben de aangemaakte taak/afspraak hier niet nodig, alleen of
// het lukte. Een 2xx = gemaakt; een foutstatus komt als `{ ok: false, fout }`
// terug met de nette Nederlandse melding van de route. Fout wordt zichtbaar
// gemaakt door de aanroeper (`SuggestieActie`), nooit stil ingeslikt.

import { haalJson, leesNiets, type HaalUitkomst } from '@/lib/lifeos/api/http'
import { verzoekVoorActie, type ActieSuggestie } from './suggestie-actie'

/** Maakt de taak of afspraak aan. De klik bevestigt; hier gebeurt het pas echt. */
export function maakActie(actie: ActieSuggestie): Promise<HaalUitkomst<true>> {
  const { pad, body } = verzoekVoorActie(actie)
  return haalJson(pad, leesNiets, { method: 'POST', body: JSON.stringify(body) })
}
