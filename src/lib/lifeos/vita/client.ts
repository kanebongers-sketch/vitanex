// ─── LifeOS — de browser praat met Vita ─────────────────────────────────────
// BROWSER-ONLY. Alle fetch-calls naar `/api/lifeos/vita/*` staan hier; de
// componenten doen rendering en staat. Dat is de container/presentational-split
// uit `architecture.md`, maar er is ook een concrete reden: het ophalen van het
// token stond in drie componenten los overgeschreven, en zoiets loopt uit elkaar
// zodra er één verandert.
//
// ─── WAAROM HET TOKEN ER EXPLICIET BIJ MOET ─────────────────────────────────
// `/api/lifeos/vita/*` verifieert het JWT lokaal uit de Authorization-header (zie
// `lib/auth/api-auth`); er is geen cookie-sessie. De browser-client ververst het
// token zelf — wij lezen het alleen.

import { supabase } from '@/lib/supabase/supabase'
import { laatsteBerichten, leesFout, type Bericht } from './gesprek'
import type { GeheugenRegel, GeheugenSoort } from './geheugen'

/** Het access-token van de huidige sessie, of `null` als je niet ingelogd bent. */
export async function haalToken(): Promise<string | null> {
  const { data, error } = await supabase.auth.getSession()
  if (error) return null
  return data.session?.access_token ?? null
}

/**
 * Eén afloop-type voor de schrijfkant: gelukt, of een Nederlandse zin waarom niet.
 * Geen exceptions naar de componenten — die moeten renderen, niet vangen.
 */
export type Afloop = { ok: true } | { ok: false; melding: string }

// ─── Het gesprek ────────────────────────────────────────────────────────────

/**
 * Stelt de vraag en voert de stroom stukje bij beetje aan `opDelta`.
 *
 * Geeft `null` bij succes en anders een Nederlandse foutzin — één afloop, één plek
 * waar hij bepaald wordt.
 */
export async function vraagVita(
  vraag: string,
  geschiedenis: readonly Bericht[],
  signaal: AbortSignal,
  opDelta: (tekst: string) => void,
): Promise<string | null> {
  const token = await haalToken()
  if (!token) return 'Je bent niet ingelogd.'

  const respons = await fetch('/api/lifeos/vita/vraag', {
    method: 'POST',
    signal: signaal,
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    // Niet het hele gesprek: elk bericht is invoertokens die je per vraag opnieuw
    // betaalt, en de server weigert een te lange geschiedenis toch.
    body: JSON.stringify({ vraag, geschiedenis: laatsteBerichten(geschiedenis) }),
  })

  if (!respons.ok) return leesFout(respons)
  if (!respons.body) return 'Vita gaf een leeg antwoord.'

  const lezer = respons.body.getReader()
  // `stream: true` is hier geen detail: een chunk kan middenin een meerbyte-teken
  // eindigen. Zonder dit krijg je "energie" met een kapotte ë erin.
  const decoder = new TextDecoder()
  for (;;) {
    const { done, value } = await lezer.read()
    if (done) break
    opDelta(decoder.decode(value, { stream: true }))
  }
  const staart = decoder.decode()
  if (staart.length > 0) opDelta(staart)
  return null
}

// ─── Het geheugen ───────────────────────────────────────────────────────────

function isLijst(v: unknown): v is { geheugen: GeheugenRegel[] } {
  return typeof v === 'object' && v !== null && Array.isArray((v as { geheugen?: unknown }).geheugen)
}

function isRegel(v: unknown): v is { geheugen: GeheugenRegel } {
  const g = (v as { geheugen?: unknown } | null)?.geheugen
  return typeof g === 'object' && g !== null && typeof (g as GeheugenRegel).id === 'string'
}

/**
 * Wat Vita onthoudt.
 *
 * `ok:false` is een storing, NOOIT een lege lijst: zou een netwerkfout als `[]`
 * renderen, dan vertelt hij je dat Vita niets over je weet.
 */
export async function haalGeheugen(
  signaal: AbortSignal,
): Promise<{ ok: true; regels: GeheugenRegel[] } | { ok: false; melding: string }> {
  try {
    const token = await haalToken()
    if (!token) return { ok: false, melding: 'Je bent niet ingelogd.' }

    const respons = await fetch('/api/lifeos/vita/geheugen', {
      signal: signaal,
      cache: 'no-store',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!respons.ok) return { ok: false, melding: await leesFout(respons) }

    const data: unknown = await respons.json()
    if (!isLijst(data)) return { ok: false, melding: 'Vita gaf een onverwacht antwoord.' }
    return { ok: true, regels: data.geheugen }
  } catch {
    return { ok: false, melding: 'Ik kan er even niet bij.' }
  }
}

/** Legt één feit vast. `bron` zet de server — de client mag die niet kiezen. */
export async function bewaarGeheugen(
  soort: GeheugenSoort,
  inhoud: string,
): Promise<{ ok: true; regel: GeheugenRegel } | { ok: false; melding: string }> {
  try {
    const token = await haalToken()
    if (!token) return { ok: false, melding: 'Je bent niet ingelogd.' }

    const respons = await fetch('/api/lifeos/vita/geheugen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ soort, inhoud }),
    })
    if (!respons.ok) return { ok: false, melding: await leesFout(respons) }

    const data: unknown = await respons.json()
    if (!isRegel(data)) {
      return { ok: false, melding: 'Opgeslagen, maar ik kreeg het niet terug. Ververs even.' }
    }
    return { ok: true, regel: data.geheugen }
  } catch {
    return { ok: false, melding: 'Ik kon het niet opslaan.' }
  }
}

export async function wisGeheugen(id: string): Promise<Afloop> {
  try {
    const token = await haalToken()
    if (!token) return { ok: false, melding: 'Je bent niet ingelogd.' }

    const respons = await fetch(`/api/lifeos/vita/geheugen?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!respons.ok) return { ok: false, melding: await leesFout(respons) }
    return { ok: true }
  } catch {
    return { ok: false, melding: 'Ik kon het niet wissen.' }
  }
}
