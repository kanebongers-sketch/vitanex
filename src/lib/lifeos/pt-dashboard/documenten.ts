// ─── PT-app — documentenbibliotheek (PUUR) ──────────────────────────────────
// Kane deelt de Fit Factory PT-documenten (protocol, intake, abonnementen, Fit
// Guide, PT Academy, handleiding) met zijn PT'ers. De bestanden staan in de
// PRIVÉ bucket `pt-documenten`, de metadata in `pt_documenten` (migratie 355).
// De repo is openbaar: hier staan alleen namen-patronen en regels, nooit inhoud.
//
// Dit bestand is puur (geen netwerk, geen Supabase): soorten, grenzen en
// regels voor paden en namen. Het voorstel bij een bestandsnaam staat in
// `documenten-suggestie.ts`, de lezers van de systeemgrens in `documenten-lezers.ts`.

export const CATEGORIEEN = ['protocollen', 'klant', 'academy', 'handleiding', 'overig'] as const
export type DocCategorie = (typeof CATEGORIEEN)[number]

export const CATEGORIE_LABEL: Record<DocCategorie, string> = {
  protocollen: 'Protocollen',
  klant: 'Voor klanten',
  academy: 'PT Academy',
  handleiding: 'Handleiding',
  overig: 'Overig',
}

/** Supabase' standaard uploadgrens is ook 50 MB; groter heeft geen zin. */
export const MAX_GROOTTE = 50 * 1024 * 1024
export const TITEL_MAX = 140
export const BESCHRIJVING_MAX = 400
export const VOLGORDE_MAX = 9999
/** Een signed URL leeft 5 minuten: lang genoeg om te openen, te kort om door te sturen. */
export const SIGNED_URL_SECONDEN = 300

export interface DocSoort {
  extensie: string
  mime: string
  /** Wat de PT'er op de badge ziet. */
  label: string
  /** Mag de browser/iOS het direct tonen (inline), of als bestand met naam? */
  inline: boolean
}

const SOORTEN: readonly DocSoort[] = [
  { extensie: 'pdf', mime: 'application/pdf', label: 'PDF', inline: true },
  { extensie: 'docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', label: 'Word', inline: false },
  { extensie: 'pptx', mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', label: 'PowerPoint', inline: false },
  { extensie: 'xlsx', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', label: 'Excel', inline: false },
  { extensie: 'png', mime: 'image/png', label: 'Afbeelding', inline: true },
  { extensie: 'jpg', mime: 'image/jpeg', label: 'Afbeelding', inline: true },
]

/** Voor het `accept`-attribuut van de bestandskiezer. */
export const ACCEPT = [...SOORTEN.map((s) => `.${s.extensie}`), '.jpeg', ...SOORTEN.map((s) => s.mime)].join(',')

/** De extensie (kleine letters, `jpeg` → `jpg`), of null. */
export function extensieVan(bestandsnaam: string): string | null {
  const m = /\.([a-z0-9]{2,5})$/i.exec(bestandsnaam.trim())
  if (!m) return null
  const ext = m[1].toLowerCase()
  return ext === 'jpeg' ? 'jpg' : ext
}

/**
 * De soort bij een bestandsnaam. Bewust op de extensie, niet op `File.type`:
 * die is per besturingssysteem anders (en voor .docx soms leeg). De server leidt
 * de mime zelf af — wat de browser zegt, wordt niet vertrouwd.
 */
export function soortVanBestand(bestandsnaam: string): DocSoort | null {
  const ext = extensieVan(bestandsnaam)
  return SOORTEN.find((s) => s.extensie === ext) ?? null
}

export function soortVanMime(mime: string): DocSoort | null {
  return SOORTEN.find((s) => s.mime === mime) ?? null
}

/** "812 B", "34 kB", "2,4 MB" — Nederlandse notatie. */
export function leesbareGrootte(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '–'
  if (bytes < 1024) return `${Math.round(bytes)} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} kB`
  const mb = bytes / (1024 * 1024)
  return `${mb.toLocaleString('nl-NL', { maximumFractionDigits: mb < 10 ? 1 : 0 })} MB`
}

/** Kleine letters, geen accenten, alleen a-z0-9 en streepjes; max 60 tekens. */
export function slug(tekst: string): string {
  const s = tekst
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '')
  return s || 'document'
}

/** Het pad in de bucket: `<slug>-<uniek>.<ext>`. `uniek` = 8 tekens a-z0-9 (van de server). */
export function veiligPad(bestandsnaam: string, uniek: string): string | null {
  const soort = soortVanBestand(bestandsnaam)
  if (!soort || !/^[a-z0-9]{8}$/.test(uniek)) return null
  return `${slug(bestandsnaam.replace(/\.[^.]+$/, ''))}-${uniek}.${soort.extensie}`
}

const PAD_PATROON = /^[a-z0-9]+(?:-[a-z0-9]+)*-[a-z0-9]{8}\.(pdf|docx|pptx|xlsx|png|jpg)$/

/** Is dit een pad zoals `veiligPad` het maakt? (De metadata-route vertrouwt niets anders.) */
export function isVeiligPad(pad: string): boolean {
  return pad.length <= 120 && PAD_PATROON.test(pad)
}

/** Een nette bestandsnaam voor de download, bv. "PT Academy Dag 1.pptx". */
export function downloadNaam(titel: string, mime: string): string {
  const ext = soortVanMime(mime)?.extensie ?? 'bin'
  const basis = titel
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9 ._()-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80)
  return `${basis || 'document'}.${ext}`
}

/** Waarom dit bestand niet kan, of null als het mag. */
export function bestandsFout(bestandsnaam: string, grootte: number): string | null {
  if (!soortVanBestand(bestandsnaam)) return 'Dit bestandstype kan niet. Kies PDF, Word, PowerPoint, Excel of een afbeelding (PNG/JPG).'
  if (!Number.isFinite(grootte) || grootte <= 0) return 'Dit bestand is leeg.'
  if (grootte > MAX_GROOTTE) return `Te groot (${leesbareGrootte(grootte)}). Maximaal 50 MB.`
  return null
}
