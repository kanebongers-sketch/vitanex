// ─── Club, ledenkaart: lidmaatschap starten, pauzeren en stoppen (PUUR) ─────
// Op het profiel past de balie het lidmaatschap van een lid aan: de vorm, de
// startdatum, een pauze met datums, opzeggen per datum of stoppen. Hier staat
// welke acties bij welke status horen en wat ze precies wijzigen, zodat de
// knoppen en de API hetzelfde doen. Geld en contracten staan hier niet in.

import type { LidStatus } from '@/lib/club/kern/lid'
import { vormSleutel, type Lidmaatschapsvorm } from '@/lib/club/lidmaatschappen/model'
import type { LidWijziging } from '../invoer'

export const LIDMAATSCHAP_ACTIES = ['activeren', 'pauzeren', 'hervatten', 'opzeggen', 'intrekken', 'stoppen'] as const
export type LidmaatschapActie = (typeof LIDMAATSCHAP_ACTIES)[number]

const PER_STATUS: Record<LidStatus, readonly LidmaatschapActie[]> = {
  proef: ['activeren', 'stoppen'],
  actief: ['pauzeren', 'opzeggen', 'stoppen'],
  gepauzeerd: ['hervatten', 'opzeggen', 'stoppen'],
  opgezegd: ['intrekken', 'stoppen'],
  gestopt: ['activeren'],
}

/** De acties die bij deze status passen, in vaste volgorde. */
export function actiesVoor(status: LidStatus): readonly LidmaatschapActie[] {
  return PER_STATUS[status]
}

/** Welke datum een actie vraagt (de knop toont dan een datumveld). */
export const ACTIE_DATUMS: Record<LidmaatschapActie, readonly ('van' | 'tot')[]> = {
  activeren: ['van'],
  pauzeren: ['van', 'tot'],
  hervatten: [],
  opzeggen: ['tot'],
  intrekken: [],
  stoppen: ['tot'],
}

export interface ActieDatums {
  /** yyyy-mm-dd: de startdatum (activeren) of het begin van de pauze. */
  van: string | null
  /** yyyy-mm-dd: het einde van de pauze, of de einddatum bij opzeggen en stoppen. */
  tot: string | null
}

/** Waarom een actie niet kan; de kaart toont de zin uit het woordenboek (nl en en). */
export type ActieFout = 'pauzeOmgekeerd' | 'opzeggenZonderDatum' | 'opzeggenVerleden'

export type ActieUitslag = { ok: true; wijziging: LidWijziging } | { ok: false; fout: ActieFout }

/**
 * Wat een actie wijzigt. Pauze zonder einddatum mag (open pauze); opzeggen
 * vraagt een einddatum vanaf vandaag; stoppen zonder datum stopt vandaag.
 */
export function wijzigingVoorActie(actie: LidmaatschapActie, datums: ActieDatums, vandaag: string, lidSinds: string | null): ActieUitslag {
  switch (actie) {
    case 'activeren':
      return { ok: true, wijziging: { status: 'actief', lidSinds: lidSinds ?? datums.van ?? vandaag, einddatum: null, pauzeVan: null, pauzeTot: null } }
    case 'pauzeren': {
      const van = datums.van ?? vandaag
      if (datums.tot && datums.tot < van) return { ok: false, fout: 'pauzeOmgekeerd' }
      return { ok: true, wijziging: { status: 'gepauzeerd', pauzeVan: van, pauzeTot: datums.tot } }
    }
    case 'hervatten':
      return { ok: true, wijziging: { status: 'actief', pauzeVan: null, pauzeTot: null } }
    case 'opzeggen':
      if (!datums.tot) return { ok: false, fout: 'opzeggenZonderDatum' }
      if (datums.tot < vandaag) return { ok: false, fout: 'opzeggenVerleden' }
      return { ok: true, wijziging: { status: 'opgezegd', einddatum: datums.tot, pauzeVan: null, pauzeTot: null } }
    case 'intrekken':
      return { ok: true, wijziging: { status: 'actief', einddatum: null } }
    case 'stoppen':
      return { ok: true, wijziging: { status: 'gestopt', einddatum: datums.tot ?? vandaag, pauzeVan: null, pauzeTot: null } }
  }
}

export type PauzeStand = 'geen' | 'gepland' | 'loopt' | 'voorbij'

/** Hoe staat de pauze ervoor? "Voorbij" = de einddatum is geweest maar het lid staat nog op gepauzeerd. */
export function pauzeStand(status: LidStatus, pauze: { van: string | null; tot: string | null }, vandaag: string): PauzeStand {
  if (status !== 'gepauzeerd') return 'geen'
  if (pauze.van && pauze.van > vandaag) return 'gepland'
  if (pauze.tot && pauze.tot < vandaag) return 'voorbij'
  return 'loopt'
}

/** De vorm van het lid op naam (zoals club_leden.abonnement die opslaat), of null. */
export function vormVanLid(vormen: readonly Lidmaatschapsvorm[], abonnement: string | null): Lidmaatschapsvorm | null {
  if (!abonnement) return null
  const sleutel = vormSleutel(abonnement)
  return vormen.find((v) => vormSleutel(v.naam) === sleutel) ?? null
}

export interface VormKeuze {
  naam: string
  actief: boolean
}

/**
 * De keuzelijst: alle vormen die te koop zijn, plus de huidige van het lid
 * (ook als die niet meer te koop is of niet als vorm bestaat), zodat de
 * keuzelijst nooit stil een andere vorm laat zien.
 */
export function vormKeuzes(vormen: readonly Lidmaatschapsvorm[], abonnement: string | null): VormKeuze[] {
  const huidig = vormVanLid(vormen, abonnement)
  const lijst = vormen.filter((v) => v.actief || v.id === huidig?.id).map((v) => ({ naam: v.naam, actief: v.actief }))
  return abonnement && !huidig ? [{ naam: abonnement, actief: false }, ...lijst] : lijst
}

/** Mag deze naam als vorm op het lid? Alleen een bestaande vorm, of de naam die het lid al heeft. */
export function vormToegestaan(vormen: readonly Lidmaatschapsvorm[], huidig: string | null, nieuw: string | null): boolean {
  if (nieuw === null) return true
  if (huidig && vormSleutel(huidig) === vormSleutel(nieuw)) return true
  return vormen.some((v) => v.actief && vormSleutel(v.naam) === vormSleutel(nieuw))
}
