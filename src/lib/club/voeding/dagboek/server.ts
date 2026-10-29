// ─── Club, voedingsdagboek: gedeelde stukken voor de leden-API (SERVER-ONLY) ─
// De poort voor /api/club/lid/voeding: een lid uit de eigen sessie (of Kane in
// de voorvertoning, alleen lezen), het tabblad Voeding staat aan (module
// Training), en voor alles behalve starten: het lid heeft het dagboek gestart.
// Plus het ophalen bij Open Food Facts, met een korte cache en een rem.

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout } from '@/lib/club/toegang'
import { vereisLidToegang, type LidToegang } from '@/lib/club/ledenlogin/toegang'
import { isRateLimited } from '@/lib/utils/rate-limit'
import { haalInstellingen } from './opslag'
import { OFF_USER_AGENT, barcodeUrl, productUitBarcode, productenUitZoek, zoekUrl } from './off'
import type { DagboekInstellingen, Product } from './model'

export interface LidVoeding extends LidToegang {
  instellingen: DagboekInstellingen
}

/**
 * Lezen mag altijd (ook Kane); schrijven alleen het lid zelf. Met `gestart` moet het
 * dagboek gestart zijn (de toestemming van het lid), anders 409.
 */
export async function vereisLidVoeding(req: NextRequest, opties: { schrijft?: boolean; gestart?: boolean } = {}): Promise<LidVoeding | NextResponse> {
  const l = await vereisLidToegang(req, 'voeding')
  if (l instanceof NextResponse) return l
  if (opties.schrijft && l.voorvertoning) return clubFout('In de voorvertoning verandert er niets.', 403)
  const instellingen = await haalInstellingen(l.admin, l.userId, l.lid.id)
  if (!instellingen) return clubFout('Je dagboek kon niet worden geladen.', 500)
  if (opties.gestart && !instellingen.gestartOp) return clubFout('Start eerst je voedingsdagboek.', 409)
  return { ...l, instellingen }
}

/** Een rem per lid op de dure of externe verzoeken. */
export function teVaak(soort: string, lidId: string, max: number): boolean {
  return isRateLimited(`club-voeding-${soort}:${lidId}`, max, 60_000)
}

const CACHE_MS = 60 * 60 * 1000
const cache = new Map<string, { tot: number; waarde: unknown }>()

function uitCache(sleutel: string): unknown {
  const rij = cache.get(sleutel)
  if (!rij) return undefined
  if (rij.tot < Date.now()) {
    cache.delete(sleutel)
    return undefined
  }
  return rij.waarde
}

function inCache(sleutel: string, waarde: unknown): void {
  if (cache.size > 2000) cache.clear()
  cache.set(sleutel, { tot: Date.now() + CACHE_MS, waarde })
}

async function haalJson(url: string): Promise<{ ok: true; body: unknown } | { ok: false; status: number }> {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': OFF_USER_AGENT, Accept: 'application/json' }, signal: AbortSignal.timeout(8000), cache: 'no-store' })
    if (res.status === 404) return { ok: true, body: null }
    if (!res.ok) return { ok: false, status: res.status }
    return { ok: true, body: (await res.json()) as unknown }
  } catch {
    return { ok: false, status: 0 }
  }
}

export type OffUitslag<T> = { ok: true; waarde: T } | { ok: false }

/** Zoeken in Open Food Facts (een uur bewaard per term en taal, zodat we de dienst niet bestoken). */
export async function zoekOff(term: string, taal: 'nl' | 'en'): Promise<OffUitslag<Product[]>> {
  const sleutel = `zoek:${taal}:${term.toLowerCase()}`
  const bewaard = uitCache(sleutel)
  if (bewaard !== undefined) return { ok: true, waarde: bewaard as Product[] }
  const r = await haalJson(zoekUrl(term, taal))
  if (!r.ok) {
    console.error('[club/voeding] Open Food Facts zoeken mislukt', r.status)
    return { ok: false }
  }
  const producten = productenUitZoek(r.body, taal)
  inCache(sleutel, producten)
  return { ok: true, waarde: producten }
}

/** Een product op barcode; null = niet gevonden. */
export async function barcodeOff(code: string, taal: 'nl' | 'en'): Promise<OffUitslag<Product | null>> {
  const sleutel = `code:${taal}:${code}`
  const bewaard = uitCache(sleutel)
  if (bewaard !== undefined) return { ok: true, waarde: bewaard as Product | null }
  const r = await haalJson(barcodeUrl(code))
  if (!r.ok) {
    console.error('[club/voeding] Open Food Facts barcode mislukt', r.status)
    return { ok: false }
  }
  const product = productUitBarcode(r.body, taal)
  inCache(sleutel, product)
  return { ok: true, waarde: product }
}
