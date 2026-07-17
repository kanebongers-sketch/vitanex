// ─── LifeOS — een concept-antwoord laten schrijven ──────────────────────────
// FUNCTIE 2, het AI-deel voor acties. Gegeven wat de triage al van een mail wist
// — afzender en onderwerp, NOOIT de body — schrijft het model een concept-antwoord.
//
// ─── HET RESULTAAT IS ALTIJD EEN CONCEPT ────────────────────────────────────
// Dit bestand levert TEKST, geen verzonden mail. De aanroeper zet 'm in je
// Concepten (`gmail-acties.ts#maakConcept`) en daar blijft hij tot Kane op
// verzenden drukt. Er is geen pad van hier naar `messages.send`, en dat is geen
// toeval: een model dat namens je mailt is een model dat namens je fouten maakt,
// en die kun je niet terughalen. Zelfde asymmetrie als `analyseer/route.ts`: het
// brein stelt vóór, Kane beslist.
//
// ─── PUUR EN INJECTEERBAAR ──────────────────────────────────────────────────
// Het model is een parameter, net als bij `bepaalIntentie` en `analyseerMail`. Zo
// is de hele flow zonder netwerk te testen.
//
// ─── DE EERLIJKE BEPERKING ──────────────────────────────────────────────────
// Wij lezen de body niet (zie `gmail.ts`). Een concept-antwoord op alleen een
// afzender en een onderwerpregel is dus per definitie een OPENING, geen antwoord:
// het model wéét niet wat er gevraagd is. Dat is geen bug om weg te poetsen maar
// een grens om te tonen — de UI zegt het, en het systeemprompt hieronder verbiedt
// het model expliciet om te doen alsof het de mail gelezen heeft. Een concept dat
// zelfverzekerd op een niet-gelezen vraag antwoordt, is erger dan geen concept.

/** Het schema dat het model moet invullen. Tool-use, dus geen vrije tekst. */
export const CONCEPT_SCHEMA = {
  type: 'object',
  properties: {
    onderwerp: {
      type: 'string',
      description:
        'De onderwerpregel van het antwoord. Meestal "Re: " gevolgd door het originele onderwerp.',
    },
    tekst: {
      type: 'string',
      description:
        'De volledige tekst van het concept-antwoord in het Nederlands, inclusief aanhef en afsluiting.',
    },
  },
  required: ['onderwerp', 'tekst'],
  additionalProperties: false,
} as const

/** De modelaanroep, injecteerbaar. Spiegelt `IntentieModel`. */
export interface ConceptModel {
  schrijf(systeem: string, bericht: string): Promise<unknown>
}

export interface ConceptVoorstel {
  onderwerp: string
  tekst: string
}

/** Wat we van de mail weten. Exact wat de triage toonde — geen veld meer. */
export interface ConceptMail {
  afzender: string | null
  onderwerp: string
  /** Kane's eigen naam, voor de ondertekening. Null = niet ondertekenen. */
  mijnNaam?: string | null
}

/**
 * Het systeemprompt.
 *
 * De belangrijkste regel staat er twee keer, want dit is precies waar een model
 * behulpzaam wil zijn en daardoor liegt: het heeft de mail NIET gelezen. Doet het
 * alsof, dan schrijft het "zoals besproken ga ik akkoord met de voorwaarden" op
 * een onderwerpregel waar het woord "voorwaarden" in stond — en dat verstuurt
 * Kane dan bijna.
 */
export function conceptSysteem(mail: ConceptMail): string {
  const naam = mail.mijnNaam?.trim()
  return [
    'Je schrijft een CONCEPT-antwoord op een e-mail, namens de gebruiker.',
    '',
    'BELANGRIJK — je hebt de inhoud van de mail NIET gezien. Je kent alleen de',
    'afzender en de onderwerpregel. Schrijf dus nooit alsof je weet wat er in de',
    'mail staat: geen "zoals besproken", geen toezeggingen, geen bedragen, geen',
    'data, geen aannames over wat er gevraagd wordt. Verzin niets.',
    '',
    'Wat je wél doet: een korte, bruikbare opening die de afzender erkent en de',
    'volgende stap zet — een vraag om verduidelijking, een bevestiging van',
    'ontvangst, of een voorstel om te bellen. Iets waar de gebruiker in twee tikken',
    'een echt antwoord van maakt.',
    '',
    'Toon: Nederlands, helder en menselijk. Geen jargon, geen overdreven',
    'beleefdheidsformules. Kort — vier zinnen is meestal genoeg.',
    naam ? `Onderteken met: ${naam}` : 'Sluit af zonder ondertekening.',
  ].join('\n')
}

/** De tekst die het model classificeert. Nadrukkelijk gelabeld als ONTVANGEN mail. */
export function berichtVanMail(mail: ConceptMail): string {
  const afz = mail.afzender ? `Afzender: ${mail.afzender}. ` : ''
  return `${afz}Onderwerp: ${mail.onderwerp}`
}

// ─── Systeemgrens: het antwoord van het model ───────────────────────────────
// Ook het model is een grens. Het mag morgen iets anders teruggeven; dan willen
// we een nette `null` en geen half object dat als concept in je mailbox belandt.

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function tekst(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const s = v.trim()
  return s.length > 0 ? s : null
}

/** Het modelantwoord → een voorstel, of null als het onbruikbaar is. */
export function leesConceptVoorstel(ruw: unknown): ConceptVoorstel | null {
  if (!isObject(ruw)) return null

  const onderwerp = tekst(ruw.onderwerp)
  const inhoud = tekst(ruw.tekst)
  // Beide zijn verplicht: een concept zonder tekst is geen concept, en een
  // concept zonder onderwerp is een mail die niemand terugvindt.
  if (onderwerp === null || inhoud === null) return null

  return { onderwerp, tekst: inhoud }
}

/**
 * Laat het model een concept schrijven.
 *
 * `null` = geen bruikbaar concept (model onbereikbaar, of een antwoord dat we
 * niet vertrouwen). Nadrukkelijk NIET een leeg concept: een lege mail in je
 * Concepten is ruis die eruit ziet als werk. De aanroeper hoort `null` als een
 * eerlijke fout te tonen, niet als een resultaat.
 */
export async function schrijfConcept(
  mail: ConceptMail,
  model: ConceptModel,
): Promise<ConceptVoorstel | null> {
  const onderwerp = mail.onderwerp.trim()
  if (onderwerp.length === 0) return null // niets om op te reageren; scheelt een aanroep

  try {
    const ruw = await model.schrijf(conceptSysteem(mail), berichtVanMail(mail))
    return leesConceptVoorstel(ruw)
  } catch {
    // Modelstoring → geen concept. Zelfde keuze als `bepaalIntentie`: één kapotte
    // aanroep mag de route niet opblazen, maar hij mag ook niet als leeg succes
    // eindigen. `null` betekent hier "het lukte niet", en de route zegt dat.
    return null
  }
}

// ─── Systeemgrens: het verzoek aan onze eigen API ───────────────────────────

export type ConceptVerzoekUitkomst =
  | { ok: true; mail: ConceptMail; externId: string; threadId: string | null }
  | { ok: false; fout: string }

/** Leest `POST /api/lifeos/inbox/concept`. De client stuurt wat de triage al toonde. */
export function leesConceptVerzoek(body: unknown): ConceptVerzoekUitkomst {
  if (!isObject(body)) return { ok: false, fout: 'Ongeldige invoer.' }

  const externId = tekst(body.extern_id)
  if (externId === null) return { ok: false, fout: 'extern_id ontbreekt.' }

  const onderwerp = tekst(body.onderwerp)
  if (onderwerp === null) {
    // Geen onderwerp = niets om een antwoord op te baseren. Eerlijk weigeren is
    // beter dan het model iets laten verzinnen bij een lege regel.
    return { ok: false, fout: 'Deze mail heeft geen onderwerp om op te antwoorden.' }
  }

  return {
    ok: true,
    externId,
    mail: { afzender: tekst(body.afzender), onderwerp },
    threadId: tekst(body.thread_id),
  }
}
