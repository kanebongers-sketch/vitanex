// ─── LifeOS — inbox: de schrijf-calls ───────────────────────────────────────
// Eén dun laagje boven `haalJson` voor de acties die écht iets in je mailbox
// veranderen. Apart van `acties.ts` (die maakt een taak/afspraak in LifeOS) —
// dit raakt Gmail zelf, en dat verschil hoort in de bestandsnaam te staan.
//
// Elke functie hier hangt aan een KLIK. Er zit geen automatiek achter en die mag
// er nooit komen: het model stelt voor, Kane doet.

import { haalJson, leesNiets, type HaalUitkomst } from '@/lib/lifeos/api/http'
import type { TriageMailJson } from '@/lib/lifeos/inbox/inbox'

/** De acties die de UI kent. Spiegelt `soort` in `POST /api/lifeos/inbox/acties`. */
export type MailActieSoort = 'archiveer' | 'markeer_gelezen'

/** Archiveert of markeert als gelezen. Beide zijn labelwijzigingen bij Gmail. */
export function voerMailActieUit(
  soort: MailActieSoort,
  mail: TriageMailJson,
): Promise<HaalUitkomst<true>> {
  return haalJson('/api/lifeos/inbox/acties', leesNiets, {
    method: 'POST',
    body: JSON.stringify({ soort, extern_id: mail.id }),
  })
}

/**
 * Vraagt Vita om een concept-antwoord en laat het in je Gmail-concepten zetten.
 *
 * Stuurt alleen de metadata mee die de triage al toonde — geen nieuwe Gmail-call,
 * geen body. Het resultaat is altijd een CONCEPT; versturen doet Kane zelf.
 */
export function vraagConcept(mail: TriageMailJson): Promise<HaalUitkomst<true>> {
  return haalJson('/api/lifeos/inbox/concept', leesNiets, {
    method: 'POST',
    body: JSON.stringify({
      extern_id: mail.id,
      afzender: mail.afzender,
      onderwerp: mail.onderwerp,
    }),
  })
}
