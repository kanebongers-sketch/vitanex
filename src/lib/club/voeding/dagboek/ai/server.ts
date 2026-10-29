// ─── Club, voedingsdagboek: de betaalde AI aanroepen (SERVER-ONLY) ──────────
// Geporteerd uit MentaForce (api/voeding/analyseer en schat). Alleen bereikbaar
// met CLUB_VOEDING_AI_ACTIEF=1 (zie schakelaar.ts) en na toestemming van het
// lid. Elk antwoord is een VOORSTEL: de ledenapp toont de items en het lid
// controleert, past aan en bevestigt zelf; er wordt nooit automatisch gelogd.
// We bewaren en loggen nooit de foto, de tekst of het resultaat.

import Anthropic from '@anthropic-ai/sdk'
import { eersteJson, leesAiRespons, type AiRespons } from './lezen'
import { aiModel } from './schakelaar'

export type AiUitslag = { ok: true; respons: AiRespons } | { ok: false; status: number; fout: string }

const ITEM_VORM = `{"items":[{"naam":"Ei (gekookt)","portie_omschrijving":"2 stuks","portie_gram":100,"calorieen":155,"eiwitten_g":13,"koolhydraten_g":1.1,"vetten_g":11,"betrouwbaarheid":"gemiddeld"}]}`

function regels(taal: 'nl' | 'en'): string {
  return [
    'Splits het in losse voedingsmiddelen en geef per item een realistische SCHATTING van de portie in gram en de kcal, eiwit, koolhydraten en vet voor die portie.',
    'Wees eerlijk: overschat niet, en zet "betrouwbaarheid" op "laag" als de hoeveelheid onduidelijk is.',
    `Schrijf de namen in het ${taal === 'en' ? 'Engels' : 'Nederlands'}.`,
    `Antwoord ALLEEN met geldige JSON (geen markdown, geen extra tekst), in deze vorm: ${ITEM_VORM}`,
    'Alle getallen als getal, niet als tekst. Zit er geen voedsel in, geef dan {"items": []}.',
  ].join('\n')
}

function client(): Anthropic | null {
  const sleutel = process.env.ANTHROPIC_API_KEY?.trim()
  return sleutel ? new Anthropic({ apiKey: sleutel, timeout: 45_000, maxRetries: 1 }) : null
}

/** Een vraag aan het model; het antwoord wordt meteen gelezen en begrensd. */
async function vraag(inhoud: Anthropic.MessageParam['content'], transcript: string): Promise<AiUitslag> {
  const c = client()
  if (!c) return { ok: false, status: 503, fout: 'niet-beschikbaar' }
  try {
    // Lage inspanning: dit is uitlezen en schatten, geen redeneerklus. Denken telt
    // mee in max_tokens, daarom ruim genoeg voor denken plus een lijst van 15 items.
    const bericht = await c.messages.create({
      model: aiModel(),
      max_tokens: 4000,
      output_config: { effort: 'low' },
      messages: [{ role: 'user', content: inhoud }],
    })
    if (bericht.stop_reason === 'refusal') return { ok: false, status: 422, fout: 'geweigerd' }
    const tekst = bericht.content.find((b) => b.type === 'text')?.text ?? ''
    const ruw = eersteJson(tekst)
    const respons = leesAiRespons(typeof ruw === 'object' && ruw !== null ? { ...(ruw as Record<string, unknown>), transcript } : null)
    return respons ? { ok: true, respons } : { ok: false, status: 422, fout: 'onleesbaar' }
  } catch (fout) {
    // Alleen het soort fout en de status, nooit de inhoud van het verzoek.
    const status = fout instanceof Anthropic.APIError ? fout.status : undefined
    console.error('[club/voeding/ai] model mislukt', fout instanceof Error ? fout.name : 'onbekend', status ?? '')
    return { ok: false, status: 502, fout: 'mislukt' }
  }
}

/** Wat de browser na het verkleinen stuurt (zie components/club/voeding/dagboek/verklein.ts). */
export const FOTO_TYPES = ['image/jpeg', 'image/webp', 'image/png'] as const
type FotoType = (typeof FOTO_TYPES)[number]

export function isFotoType(v: string): v is FotoType {
  return (FOTO_TYPES as readonly string[]).includes(v)
}

/** Een foto van een maaltijd naar losse items met een schatting. */
export async function analyseerFoto(data: ArrayBuffer, type: FotoType, taal: 'nl' | 'en'): Promise<AiUitslag> {
  const base64 = Buffer.from(data).toString('base64')
  const tekst = `Je bent een nuchtere voedingsdeskundige. Op de foto staat een maaltijd of een voedingsmiddel.\n${regels(taal)}\nIs de foto onduidelijk of zit er geen voedsel op, zet dan betrouwbaarheid op "laag" of geef geen items.`
  return vraag([{ type: 'image', source: { type: 'base64', media_type: type, data: base64 } }, { type: 'text', text: tekst }], '')
}

/** Een korte omschrijving ("2 boterhammen met kaas") naar items met een schatting. */
export async function schatOmschrijving(omschrijving: string, taal: 'nl' | 'en'): Promise<AiUitslag> {
  const tekst = `Je bent een nuchtere voedingsdeskundige. Hieronder staat wat iemand at.\n${regels(taal)}\nBij een vage omschrijving: neem een gangbare portie.\n\nMaaltijd: "${omschrijving.replace(/"/g, "'")}"`
  return vraag(tekst, omschrijving)
}
