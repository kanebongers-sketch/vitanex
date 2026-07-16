// ─── LifeOS — de echte intentie-classificatie via Claude ────────────────────
// De dunne laag die `IntentieModel` implementeert met een echte modelaanroep.
// Apart gehouden van `intentie.ts` zodat dat bestand zonder netwerk testbaar
// blijft.

import Anthropic from '@anthropic-ai/sdk'
import { INTENTIE_SCHEMA, type IntentieModel } from './intentie'

/**
 * Levert een `IntentieModel` dat classificeert via tool-use (gedwongen JSON).
 *
 * Tool-use i.p.v. vrije tekst: het model MOET het schema invullen, dus het
 * antwoord kan geen vorm hebben die de parser niet aankan. `tool_choice` dwingt
 * af dat het de tool aanroept en niet gaat kletsen.
 */
export function maakAnthropicModel(): IntentieModel {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) throw new Error('ANTHROPIC_API_KEY ontbreekt.')
  const anthropic = new Anthropic({ apiKey: key })

  return {
    async classificeer(systeem: string, bericht: string): Promise<unknown> {
      const antwoord = await anthropic.messages.create({
        model: 'claude-sonnet-5',
        max_tokens: 600,
        // Sonnet 5 draait anders adaptief thinking; die tokens tellen mee.
        thinking: { type: 'disabled' },
        system: systeem,
        tools: [
          {
            name: 'registreer_intentie',
            description: 'Registreer de gestructureerde intentie van het bericht.',
            input_schema: INTENTIE_SCHEMA as unknown as Anthropic.Tool.InputSchema,
          },
        ],
        tool_choice: { type: 'tool', name: 'registreer_intentie' },
        messages: [{ role: 'user', content: bericht }],
      })

      // Zoek het tool_use-blok; de `input` is het gestructureerde antwoord.
      for (const blok of antwoord.content) {
        if (blok.type === 'tool_use' && blok.name === 'registreer_intentie') {
          return blok.input
        }
      }
      // Geen tool-call gekregen (zou niet mogen met tool_choice). Geef iets
      // wat de parser als "onbruikbaar" afwijst i.p.v. te doen alsof.
      return null
    },
  }
}
