// ─── LifeOS — de echte concept-schrijver via Claude ─────────────────────────
// De dunne laag die `ConceptModel` implementeert met een echte modelaanroep.
// Apart van `concept.ts` zodat dat bestand zonder netwerk testbaar blijft.
//
// ─── WAAROM DIT NIET `intentie/intentie-model.ts` HERGEBRUIKT ───────────────
// Dat bestand levert een `IntentieModel` waarvan de tool hard aan `INTENTIE_SCHEMA`
// vastzit: het classificeert een bericht naar een intentie. Een concept schrijven
// is een ander schema en een andere opdracht, dus `classificeer()` past niet —
// tenzij je `intentie-model.ts` generiek maakt over schema en tool. Dat is een
// refactor in `intentie/`, en die map is niet van deze functie.
//
// Wat wél gedeeld hoort te zijn, is gedeeld: hetzelfde model (`claude-sonnet-5`),
// dezelfde tool-use-aanpak (gedwongen JSON), dezelfde `thinking: disabled`. Wie
// die twee ooit samenvoegt, tilt het schema en de toolnaam naar parameters en
// gooit deze factory weg. Zelfde afweging als in `inbox/koppeling.ts` t.o.v.
// `agenda/koppeling.ts` — daar staat 'm ook.

import Anthropic from '@anthropic-ai/sdk'
import { CONCEPT_SCHEMA, type ConceptModel } from './concept'

/**
 * Levert een `ConceptModel` dat schrijft via tool-use (gedwongen JSON).
 *
 * Tool-use i.p.v. vrije tekst: het model MOET het schema invullen, dus het
 * antwoord kan geen vorm hebben die de parser niet aankan. `tool_choice` dwingt
 * af dat het de tool aanroept en niet gaat kletsen.
 *
 * `max_tokens` ruimer dan bij de intentie (600): daar komt een classificatie uit,
 * hier een hele mailtekst.
 */
export function maakAnthropicConceptModel(): ConceptModel {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) throw new Error('ANTHROPIC_API_KEY ontbreekt.')
  const anthropic = new Anthropic({ apiKey: key })

  return {
    async schrijf(systeem: string, bericht: string): Promise<unknown> {
      const antwoord = await anthropic.messages.create({
        model: 'claude-sonnet-5',
        max_tokens: 1500,
        // Sonnet 5 draait anders adaptief thinking; die tokens tellen mee. Een
        // concept-antwoord van vier zinnen heeft geen redeneerruimte nodig.
        thinking: { type: 'disabled' },
        system: systeem,
        tools: [
          {
            name: 'schrijf_concept',
            description: 'Registreer het concept-antwoord op deze e-mail.',
            input_schema: CONCEPT_SCHEMA as unknown as Anthropic.Tool.InputSchema,
          },
        ],
        tool_choice: { type: 'tool', name: 'schrijf_concept' },
        messages: [{ role: 'user', content: bericht }],
      })

      // Zoek het tool_use-blok; de `input` is het gestructureerde antwoord.
      for (const blok of antwoord.content) {
        if (blok.type === 'tool_use' && blok.name === 'schrijf_concept') {
          return blok.input
        }
      }
      // Geen tool-call gekregen (zou niet mogen met tool_choice). Geef iets wat
      // de parser als "onbruikbaar" afwijst i.p.v. te doen alsof.
      return null
    },
  }
}
