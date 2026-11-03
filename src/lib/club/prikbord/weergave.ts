// ─── Club, Prikbord: wat het scherm toont (PUUR) ────────────────────────────
// Van de ruwe gegevens naar wat een persoon ziet: zijn eigen stand per
// mededeling, voor de leiding "x van y bevestigd", en per werkwijze de versie
// die hij bevestigde en (voor de leiding) de laatste uitvoeringen.

import { bevestigdeVersie, isLopend, isVervangen, isVoor, regelVan, telBevestigd, volgorde, werkwijzenVoor, type Bevestiging } from './model'
import type { Gelezen, Kijker, Mededeling, TeamPersoon, Uitvoering, Werkwijze } from './typen'

export interface MededelingWeergave {
  mededeling: Mededeling
  /** Naam van de schrijver; null = de leiding zonder profiel (het master account). */
  door: string | null
  /** Is hij voor mij (en kan ik hem lezen of bevestigen)? */
  voorMij: boolean
  gelezen: boolean
  bevestigd: boolean
  /** Moet ik er nog iets mee? */
  open: boolean
  /** Alleen voor wie mag plaatsen. */
  telling: Bevestiging | null
}

export interface UitvoeringWeergave {
  id: string
  door: string | null
  op: string
  vestiging: string
  klaar: number
  totaal: number
  notitie: string | null
}

export interface WerkwijzeWeergave {
  werkwijze: Werkwijze
  /** De hoogste versie die ik bevestigde, of null. */
  mijnVersie: number | null
  /** De laatste uitvoeringen (alleen voor wie mag plaatsen). */
  uitvoeringen: UitvoeringWeergave[]
}

export interface PrikbordInvoer {
  kijker: Kijker
  leiding: boolean
  mededelingen: readonly Mededeling[]
  gelezen: readonly Gelezen[]
  werkwijzen: readonly Werkwijze[]
  team: readonly TeamPersoon[]
  uitvoeringen: readonly Uitvoering[]
  nu: Date
}

export interface PrikbordWeergave {
  lopend: MededelingWeergave[]
  archief: MededelingWeergave[]
  werkwijzen: WerkwijzeWeergave[]
}

const MAX_UITVOERINGEN = 3

function naamVan(team: readonly TeamPersoon[], id: string | null): string | null {
  return id ? (team.find((p) => p.id === id)?.naam ?? null) : null
}

function mededelingWeergave(m: Mededeling, i: PrikbordInvoer): MededelingWeergave {
  const id = i.kijker.profielId
  const regel = id ? regelVan(i.gelezen, m.id, id) : undefined
  const voorMij = id !== null && m.doorProfiel !== id && isVoor(m, i.kijker) && !isVervangen(m, i.werkwijzen)
  const gelezen = regel !== undefined
  const bevestigd = regel?.bevestigdOp != null
  return {
    mededeling: m,
    door: naamVan(i.team, m.doorProfiel),
    voorMij,
    gelezen,
    bevestigd,
    open: voorMij && isLopend(m, i.nu) && (m.verplicht ? !bevestigd : !gelezen),
    telling: i.leiding ? telBevestigd(m, i.team, i.gelezen) : null,
  }
}

/** Het hele scherm voor deze persoon. De leiding ziet alles; de rest wat voor hem is. */
export function prikbordWeergave(i: PrikbordInvoer): PrikbordWeergave {
  const zichtbaar = i.mededelingen.filter((m) => i.leiding || (isVoor(m, i.kijker) && !isVervangen(m, i.werkwijzen)) || m.doorProfiel === i.kijker.profielId)
  const lopend = zichtbaar.filter((m) => isLopend(m, i.nu)).sort(volgorde).map((m) => mededelingWeergave(m, i))
  // Open eerst, daarna de rest in de vaste volgorde.
  const gesorteerd = [...lopend.filter((m) => m.open), ...lopend.filter((m) => !m.open)]
  const archief = i.leiding ? zichtbaar.filter((m) => !isLopend(m, i.nu)).slice(0, 30).map((m) => mededelingWeergave(m, i)) : []
  const id = i.kijker.profielId
  const werkwijzen = werkwijzenVoor(i.werkwijzen, i.kijker, i.leiding).map((w) => ({
    werkwijze: w,
    mijnVersie: id ? bevestigdeVersie(w.id, id, i.mededelingen, i.gelezen) : null,
    uitvoeringen: i.leiding
      ? i.uitvoeringen
          .filter((u) => u.werkwijzeId === w.id)
          .slice(0, MAX_UITVOERINGEN)
          .map((u) => ({ id: u.id, door: naamVan(i.team, u.profielId), op: u.afgerondOp ?? u.gestartOp, vestiging: u.vestiging, klaar: u.afgevinkt.length, totaal: w.stappen.length, notitie: u.notitie }))
      : [],
  }))
  return { lopend: gesorteerd, archief, werkwijzen }
}
