// ─── AI Your Gym: profielfoto's van de voorbeeldmensen in de productbeelden (PUUR) ──
// Besluit Kane (29-10-2026): echte stockfoto's (Unsplash of Pexels, vrije licentie
// voor commercieel gebruik, geen AI-beelden) als verzonnen leden en coaches van
// Kernhal. Alleen als voorbeeld in de schermen, nooit als klant, review of team.
// Bron, fotograaf en licentie per foto: public/aiyourgym/avatars/BRONNEN.json.
// Bestanden: <voornaam>.webp (192 px) en <voornaam>@2x.webp (384 px), vierkant.

const MAP = '/aiyourgym/avatars'

/** Voornamen met een foto; de sleutel is ook de bestandsnaam. */
export const AVATAR_NAMEN = [
  'sanne',
  'ravi',
  'lotte',
  'noah',
  'daan',
  'iris',
  'sem',
  'fleur',
  'mo',
  'tim',
  'noor',
  'eva',
  'ruud',
  'jesse',
] as const

export type AvatarNaam = (typeof AVATAR_NAMEN)[number]

export interface AvatarFoto {
  src: string
  src2x: string
}

const MET_FOTO: ReadonlySet<string> = new Set(AVATAR_NAMEN)

/** De voornaam als sleutel: eerste woord, kleine letters, zonder accenten. */
export function voornaamSleutel(naam: string): string {
  const eerste = naam.trim().split(/\s+/)[0] ?? ''
  return eerste
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

/** De foto bij een naam, of null als er geen foto is (dan initialen). */
export function avatarVan(naam: string): AvatarFoto | null {
  const sleutel = voornaamSleutel(naam)
  if (!MET_FOTO.has(sleutel)) return null
  return { src: `${MAP}/${sleutel}.webp`, src2x: `${MAP}/${sleutel}@2x.webp` }
}

/** Twee initialen ("Sanne Bakker" wordt "SB", "Mo de Vries" wordt "MV"). */
export function initialenVan(naam: string): string {
  const delen = naam.trim().split(/\s+/).filter(Boolean)
  const eerste = delen[0]?.[0] ?? ''
  const laatste = delen.length > 1 ? (delen[delen.length - 1]?.[0] ?? '') : ''
  return (eerste + laatste).replace(/\W/g, '').toUpperCase()
}
