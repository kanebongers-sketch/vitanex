// ─── Club: bestaat deze slug? Voor de proxy (SERVER) ────────────────────────
// aiyourgym.com/<slug> is alleen een sportschool als de slug in
// club_organisaties staat; anders de 404 van de website. De proxy vraagt het
// met een kale REST-aanroep (service-role, zoals de widget) en bewaart het
// antwoord een minuut in het geheugen, ook "bestaat niet". Lukt het lezen
// niet, dan "bestaat niet" voor dit verzoek (liever een 404 dan een verkeerde omgeving).

const BEWAAR_MS = 60_000
const MAX_BEWAARD = 1000
const bewaard = new Map<string, { bestaat: boolean; tot: number }>()

/** true of false, of null als het lezen mislukte (dat wordt niet bewaard). */
async function leesBestaat(slug: string): Promise<boolean | null> {
  const url = process.env.LIFEOS_SUPABASE_URL
  const key = process.env.LIFEOS_SERVICE_ROLE_KEY
  if (!url || !key) return false
  try {
    const zoek = new URLSearchParams({ select: 'id', slug: `eq.${slug}`, limit: '1' })
    const res = await fetch(`${url.replace(/\/+$/, '')}/rest/v1/club_organisaties?${zoek}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(2500),
    })
    if (!res.ok) {
      console.error('[club/adres] slug lezen mislukt', res.status)
      return null
    }
    const rijen: unknown = await res.json()
    return Array.isArray(rijen) && rijen.length > 0
  } catch (fout) {
    console.error('[club/adres] slug lezen mislukt', fout instanceof Error ? fout.message : 'onbekend')
    return null
  }
}

/** Staat deze (al geldige) slug bij een sportschool? */
export async function slugBestaat(slug: string): Promise<boolean> {
  const nu = Date.now()
  const hit = bewaard.get(slug)
  if (hit && hit.tot > nu) return hit.bestaat
  const bestaat = await leesBestaat(slug)
  if (bestaat === null) return false
  if (bewaard.size >= MAX_BEWAARD) bewaard.clear()
  bewaard.set(slug, { bestaat, tot: nu + BEWAAR_MS })
  return bestaat
}
