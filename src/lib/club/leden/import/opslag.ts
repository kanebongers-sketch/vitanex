// ─── Fit Factory Club: ledenbestand opslaan (SERVER-ONLY) ───────────────────
// Leest de bestaande leden, maakt het plan en voert het uit: nieuwe leden in
// blokken toevoegen, bestaande leden per stuk bijwerken. Een mislukt blok wordt
// per rij opnieuw geprobeerd, zodat een foute rij de rest niet tegenhoudt.

import type { SupabaseClient } from '@supabase/supabase-js'
import { LID_KOLOMMEN, lidUitRij, type Lid } from '@/lib/club/kern/lid'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import { alleRijen } from '@/lib/club/leden/data'
import { lidKolommen, maakPlan, type ImportPlan, type ImportRegel } from './plan'

const BLOK_INVOEGEN = 200
const TEGELIJK_BIJWERKEN = 20

export interface Uitvoering {
  toegevoegd: number
  bijgewerkt: number
  mislukt: { regel: number; naam: string }[]
}

/** Alle leden van alle vestigingen (voor het Sportivity-ID), of null bij een fout. */
export async function haalAlleLeden(admin: SupabaseClient, userId: string): Promise<Lid[] | null> {
  const rijen = await alleRijen('leden voor import', (van, tot) =>
    admin.from('club_leden').select(LID_KOLOMMEN).eq('user_id', userId).order('id').range(van, tot),
  )
  return rijen ? rijen.map(lidUitRij).filter((l): l is Lid => l !== null) : null
}

export async function planImport(admin: SupabaseClient, userId: string, regels: readonly ImportRegel[], vestiging: Vestiging): Promise<ImportPlan | null> {
  const leden = await haalAlleLeden(admin, userId)
  return leden ? maakPlan(regels, leden, vestiging) : null
}

interface NieuweRegel extends ImportRegel {
  zonderSportivityId: boolean
}

function nieuweRij(userId: string, vestiging: Vestiging, r: NieuweRegel) {
  const kolommen = { ...lidKolommen(r.lid), status: r.lid.status, user_id: userId, vestiging, demo: false }
  return r.zonderSportivityId ? { ...kolommen, sportivity_id: null } : kolommen
}

async function voegToe(admin: SupabaseClient, userId: string, vestiging: Vestiging, nieuw: NieuweRegel[], uit: Uitvoering): Promise<void> {
  for (let i = 0; i < nieuw.length; i += BLOK_INVOEGEN) {
    const blok = nieuw.slice(i, i + BLOK_INVOEGEN)
    const { error } = await admin.from('club_leden').insert(blok.map((r) => nieuweRij(userId, vestiging, r)))
    if (!error) {
      uit.toegevoegd += blok.length
      continue
    }
    console.error('[club] import: blok toevoegen mislukt, per rij opnieuw', error.message)
    for (const r of blok) {
      const los = await admin.from('club_leden').insert(nieuweRij(userId, vestiging, r))
      if (los.error) uit.mislukt.push({ regel: r.regel, naam: `${r.lid.voornaam} ${r.lid.achternaam}` })
      else uit.toegevoegd++
    }
  }
}

async function werkBij(admin: SupabaseClient, userId: string, plan: ImportPlan, uit: Uitvoering): Promise<void> {
  const taken = plan.rijen.filter((r) => r.actie === 'bijwerken' && r.lidId)
  const nu = new Date().toISOString()
  for (let i = 0; i < taken.length; i += TEGELIJK_BIJWERKEN) {
    const blok = taken.slice(i, i + TEGELIJK_BIJWERKEN)
    const uitslagen = await Promise.all(
      blok.map((r) => admin.from('club_leden').update({ ...r.wijziging, bijgewerkt_op: nu }).eq('user_id', userId).eq('id', r.lidId!).eq('demo', false)),
    )
    uitslagen.forEach((u, j) => {
      if (u.error) {
        console.error('[club] import: lid bijwerken mislukt', u.error.message)
        uit.mislukt.push({ regel: blok[j].regel, naam: blok[j].naam })
      } else uit.bijgewerkt++
    })
  }
}

/** Voert het plan uit. De regels moeten dezelfde zijn als waarmee het plan is gemaakt. */
export async function voerImportUit(
  admin: SupabaseClient,
  userId: string,
  regels: readonly ImportRegel[],
  plan: ImportPlan,
  vestiging: Vestiging,
): Promise<Uitvoering> {
  const uit: Uitvoering = { toegevoegd: 0, bijgewerkt: 0, mislukt: [] }
  const nieuw = new Map(plan.rijen.filter((r) => r.actie === 'nieuw').map((r) => [r.regel, r.zonderSportivityId]))
  const nieuweRegels = regels.flatMap((r) => (nieuw.has(r.regel) ? [{ ...r, zonderSportivityId: nieuw.get(r.regel) === true }] : []))
  await voegToe(admin, userId, vestiging, nieuweRegels, uit)
  await werkBij(admin, userId, plan, uit)
  return uit
}
