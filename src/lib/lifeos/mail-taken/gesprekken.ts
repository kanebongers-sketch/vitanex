// ─── LifeOS — gesprekken die op jouw reactie wachten (SERVER-ONLY) ──────────
// Niet "ongelezen" maar "wacht op jou": je leest je mail op je telefoon, dus
// ongelezen zegt niets. Per gesprek in je inbox (laatste paar dagen) kijken we
// naar het LAATSTE bericht:
//   • van jou (SENT)            → jij bent aan zet geweest, niets te doen;
//   • niet meer in je inbox     → je archiveerde het: afgehandeld;
//   • van iemand anders, in je inbox → het wacht op jou → kandidaat-taak.
// Of het een echte vraag is, beslist daarna `classificeer` (geen nieuwsbrief,
// geen no-reply, aan jou gericht) en `regels.ts`.
//
// Net als de inbox-kaart: `format=METADATA` met een vaste headerlijst — LifeOS
// leest nooit de inhoud (zie de kop van `inbox/gmail.ts`).
//
// Docs (geverifieerd): users.messages.list, users.threads.get
//   https://developers.google.com/gmail/api/reference/rest/v1/users.threads/get

import { leesMailMeta, type Header } from '@/lib/lifeos/inbox/headers'
import type { MailMeta } from '@/lib/lifeos/inbox/classificeer'

const BERICHTEN = 'https://gmail.googleapis.com/gmail/v1/users/me/messages'
const THREADS = 'https://gmail.googleapis.com/gmail/v1/users/me/threads'
const TIMEOUT_MS = 10_000
const HEADERS = ['From', 'To', 'Subject', 'List-Unsubscribe', 'Precedence']
/** Hoe ver terug: lang genoeg voor een weekend, kort genoeg om oud nieuws te laten liggen. */
export const ZOEK = 'in:inbox newer_than:4d -category:promotions -category:social -category:forums'
const MAX_BERICHTEN = 150
/** Je inbox telt veel nieuwsbrieven; 30 was te krap (echte mails vielen buiten de selectie). */
const MAX_GESPREKKEN = 80
const BLOK = 10

function obj(v: unknown): Record<string, unknown> | null {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

/** Een gesprek dat op jou wacht: het laatste bericht, en of jij eerder in dit gesprek mailde. */
export interface Wachtend {
  mail: MailMeta
  /** Jij stuurde eerder al een bericht in dit gesprek: een echte correspondentie. */
  inGesprek: boolean
}

/**
 * Het threads.get-antwoord → het laatste bericht, alléén als het op jou wacht (van
 * een ander, nog in je inbox). Anders null. Puur en getest.
 */
export function wachtOpJou(ruw: unknown, mijnAdres: string): Wachtend | null {
  const thread = obj(ruw)
  const berichten = Array.isArray(thread?.messages) ? thread.messages : []
  const echt = berichten
    .map(obj)
    .filter((b): b is Record<string, unknown> => b !== null)
    .filter((b) => {
      const labels = Array.isArray(b.labelIds) ? b.labelIds : []
      return !labels.includes('DRAFT') && !labels.includes('SPAM') && !labels.includes('TRASH')
    })
    .sort((a, b) => Number(a.internalDate) - Number(b.internalDate))
  const laatste = echt[echt.length - 1]
  if (!laatste) return null

  const labels = (Array.isArray(laatste.labelIds) ? laatste.labelIds : []).filter((l): l is string => typeof l === 'string')
  if (labels.includes('SENT') || !labels.includes('INBOX')) return null

  const id = typeof laatste.id === 'string' ? laatste.id : null
  const threadId = typeof laatste.threadId === 'string' ? laatste.threadId : ''
  const ms = Number(laatste.internalDate)
  if (!id || !Number.isFinite(ms)) return null

  const payload = obj(laatste.payload)
  const headers: Header[] = (Array.isArray(payload?.headers) ? payload.headers : []).flatMap((h): Header[] => {
    const o = obj(h)
    return o && typeof o.name === 'string' && typeof o.value === 'string' ? [{ name: o.name, value: o.value }] : []
  })
  const inGesprek = echt.some((b) => Array.isArray(b.labelIds) && b.labelIds.includes('SENT'))
  return { mail: leesMailMeta(id, threadId, headers, labels, new Date(ms), mijnAdres), inGesprek }
}

async function haal(url: string, token: string): Promise<unknown> {
  const antwoord = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(TIMEOUT_MS), cache: 'no-store' })
  if (!antwoord.ok) throw new Error(`Gmail ${antwoord.status}`)
  return antwoord.json()
}

/** De gesprekken in je inbox waarvan het laatste bericht op jou wacht. Fout → null (dan deze ronde niets). */
export async function haalWachtendeGesprekken(token: string, mijnAdres: string): Promise<Wachtend[] | null> {
  try {
    const lijst = obj(await haal(`${BERICHTEN}?${new URLSearchParams({ q: ZOEK, maxResults: String(MAX_BERICHTEN) })}`, token))
    const berichten = Array.isArray(lijst?.messages) ? lijst.messages : []
    const threads = [...new Set(berichten.map((m) => obj(m)?.threadId).filter((t): t is string => typeof t === 'string'))].slice(0, MAX_GESPREKKEN)

    const params = new URLSearchParams({ format: 'METADATA' })
    for (const h of HEADERS) params.append('metadataHeaders', h)
    const uit: Wachtend[] = []
    for (let i = 0; i < threads.length; i += BLOK) {
      const blok = await Promise.all(
        threads.slice(i, i + BLOK).map((t) => haal(`${THREADS}/${encodeURIComponent(t)}?${params}`, token).catch(() => null)),
      )
      for (const ruw of blok) {
        const meta = ruw ? wachtOpJou(ruw, mijnAdres) : null
        if (meta) uit.push(meta)
      }
    }
    return uit
  } catch {
    return null
  }
}
