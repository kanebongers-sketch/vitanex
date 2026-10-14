// ─── Fit Factory Club: personeel en taken voor Vandaag (SERVER) ─────────────
// Alleen lezen, via de leesfuncties van personeel en taken, zodat Vandaag
// precies hetzelfde laat zien als die pagina's. Een leesfout geeft null en een
// melding; de rest van Vandaag blijft gewoon werken.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import { haalDiensten, haalTeam } from '@/lib/club/personeel/opslag'
import { alleenActief, haalAfsluitrondes, haalAfvinkingen, haalTaken } from '@/lib/club/taken/opslag'
import { takenVanVandaag } from '@/lib/club/taken/voortgang'
import { weekContext } from '@/lib/club/taken/week'
import { plusDagen } from './tijd'
import { dienstenVandaag, takenStand, type DienstVandaag, type TakenStand } from './werkvloer'

export interface Werkvloer {
  /** Null als het rooster niet te lezen was. */
  diensten: DienstVandaag[] | null
  /** Null als de taken niet te lezen waren. */
  taken: TakenStand | null
  /** False als de vestiging nog geen takenlijsten heeft. */
  heeftTaken: boolean
}

async function haalDienstenVandaag(admin: SupabaseClient, userId: string, v: Vestiging, vandaag: string, nuTijd: string): Promise<DienstVandaag[] | null> {
  const [team, diensten] = await Promise.all([haalTeam(admin, userId, v), haalDiensten(admin, userId, v, vandaag, plusDagen(vandaag, 1))])
  if (!team || !diensten) return null
  return dienstenVandaag(diensten, team, vandaag, nuTijd)
}

async function haalTakenStand(admin: SupabaseClient, userId: string, v: Vestiging, vandaag: string): Promise<{ stand: TakenStand | null; heeft: boolean }> {
  const week = weekContext(null, vandaag)
  const [data, vinkjes, rondes] = await Promise.all([
    haalTaken(admin, userId, v),
    haalAfvinkingen(admin, userId, v, week.maandag, week.zondag),
    haalAfsluitrondes(admin, userId, v, vandaag, vandaag),
  ])
  if (!data || !vinkjes || !rondes) return { stand: null, heeft: true }
  const actief = alleenActief(data)
  const items = takenVanVandaag(actief.taken, vinkjes, week.dagen, vandaag)
  return { stand: takenStand(items, rondes, vandaag), heeft: actief.taken.length > 0 }
}

export async function haalWerkvloer(admin: SupabaseClient, userId: string, v: Vestiging, vandaag: string, nuTijd: string): Promise<Werkvloer> {
  const [diensten, taken] = await Promise.all([haalDienstenVandaag(admin, userId, v, vandaag, nuTijd), haalTakenStand(admin, userId, v, vandaag)])
  return { diensten, taken: taken.stand, heeftTaken: taken.heeft }
}
