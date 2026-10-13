// Kleding-acties naar de founder-API (alleen Kane). Geeft een foutmelding terug of null.

import { haalJson, leesNiets } from '@/lib/lifeos/api/http'

export async function kledingActie(body: Record<string, unknown>): Promise<string | null> {
  const uit = await haalJson('/api/lifeos/pt-kleding', leesNiets, { method: 'POST', body: JSON.stringify(body) })
  return uit.ok ? null : uit.fout
}
