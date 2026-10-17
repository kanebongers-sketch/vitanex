// ─── Club: invoer van de bedrijfs-API controleren (PUUR) ────────────────────
// De pagina bewaart per tabblad: { soort: 'gegevens', ... } of
// { soort: 'teksten', huisregels, voorwaarden, privacy }. Alles is `unknown`
// tot het hier is gecontroleerd; foutteksten kunnen zo in de interface.

import { GEGEVENS_VELDEN, MAX_TEKST, SOCIALS, SOCIAL_LABEL, TEKSTEN, TEKST_LABEL, type Gegevens, type Teksten } from './model'
import {
  isEmail,
  isTekstTeLang,
  isTelefoon,
  normaliseerBtw,
  normaliseerKvk,
  normaliseerPostcode,
  normaliseerSocial,
  normaliseerTekst,
  normaliseerWebsite,
} from './validatie'

export type Uitkomst<T> = { ok: true; waarde: T } | { ok: false; fout: string; veld?: string }

export type BedrijfInvoer = { soort: 'gegevens'; gegevens: Gegevens } | { soort: 'teksten'; teksten: Teksten }

const goed = <T>(waarde: T): Uitkomst<T> => ({ ok: true, waarde })
const fout = <T>(tekst: string, veld?: string): Uitkomst<T> => ({ ok: false, fout: tekst, veld })

function obj(body: unknown): Record<string, unknown> | null {
  return typeof body === 'object' && body !== null && !Array.isArray(body) ? (body as Record<string, unknown>) : null
}

/** Leeg of ontbrekend = null; geen tekst = undefined (fout). */
function ruweTekst(v: unknown): string | null | undefined {
  if (v === undefined || v === null) return null
  if (typeof v !== 'string') return undefined
  const t = v.trim().replace(/\s+/g, ' ')
  return t === '' ? null : t
}

type Controle = { max: number; norm?: (w: string) => string | null; melding: string }

const CONTROLES: Record<(typeof GEGEVENS_VELDEN)[number], Controle> = {
  bedrijfsnaam: { max: 160, melding: 'De bedrijfsnaam is te lang (hooguit 160 tekens).' },
  kvk: { max: 20, norm: normaliseerKvk, melding: 'Een KvK-nummer heeft precies 8 cijfers.' },
  btw: { max: 24, norm: normaliseerBtw, melding: 'Dit btw-nummer klopt niet. Het ziet eruit als NL123456789B01.' },
  adres: { max: 160, melding: 'Het adres is te lang (hooguit 160 tekens).' },
  postcode: { max: 10, norm: normaliseerPostcode, melding: 'Een postcode ziet eruit als 1234 AB.' },
  plaats: { max: 80, melding: 'De plaatsnaam is te lang (hooguit 80 tekens).' },
  telefoon: { max: 40, norm: (w) => (isTelefoon(w) ? w : null), melding: 'Dit telefoonnummer klopt niet.' },
  email: { max: 160, norm: (w) => (isEmail(w) ? w.toLowerCase() : null), melding: 'Dit e-mailadres klopt niet.' },
  website: { max: 300, norm: normaliseerWebsite, melding: 'De website moet een https-adres zijn, bijvoorbeeld https://www.jouwsportschool.nl.' },
  ...(Object.fromEntries(
    SOCIALS.map((s) => [s, { max: 300, norm: (w: string) => normaliseerSocial(s, w), melding: `Vul een https-link naar je ${SOCIAL_LABEL[s]}-pagina in.` }]),
  ) as Record<(typeof SOCIALS)[number], Controle>),
}

export function leesGegevens(r: Record<string, unknown>): Uitkomst<Gegevens> {
  const uit: Partial<Record<keyof Gegevens, string | null>> = {}
  for (const veld of GEGEVENS_VELDEN) {
    const c = CONTROLES[veld]
    const w = ruweTekst(r[veld])
    if (w === undefined) return fout(c.melding, veld)
    if (w === null) {
      uit[veld] = null
      continue
    }
    if (w.length > c.max) return fout(c.melding, veld)
    const genormaliseerd = c.norm ? c.norm(w) : w
    if (genormaliseerd === null) return fout(c.melding, veld)
    uit[veld] = genormaliseerd
  }
  return goed(uit as Gegevens)
}

export function leesTeksten(r: Record<string, unknown>): Uitkomst<Teksten> {
  const uit: Partial<Teksten> = {}
  for (const soort of TEKSTEN) {
    const v = r[soort]
    if (v !== undefined && v !== null && typeof v !== 'string') return fout(`${TEKST_LABEL[soort]}: dit is geen tekst.`, soort)
    const tekst = normaliseerTekst(typeof v === 'string' ? v : '')
    if (isTekstTeLang(tekst)) return fout(`${TEKST_LABEL[soort]}: hooguit ${MAX_TEKST.toLocaleString('nl-NL')} tekens.`, soort)
    uit[soort] = tekst === '' ? null : tekst
  }
  return goed(uit as Teksten)
}

export function leesBedrijfInvoer(body: unknown): Uitkomst<BedrijfInvoer> {
  const r = obj(body)
  if (!r) return fout('Onleesbare invoer.')
  if (r.soort === 'gegevens') {
    const u = leesGegevens(r)
    return u.ok ? goed({ soort: 'gegevens', gegevens: u.waarde }) : u
  }
  if (r.soort === 'teksten') {
    const u = leesTeksten(r)
    return u.ok ? goed({ soort: 'teksten', teksten: u.waarde }) : u
  }
  return fout('Onbekend onderdeel om op te slaan.')
}
