// ─── Fit Factory Club: dubbele leden voorkomen (PUUR) ───────────────────────
// Voor een lead lid wordt: bestaat er in deze vestiging al iemand met hetzelfde
// e-mailadres of telefoonnummer? Dan waarschuwen we en kan de lead aan dat lid
// gekoppeld worden in plaats van een tweede kaart te maken.

export interface Contactgegevens {
  email: string | null
  telefoon: string | null
}

export interface DubbelKandidaat extends Contactgegevens {
  id: string
  voornaam: string
  achternaam: string
  status: string
}

export interface DubbelTreffer<T extends DubbelKandidaat = DubbelKandidaat> {
  lid: T
  op: ('email' | 'telefoon')[]
}

export function normaliseerEmail(email: string | null): string | null {
  const e = email?.trim().toLowerCase() ?? ''
  return e.includes('@') ? e : null
}

/** Alleen cijfers, Nederlandse varianten gelijk: +31 6, 0031 6 en 06 worden "06...". */
export function normaliseerTelefoon(telefoon: string | null): string | null {
  let cijfers = (telefoon ?? '').replace(/\D/g, '')
  if (cijfers.startsWith('0031')) cijfers = `0${cijfers.slice(4)}`
  else if (cijfers.startsWith('31') && cijfers.length === 11) cijfers = `0${cijfers.slice(2)}`
  return cijfers.length >= 8 ? cijfers : null
}

/** De leden met hetzelfde e-mailadres of telefoonnummer, met waarop ze overeenkomen. */
export function vindDubbelen<T extends DubbelKandidaat>(zoek: Contactgegevens, leden: readonly T[]): DubbelTreffer<T>[] {
  const email = normaliseerEmail(zoek.email)
  const tel = normaliseerTelefoon(zoek.telefoon)
  if (!email && !tel) return []
  const treffers: DubbelTreffer<T>[] = []
  for (const lid of leden) {
    const op: ('email' | 'telefoon')[] = []
    if (email && normaliseerEmail(lid.email) === email) op.push('email')
    if (tel && normaliseerTelefoon(lid.telefoon) === tel) op.push('telefoon')
    if (op.length > 0) treffers.push({ lid, op })
  }
  return treffers
}

/**
 * Een losse ilike-patroon voor de database-voorselectie op telefoon: de laatste
 * 9 cijfers met % ertussen, zodat "06 12 34 56 78" en "+31612345678" allebei
 * gevonden worden. De echte vergelijking doet vindDubbelen daarna.
 */
export function telefoonZoekpatroon(telefoon: string | null): string | null {
  const tel = normaliseerTelefoon(telefoon)
  if (!tel) return null
  return `%${tel.slice(-9).split('').join('%')}%`
}

function tekstOfNull(v: unknown): string | null {
  return typeof v === 'string' ? v : null
}

/** Systeemgrens in de browser: de dubbelen zoals de API ze teruggeeft. */
export function treffersUitJson(v: unknown): DubbelTreffer[] {
  if (!Array.isArray(v)) return []
  const uit: DubbelTreffer[] = []
  for (const item of v) {
    if (typeof item !== 'object' || item === null) continue
    const t = item as Record<string, unknown>
    const l = typeof t.lid === 'object' && t.lid !== null ? (t.lid as Record<string, unknown>) : null
    if (!l || typeof l.id !== 'string' || typeof l.voornaam !== 'string' || typeof l.achternaam !== 'string') continue
    const op = Array.isArray(t.op) ? t.op.filter((o): o is 'email' | 'telefoon' => o === 'email' || o === 'telefoon') : []
    const lid = { id: l.id, voornaam: l.voornaam, achternaam: l.achternaam, email: tekstOfNull(l.email), telefoon: tekstOfNull(l.telefoon), status: tekstOfNull(l.status) ?? 'actief' }
    uit.push({ lid, op })
  }
  return uit
}
