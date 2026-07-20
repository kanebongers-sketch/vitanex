// ─── LifeOS — de echte dagbriefing-schrijver via Claude ─────────────────────
// De dunne laag die `BriefingModel` implementeert met een echte modelaanroep.
// Apart van `dagbriefing.ts` zodat dat bestand zonder netwerk testbaar blijft —
// exact dezelfde opzet als `intentie/intentie-model.ts` en `inbox/concept-model.ts`.
//
// Wat gedeeld hoort te zijn, is gedeeld: hetzelfde model (`claude-sonnet-5`),
// dezelfde tool-use-aanpak (gedwongen JSON), dezelfde `thinking: disabled`. Wie
// intentie/concept/dagbriefing ooit samenvoegt, tilt schema en toolnaam naar
// parameters en gooit deze drie factories weg — dezelfde afweging als daar staat.

import Anthropic from '@anthropic-ai/sdk'
import { DAGBRIEFING_SCHEMA, type BriefingModel } from './dagbriefing'

/**
 * Levert een `BriefingModel` dat de briefing schrijft via tool-use (gedwongen
 * JSON). `tool_choice` dwingt af dat het model het schema invult en niet gaat
 * kletsen, dus het antwoord kan geen vorm hebben die de parser niet aankan.
 *
 * `max_tokens` ruimer dan bij de intentie (600): hier komt een samenvatting plus
 * drie lijstjes uit, geen enkele classificatie.
 */
export function maakAnthropicBriefingModel(): BriefingModel {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) throw new Error('ANTHROPIC_API_KEY ontbreekt.')
  const anthropic = new Anthropic({ apiKey: key })

  return {
    async schrijf(systeem: string, feiten: string): Promise<unknown> {
      const antwoord = await anthropic.messages.create({
        model: 'claude-sonnet-5',
        max_tokens: 1200,
        // Sonnet 5 draait anders adaptief thinking; die tokens tellen mee. Een
        // korte briefing uit een feitenblok heeft geen redeneerruimte nodig.
        thinking: { type: 'disabled' },
        system: systeem,
        tools: [
          {
            name: 'schrijf_dagbriefing',
            description: 'Registreer de dagbriefing: samenvatting, prioriteiten, risico\'s en kansen.',
            input_schema: DAGBRIEFING_SCHEMA as unknown as Anthropic.Tool.InputSchema,
          },
        ],
        tool_choice: { type: 'tool', name: 'schrijf_dagbriefing' },
        messages: [{ role: 'user', content: feiten }],
      })

      // Zoek het tool_use-blok; de `input` is het gestructureerde antwoord.
      for (const blok of antwoord.content) {
        if (blok.type === 'tool_use' && blok.name === 'schrijf_dagbriefing') {
          return blok.input
        }
      }
      // Geen tool-call gekregen (zou niet mogen met tool_choice). Geef iets wat de
      // parser als "onbruikbaar" afwijst i.p.v. te doen alsof — de aanroeper valt
      // dan netjes op de deterministische fallback terug.
      return null
    },
  }
}
