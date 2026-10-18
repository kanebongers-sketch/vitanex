// ─── Club ledenapp: het web-app-manifest per sportschool (PUUR) ─────────────
// Een lid zet /mijn met een tik op het beginscherm. Dan toont de telefoon de
// naam, het icoon en de kleuren van de eigen sportschool, niet die van ons.
// Geen sportschool bekend: een neutrale "Club" met de vaste reserve-iconen uit
// public/club-app/. Puur en zonder Next of env, zodat het te testen is.

import type { MetadataRoute } from 'next'
import { LEDENAPP_PAD, type LedenappMerk } from '@/lib/club/ledenlogin/contract'
import { HEX, THEMA_BASIS, huisstijlVariabelen } from '@/lib/club/kern/huisstijl'

/** Waar de route handlers staan (onder /api: daar herschrijft de subdomein-proxy niets). */
export const MANIFEST_PAD = '/api/club/ledenapp/manifest'
export const ICOON_PAD = '/api/club/ledenapp/icoon'
/** De vaste reserve-iconen (public/club-app/), ook voor de offline-pagina. */
export const RESERVE_PAD = '/club-app'

export const ICOON_SOORTEN = ['192', '512', 'maskable', 'apple'] as const
export type IcoonSoort = (typeof ICOON_SOORTEN)[number]

export interface IcoonMaat {
  px: number
  /** Maskable: alles binnen de veilige cirkel (80 procent), de rand mag wegvallen. */
  maskable: boolean
  reserveBestand: string
}

export const ICOON_MATEN: Record<IcoonSoort, IcoonMaat> = {
  '192': { px: 192, maskable: false, reserveBestand: 'icoon-192.png' },
  '512': { px: 512, maskable: false, reserveBestand: 'icoon-512.png' },
  maskable: { px: 512, maskable: true, reserveBestand: 'icoon-maskable-512.png' },
  apple: { px: 180, maskable: false, reserveBestand: 'apple-touch-icon.png' },
}

/** Systeemgrens: ?soort=... uit de URL, of null. */
export function leesIcoonSoort(ruw: unknown): IcoonSoort | null {
  return typeof ruw === 'string' && (ICOON_SOORTEN as readonly string[]).includes(ruw) ? (ruw as IcoonSoort) : null
}

/** Het neutrale merk als er geen sportschool bekend is. */
export const NEUTRAAL_NAAM = 'Club'
const NEUTRAAL_ACCENT = '#D9D6CF'

export interface MerkKleuren {
  /** Achtergrond van de app en de statusbalk (theme_color en background_color). */
  achtergrond: string
  /** Vlak van het icoon: het accent, bijgeschoven tot genoeg contrast (3:1). */
  accent: string
  /** Letter op het accent: zwart of wit, wat het best leesbaar is. */
  inkt: string
}

/** De kleuren uit de huisstijl, met dezelfde contrastcorrectie als heel Club. */
export function merkKleuren(merk: LedenappMerk | null): MerkKleuren {
  const thema = merk?.thema ?? 'donker'
  const keuze = merk && HEX.test(merk.kleurAccent) ? merk.kleurAccent : NEUTRAAL_ACCENT
  const vars = huisstijlVariabelen(keuze, thema)
  return { achtergrond: THEMA_BASIS[thema].bgApp, accent: vars['--brand'], inkt: vars['--brand-inkt'] }
}

/** De eerste letter of het eerste cijfer van de naam, in kapitaal; anders "C". */
export function eersteLetter(naam: string): string {
  const teken = naam
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .match(/[\p{L}\p{N}]/u)?.[0]
  return (teken ?? 'C').toUpperCase()
}

/** Korte naam onder het icoon: hele naam tot 12 tekens, anders het eerste woord (afgekapt). */
export function korteNaam(naam: string): string {
  const schoon = naam.trim().replace(/\s+/g, ' ')
  if (!schoon) return NEUTRAAL_NAAM
  if (schoon.length <= 12) return schoon
  return schoon.split(' ')[0].slice(0, 12)
}

/** Een korte vingerafdruk van wat het icoon bepaalt, zodat een nieuwe huisstijl een nieuwe URL krijgt. */
export function merkVersie(merk: LedenappMerk | null): string {
  if (!merk) return '0'
  const bron = [merk.organisatieId, merk.naam, merk.kleurAccent, merk.thema, merk.logoUrl ?? ''].join('|')
  let h = 5381
  for (let i = 0; i < bron.length; i++) h = ((h * 33) ^ bron.charCodeAt(i)) >>> 0
  return h.toString(36)
}

/** Het adres van een icoon: dynamisch per sportschool, of het vaste reserve-icoon. */
export function icoonUrl(merk: LedenappMerk | null, soort: IcoonSoort): string {
  if (!merk) return `${RESERVE_PAD}/${ICOON_MATEN[soort].reserveBestand}`
  return `${ICOON_PAD}?soort=${soort}&v=${merkVersie(merk)}`
}

export function manifestUrl(merk: LedenappMerk | null): string {
  return `${MANIFEST_PAD}?v=${merkVersie(merk)}`
}

/** Het manifest voor /mijn. */
export function ledenappManifest(merk: LedenappMerk | null): MetadataRoute.Manifest {
  const naam = merk?.naam.trim() || NEUTRAAL_NAAM
  const { achtergrond } = merkKleuren(merk)
  const icoon = (soort: IcoonSoort, purpose: 'any' | 'maskable') => {
    const px = ICOON_MATEN[soort].px
    return { src: icoonUrl(merk, soort), sizes: `${px}x${px}`, type: 'image/png', purpose }
  }
  return {
    id: LEDENAPP_PAD,
    name: naam,
    short_name: korteNaam(naam),
    description: merk ? `De app van ${naam}: lessen, afspraken, je schema en je voortgang.` : 'De app van je sportschool: lessen, afspraken, je schema en je voortgang.',
    lang: 'nl',
    dir: 'ltr',
    start_url: LEDENAPP_PAD,
    scope: LEDENAPP_PAD,
    display: 'standalone',
    orientation: 'portrait',
    background_color: achtergrond,
    theme_color: achtergrond,
    categories: ['health', 'fitness', 'lifestyle'],
    icons: [icoon('192', 'any'), icoon('512', 'any'), icoon('maskable', 'maskable')],
  }
}
