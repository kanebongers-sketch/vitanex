// ─── Systeemoverzicht: rekenwerk voor /clubkane/systeem (PUUR) ──────────────

import type { FoutGebied, FoutSoort } from './fout'

export const GEBIED_LABEL: Record<FoutGebied, string> = {
  club: 'Club',
  leden: 'Ledenapp',
  aiyourgym: 'AI Your Gym',
}

export const SOORT_LABEL: Record<FoutSoort, string> = {
  render: 'Pagina',
  route: 'API',
  action: 'Actie',
  proxy: 'Proxy',
  handmatig: 'Afgevangen',
}

/** Opslag in het gratis Supabase-plan (500 MB per project). */
export const GRATIS_DB_BYTES = 500 * 1024 * 1024

export interface FoutRij {
  dag: string
  gebied: FoutGebied
  aantal: number
}

export interface DagTelling {
  dag: string
  totaal: number
  perGebied: Record<FoutGebied, number>
}

/** De datum (jjjj-mm-dd) van `dagen` geleden ten opzichte van `vandaag`. */
export function dagTerug(vandaag: string, dagen: number): string {
  const d = new Date(`${vandaag}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() - dagen)
  return d.toISOString().slice(0, 10)
}

/** Per dag het aantal fouten, van oud naar nieuw, ook dagen zonder fouten. */
export function foutenPerDag(rijen: readonly FoutRij[], vandaag: string, dagen: number): DagTelling[] {
  const lijst: DagTelling[] = Array.from({ length: dagen }, (_, i) => ({
    dag: dagTerug(vandaag, dagen - 1 - i),
    totaal: 0,
    perGebied: { club: 0, leden: 0, aiyourgym: 0 },
  }))
  const opDag = new Map(lijst.map((d) => [d.dag, d]))
  return rijen.reduce((acc, rij) => {
    const dag = opDag.get(rij.dag)
    if (!dag || !(rij.gebied in dag.perGebied)) return acc
    const nieuw: DagTelling = {
      ...dag,
      totaal: dag.totaal + rij.aantal,
      perGebied: { ...dag.perGebied, [rij.gebied]: dag.perGebied[rij.gebied] + rij.aantal },
    }
    opDag.set(rij.dag, nieuw)
    return acc.map((d) => (d.dag === rij.dag ? nieuw : d))
  }, lijst)
}

/** Bytes leesbaar: "32,2 MB". */
export function leesbareGrootte(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return 'Onbekend'
  const eenheden = ['B', 'kB', 'MB', 'GB']
  let waarde = bytes
  let i = 0
  while (waarde >= 1024 && i < eenheden.length - 1) {
    waarde /= 1024
    i += 1
  }
  const getal = i === 0 ? String(Math.round(waarde)) : waarde.toFixed(1).replace('.', ',')
  return `${getal} ${eenheden[i]}`
}

/** Deel van de gratis opslag dat in gebruik is, 0 tot 100 (afgerond). */
export function opslagProcent(bytes: number, limiet = GRATIS_DB_BYTES): number {
  if (!Number.isFinite(bytes) || bytes <= 0) return 0
  return Math.min(100, Math.round((bytes / limiet) * 100))
}
