// ─── LifeOS — spraak → tekst (transcriptie) ─────────────────────────────────
// De brug tussen een Telegram-spraakmemo en het intentiebrein: ruwe audio-bytes
// gaan erin, gesproken tekst komt eruit. Meer niet.
//
// INJECTEERBAAR met opzet. `Transcriber` is een interface, zodat de webhook en
// zijn tests er een nep-implementatie in kunnen schuiven en er in de test nooit
// een echte netwerkcall gebeurt. `maakWhisperTranscriber()` levert de echte —
// precies het patroon van `IntentieModel` / `maakAnthropicModel`.
//
// ─── TWEE PROVIDERS, ÉÉN CONTRACT ───────────────────────────────────────────
// Transcriptie (spraak→tekst) is niets dat Anthropic aanbiedt, dus hiervoor is één
// externe dienst nodig. We steunen op Whisper, maar niet op één leverancier:
//   1. GROQ (voorkeur) — `whisper-large-v3`, gratis tier, snel en accuraat.
//   2. OpenAI (terugval) — `whisper-1`.
// Beide zijn een OpenAI-compatibele multipart-POST; alleen de URL, het model en de
// sleutel verschillen. Staat er een GROQ_API_KEY, dan wint Groq (gratis); anders
// OpenAI. Zo werkt voice zodra Kane ÓFWEL een gratis Groq-key zet ÓFWEL credits op
// OpenAI — zonder codewijziging om te wisselen. Geen van beide sleutel → een
// duidelijke fout die zegt wat te doen.
//
// ─── EERLIJKHEID / FOUT ≠ LEEG ──────────────────────────────────────────────
// Ontbreekt de sleutel, of geeft de dienst een fout, dan GOOIEN we. Een lege
// string teruggeven zou het intentiebrein "(leeg bericht)" laten classificeren en
// de gebruiker een vals "ik begreep je niet" sturen, terwijl het probleem bij ons
// ligt. Een echte transcriptie die leeg is (stilte) is wél een geldig antwoord.
//
// ─── GEHEIMHOUDING ──────────────────────────────────────────────────────────
// De gesproken inhoud wordt NOOIT gelogd. Een API-fouttekst (bv. "check your
// billing") is geen transcriptie en mag wel in de foutmelding — de audio zelf en
// het resultaat niet.

/** De audio-bytes plus wat Whisper nodig heeft om het formaat te herkennen. */
export interface AudioBestand {
  data: ArrayBuffer
  /** Bestandsnaam mét extensie (.oga); de dienst leidt het formaat uit de extensie af. */
  bestandsnaam: string
  mimeType: string
}

/** Injecteerbaar contract: één stuk audio in, gesproken tekst uit. */
export interface Transcriber {
  transcribeer(audio: AudioBestand): Promise<string>
}

/** Een gekozen Whisper-leverancier: alles wat één multipart-POST nodig heeft. */
interface WhisperKeuze {
  naam: string
  url: string
  model: string
  sleutel: string
}

const GROQ_URL = 'https://api.groq.com/openai/v1/audio/transcriptions'
const GROQ_MODEL = 'whisper-large-v3'
const OPENAI_URL = 'https://api.openai.com/v1/audio/transcriptions'
const OPENAI_MODEL = 'whisper-1'

/**
 * Kiest de leverancier op basis van welke sleutel er staat. Groq wint (gratis);
 * OpenAI is de terugval. De sleutel wordt pas hier (bij de aanroep) gelezen, niet
 * bij het bouwen — zo sloopt een ontbrekende sleutel geen module-import maar geeft
 * hij een duidelijke fout op het moment dat je 'm echt nodig hebt.
 */
function kiesLeverancier(): WhisperKeuze | null {
  const groq = process.env.GROQ_API_KEY
  if (groq) return { naam: 'Groq', url: GROQ_URL, model: GROQ_MODEL, sleutel: groq }

  const openai = process.env.OPENAI_API_KEY
  if (openai) return { naam: 'OpenAI', url: OPENAI_URL, model: OPENAI_MODEL, sleutel: openai }

  return null
}

/**
 * Telegram-spraak is Ogg/Opus in een `.oga`-container. OpenAI accepteert `.oga`,
 * maar niet elke dienst doet dat; `.ogg` (dezelfde container) wordt overal
 * geaccepteerd. We normaliseren de naam die we uploaden daarom naar `.ogg`, zodat
 * de leverancier-keuze niet aan een extensie-detail hangt.
 */
function uploadNaam(bestandsnaam: string): string {
  return bestandsnaam.replace(/\.oga$/i, '.ogg')
}

/** Narrowt het antwoord. `text` mag leeg zijn (stilte), maar moet bestaan. */
function leesTranscriptie(body: unknown): string | null {
  if (typeof body !== 'object' || body === null) return null
  const tekst = (body as { text?: unknown }).text
  return typeof tekst === 'string' ? tekst : null
}

/**
 * De echte transcriber: Whisper via een multipart-POST (Groq of OpenAI).
 */
export function maakWhisperTranscriber(): Transcriber {
  return {
    async transcribeer(audio: AudioBestand): Promise<string> {
      const keuze = kiesLeverancier()
      if (!keuze) {
        throw new Error(
          'Geen transcriptie-sleutel — kan spraak niet omzetten. Zet GROQ_API_KEY (gratis, ' +
            'aanbevolen) of OPENAI_API_KEY in de omgeving.',
        )
      }

      const formulier = new FormData()
      formulier.append('model', keuze.model)
      // Expliciet Nederlands: dit is een NL-systeem. Het scheelt fouten op namen
      // en werkwoorden die auto-detectie er soms naast zet.
      formulier.append('language', 'nl')
      formulier.append(
        'file',
        new Blob([audio.data], { type: audio.mimeType }),
        uploadNaam(audio.bestandsnaam),
      )

      let antwoord: Response
      try {
        antwoord = await fetch(keuze.url, {
          method: 'POST',
          headers: { Authorization: `Bearer ${keuze.sleutel}` },
          body: formulier,
        })
      } catch {
        throw new Error(`Transcriptie via ${keuze.naam} onbereikbaar (netwerkfout).`)
      }

      if (!antwoord.ok) {
        // De fouttekst is de API-fout van de dienst (bv. "check your billing"),
        // geen transcriptie. Het leverancier-label maakt een 429 meteen leesbaar.
        const detail = await antwoord.text().catch(() => '')
        throw new Error(`Transcriptie mislukte via ${keuze.naam} (HTTP ${antwoord.status}): ${detail.slice(0, 200)}`)
      }

      const body: unknown = await antwoord.json().catch(() => null)
      const tekst = leesTranscriptie(body)
      if (tekst === null) {
        throw new Error('Transcriptie leverde geen bruikbaar antwoord op (geen tekst-veld).')
      }
      return tekst
    },
  }
}
