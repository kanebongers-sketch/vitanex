// ─── LifeOS — POST /api/lifeos/vita/vraag ───────────────────────────────────
// De gespreks-route. Secundair: Vita's kern is de proactieve motor
// (`src/lib/lifeos/vita/signalen.ts`), niet dit endpoint. Dit is waar je hem iets
// vraagt als hij het niet al uit zichzelf gezegd had.
//
// ─── DE GESPLITSTE PROMPT-CACHE ─────────────────────────────────────────────
// De systeemprompt bestaat uit twee blokken, in deze volgorde:
//
//   1. VITA_PERSONA   — stabiel, mét cache_control  ← het breakpoint
//   2. het contextblok — volatiel, ZONDER cache_control
//
// Caching is een prefix-match. Zet je de volatiele dagcontext vóór het
// breakpoint, dan invalideert elke request de hele cache en betaal je de
// write-premie zonder ooit een read te halen. Andersom dus, altijd.
//
// ⚠️  NOG NIET GEVERIFIEERD DAT DE CACHE ÉCHT AANSLAAT. Een prefix moet een
// minimumlengte halen (orde 1–2k tokens) voordat hij überhaupt gecachet wordt;
// daaronder gebeurt er stil niets — geen foutmelding, gewoon geen cache.
// VITA_PERSONA is ~900 tokens en zit daar waarschijnlijk onder. De plaatsing
// hieronder is correct en kost niets, maar ga er niet vanuit dat er nu al
// gecachet wordt: meet het aan `usage.cache_read_input_tokens` (blijft die op 0
// over meerdere requests, dan slaat hij niet aan). Los dat op door de persona
// te laten groeien als hij inhoudelijk moet groeien — niet door hem op te
// vullen om een drempel te halen.
//
// De ANTHROPIC_API_KEY blijft hier — server-side. Nooit naar de browser.

import Anthropic from '@anthropic-ai/sdk'
import type { Stream } from '@anthropic-ai/sdk/streaming'
import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { bouwContextBlok } from '@/lib/lifeos/vita/context'
import { VITA_PERSONA } from '@/lib/lifeos/vita/persona'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Sonnet 5. `thinking` staat expliciet uit: zonder dat draait Sonnet 5 adaptief
 * thinking, en die tokens tellen mee in max_tokens — dan krijg je een antwoord
 * dat halverwege afgekapt is omdat het model eerst zat na te denken.
 *
 * Geen temperature of top_p: niet-default sampling-parameters geven op Sonnet 5
 * een 400. Sturen doen we via de persona.
 */
const MODEL = 'claude-sonnet-5'

/**
 * Bewust laag. Vita geeft één concreet advies, geen essay — en een plafond dat
 * hij nooit raakt is geen plafond. Loopt een antwoord hier tegenaan, dan is dat
 * een signaal dat de persona te weinig stuurt, niet dat dit getal omhoog moet.
 */
const MAX_TOKENS = 2000

/** Grenzen op de invoer. Valideren op de systeemgrens, falen met een duidelijke melding. */
const MAX_VRAAG_TEKENS = 4000
const MAX_GESCHIEDENIS = 20

type Rol = 'gebruiker' | 'vita'

interface Bericht {
  rol: Rol
  tekst: string
}

interface GeldigeInvoer {
  vraag: string
  geschiedenis: Bericht[]
}

function isBericht(v: unknown): v is Bericht {
  if (typeof v !== 'object' || v === null) return false
  const b = v as Record<string, unknown>
  return (
    (b.rol === 'gebruiker' || b.rol === 'vita') &&
    typeof b.tekst === 'string' &&
    b.tekst.length > 0 &&
    b.tekst.length <= MAX_VRAAG_TEKENS
  )
}

/** Valideert de body. Geeft een foutmelding terug i.p.v. te gokken wat bedoeld werd. */
function leesInvoer(body: unknown): GeldigeInvoer | string {
  if (typeof body !== 'object' || body === null) return 'Body moet een JSON-object zijn.'
  const { vraag, geschiedenis } = body as Record<string, unknown>

  if (typeof vraag !== 'string' || vraag.trim().length === 0) {
    return 'Geef een vraag mee.'
  }
  if (vraag.length > MAX_VRAAG_TEKENS) {
    return `Je vraag is te lang (max ${MAX_VRAAG_TEKENS} tekens).`
  }

  if (geschiedenis === undefined) return { vraag: vraag.trim(), geschiedenis: [] }
  if (!Array.isArray(geschiedenis)) return 'Geschiedenis moet een lijst zijn.'
  if (geschiedenis.length > MAX_GESCHIEDENIS) {
    return `Te veel berichten in de geschiedenis (max ${MAX_GESCHIEDENIS}).`
  }
  if (!geschiedenis.every(isBericht)) return 'Een bericht in de geschiedenis is ongeldig.'

  // Een gesprek begint bij de gebruiker; een leidend Vita-bericht wordt door de
  // API geweigerd. Liever hier stil opschonen dan de gebruiker een 400 geven
  // over een detail waar hij niets aan kan doen.
  const opgeschoond = [...geschiedenis]
  while (opgeschoond[0]?.rol === 'vita') opgeschoond.shift()

  return { vraag: vraag.trim(), geschiedenis: opgeschoond }
}

function naarBerichten(invoer: GeldigeInvoer): Anthropic.MessageParam[] {
  return [
    ...invoer.geschiedenis.map(
      (b): Anthropic.MessageParam => ({
        role: b.rol === 'vita' ? 'assistant' : 'user',
        content: b.tekst,
      }),
    ),
    { role: 'user', content: invoer.vraag },
  ]
}

// ─── Fouten ─────────────────────────────────────────────────────────────────

function fout(melding: string, status: number): Response {
  return Response.json({ fout: melding }, { status, headers: { 'Cache-Control': 'no-store' } })
}

/**
 * Zet een SDK-fout om in een antwoord. Nooit de interne melding doorgeven: die
 * kan de request-body, de key-id of het endpoint bevatten.
 */
function modelFout(oorzaak: unknown): Response {
  if (oorzaak instanceof Anthropic.RateLimitError) {
    return fout('Vita heeft even te veel te doen. Probeer het zo opnieuw.', 429)
  }
  if (oorzaak instanceof Anthropic.AuthenticationError) {
    // Onze sleutel deugt niet. Dat is onze fout, geen gebruikersfout.
    return fout('Vita is niet goed geconfigureerd. Dit ligt aan ons.', 502)
  }
  if (oorzaak instanceof Anthropic.APIError) {
    return fout('Vita kon niet antwoorden.', 502)
  }
  return fout('Er ging iets mis bij het antwoorden.', 500)
}

// ─── Stroom ─────────────────────────────────────────────────────────────────

const encoder = new TextEncoder()

/**
 * Zet de SDK-events om in platte tekst.
 *
 * Gaat het mid-stream mis, dan is de 200 al verstuurd en kan de status niet meer
 * veranderen. Dan schrijven we de fout zíchtbaar in de stroom: een half antwoord
 * dat er compleet uitziet is erger dan een zichtbare storing.
 */
function naarTekstStroom(
  gebeurtenissen: Stream<Anthropic.RawMessageStreamEvent>,
): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const gebeurtenis of gebeurtenissen) {
          if (
            gebeurtenis.type === 'content_block_delta' &&
            gebeurtenis.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(gebeurtenis.delta.text))
          }
        }
      } catch {
        controller.enqueue(
          encoder.encode('\n\n[Verbinding verbroken — dit antwoord is niet af.]'),
        )
      } finally {
        try {
          controller.close()
        } catch {
          // De consument had de stroom al afgebroken; sluiten kan dan niet meer.
          // Er is niets te herstellen en niets te melden.
        }
      }
    },
    cancel() {
      // Browser weg, tab dicht, gebruiker weggenavigeerd: breek ook de call naar
      // het model af. Anders staan we tokens te betalen voor een antwoord dat
      // niemand meer leest.
      gebeurtenissen.controller.abort()
    },
  })
}

// ─── Route ──────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<Response> {
  const toegang = await vereisLifeosToegang(request)
  if (toegang instanceof NextResponse) return toegang

  const sleutel = process.env.ANTHROPIC_API_KEY
  if (!sleutel) {
    // Expliciet, niet stil doorgaan met een client die toch faalt.
    return fout('Vita is niet geconfigureerd (ontbrekende sleutel).', 503)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return fout('Body is geen geldige JSON.', 400)
  }

  const invoer = leesInvoer(body)
  if (typeof invoer === 'string') return fout(invoer, 400)

  let contextBlok: string
  try {
    contextBlok = await bouwContextBlok(toegang.userId, toegang.admin)
  } catch {
    // Zonder context zou Vita op los zand antwoorden. Liever geen antwoord.
    return fout('Vita kon je gegevens niet ophalen.', 503)
  }

  try {
    const gebeurtenissen = await new Anthropic({ apiKey: sleutel }).messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      thinking: { type: 'disabled' },
      system: [
        // 1. Stabiel — hier ligt het cache-breakpoint.
        { type: 'text', text: VITA_PERSONA, cache_control: { type: 'ephemeral' } },
        // 2. Volatiel — bewust ná het breakpoint.
        { type: 'text', text: contextBlok },
      ],
      messages: naarBerichten(invoer),
      stream: true,
    })

    return new Response(naarTekstStroom(gebeurtenissen), {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        // Persoonlijke data: nooit in een gedeelde cache, en varieer op de
        // Authorization-header zodat de browsercache niets tussen sessies lekt.
        'Cache-Control': 'private, no-store',
        Vary: 'Authorization',
        // Zet proxy-buffering uit; anders komt het antwoord in één klap binnen
        // en heeft streamen geen zin.
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (oorzaak) {
    return modelFout(oorzaak)
  }
}
