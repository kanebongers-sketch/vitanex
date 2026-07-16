// ─── LifeOS — spraak → tekst (transcriptie) ─────────────────────────────────
// De brug tussen een Telegram-spraakmemo en het intentiebrein: ruwe audio-bytes
// gaan erin, gesproken tekst komt eruit. Meer niet.
//
// INJECTEERBAAR met opzet. `Transcriber` is een interface, zodat de webhook en
// zijn tests er een nep-implementatie in kunnen schuiven en er in de test nooit
// een echte netwerkcall naar OpenAI gebeurt. `maakWhisperTranscriber()` levert de
// echte — precies het patroon van `IntentieModel` / `maakAnthropicModel`.
//
// ─── EERLIJKHEID / FOUT ≠ LEEG ──────────────────────────────────────────────
// Ontbreekt de API-sleutel, of geeft Whisper een fout, dan GOOIEN we. Een lege
// string teruggeven zou het intentiebrein "(leeg bericht)" laten classificeren en
// de gebruiker een vals "ik begreep je niet" sturen, terwijl het probleem bij ons
// ligt. Een echte transcriptie die leeg is (stilte) is wél een geldig antwoord.
//
// ─── GEHEIMHOUDING ──────────────────────────────────────────────────────────
// De gesproken inhoud wordt NOOIT gelogd. Een API-fouttekst van OpenAI is geen
// transcriptie en mag wel in de foutmelding — de audio zelf en het resultaat niet.

/** De audio-bytes plus wat Whisper nodig heeft om het formaat te herkennen. */
export interface AudioBestand {
  data: ArrayBuffer
  /** Bestandsnaam mét extensie (.oga); Whisper leidt het formaat uit de extensie af. */
  bestandsnaam: string
  mimeType: string
}

/** Injecteerbaar contract: één stuk audio in, gesproken tekst uit. */
export interface Transcriber {
  transcribeer(audio: AudioBestand): Promise<string>
}

const WHISPER_URL = 'https://api.openai.com/v1/audio/transcriptions'
const WHISPER_MODEL = 'whisper-1'

/** Narrowt het Whisper-antwoord. `text` mag leeg zijn (stilte), maar moet bestaan. */
function leesTranscriptie(body: unknown): string | null {
  if (typeof body !== 'object' || body === null) return null
  const tekst = (body as { text?: unknown }).text
  return typeof tekst === 'string' ? tekst : null
}

/**
 * De echte transcriber: OpenAI Whisper via een multipart-POST.
 *
 * De sleutel wordt pas bij de aanroep gelezen (niet bij het bouwen), zodat een
 * ontbrekende sleutel geen module-import sloopt maar een duidelijke fout geeft op
 * het moment dat je hem echt nodig hebt.
 */
export function maakWhisperTranscriber(): Transcriber {
  return {
    async transcribeer(audio: AudioBestand): Promise<string> {
      const sleutel = process.env.OPENAI_API_KEY
      if (!sleutel) {
        throw new Error(
          'OPENAI_API_KEY ontbreekt — kan spraak niet transcriberen. Zet hem in .env.local (zie .env.example).',
        )
      }

      const formulier = new FormData()
      formulier.append('model', WHISPER_MODEL)
      // Expliciet Nederlands: dit is een NL-systeem. Het scheelt fouten op namen
      // en werkwoorden die auto-detectie er soms naast zet.
      formulier.append('language', 'nl')
      formulier.append('file', new Blob([audio.data], { type: audio.mimeType }), audio.bestandsnaam)

      const antwoord = await fetch(WHISPER_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${sleutel}` },
        body: formulier,
      })

      if (!antwoord.ok) {
        // De fouttekst is OpenAI's API-fout (bv. "invalid file"), geen transcriptie.
        const detail = await antwoord.text().catch(() => '')
        throw new Error(`Transcriptie mislukte (HTTP ${antwoord.status}): ${detail.slice(0, 200)}`)
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
