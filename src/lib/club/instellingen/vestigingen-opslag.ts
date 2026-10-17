// ─── Club: vestigingen opslaan (SERVER-ONLY) ────────────────────────────────
// Altijd voor de sportschool die open staat (t.userId). Een nieuwe vestiging
// krijgt nette standaardregels en openingstijden; die past de sportschool
// daarna aan onder Instellingen, Regels.

import { randomUUID } from 'node:crypto'
import type { ClubToegang } from '@/lib/club/toegang'
import { hoortBij } from '@/lib/club/kern/vestigingen'
import { MAX_VESTIGINGEN, maakVestigingSlug, nieuweVolgorde, type NieuweVestiging, type VestigingWijziging } from './vestigingen-invoer'

export type Opslag = { ok: true; sleutel: string } | { ok: false; fout: string; status: number }

const STANDAARD_REGELS = {
  annuleer_uren: 2,
  no_show_drempel: 3,
  no_show_blokkade_dagen: 7,
  reserveer_dagen_vooruit: 7,
  max_open_reserveringen: 5,
  checkin_venster_min: 15,
}
const STANDAARD_OPEN = Object.fromEntries([1, 2, 3, 4, 5, 6, 7].map((d) => [String(d), d <= 5 ? ['07:00', '22:00'] : ['09:00', '16:00']]))

export async function maakVestiging(t: ClubToegang, nieuw: NieuweVestiging): Promise<Opslag> {
  if (t.vestigingen.length >= MAX_VESTIGINGEN) return { ok: false, fout: `Maximaal ${MAX_VESTIGINGEN} vestigingen.`, status: 400 }
  if (t.vestigingen.some((v) => v.naam.toLowerCase() === nieuw.naam.toLowerCase())) return { ok: false, fout: 'Er is al een vestiging met deze naam.', status: 409 }
  for (let poging = 0; poging < 3; poging++) {
    const sleutel = maakVestigingSlug(nieuw.naam, randomUUID().slice(0, 4))
    const { error } = await t.admin.from('club_vestigingen').insert({
      vestiging: sleutel,
      user_id: t.userId,
      naam: nieuw.naam,
      adres: nieuw.adres,
      regels: STANDAARD_REGELS,
      openingstijden: STANDAARD_OPEN,
      volgorde: t.vestigingen.length + 1,
      standaard: t.vestigingen.length === 0,
    })
    if (!error) return { ok: true, sleutel }
    if (error.code !== '23505') {
      console.error('[club] vestiging toevoegen mislukt', error.message)
      break
    }
  }
  return { ok: false, fout: 'De vestiging kon niet worden toegevoegd. Probeer het opnieuw.', status: 500 }
}

export async function wijzigVestiging(t: ClubToegang, sleutel: string, w: VestigingWijziging): Promise<Opslag> {
  if (!hoortBij(t.vestigingen, sleutel)) return { ok: false, fout: 'Onbekende vestiging.', status: 404 }
  const fout = (bericht: string): Opslag => {
    console.error('[club] vestiging wijzigen mislukt', bericht)
    return { ok: false, fout: 'Opslaan lukte niet. Probeer het opnieuw.', status: 500 }
  }
  const velden = {
    ...(w.naam !== undefined ? { naam: w.naam } : {}),
    ...(w.adres !== undefined ? { adres: w.adres } : {}),
    ...(w.telefoon !== undefined ? { telefoon: w.telefoon } : {}),
    ...(w.email !== undefined ? { email: w.email } : {}),
  }
  if (Object.keys(velden).length > 0) {
    const { error } = await t.admin.from('club_vestigingen').update(velden).eq('user_id', t.userId).eq('vestiging', sleutel)
    if (error) return fout(error.message)
  }
  if (w.standaard) {
    const uit = await t.admin.from('club_vestigingen').update({ standaard: false }).eq('user_id', t.userId).neq('vestiging', sleutel)
    if (uit.error) return fout(uit.error.message)
    const aan = await t.admin.from('club_vestigingen').update({ standaard: true }).eq('user_id', t.userId).eq('vestiging', sleutel)
    if (aan.error) return fout(aan.error.message)
  }
  if (w.verplaats) {
    const volgorde = nieuweVolgorde(t.vestigingen.map((v) => v.sleutel), sleutel, w.verplaats)
    const uitslagen = await Promise.all(
      [...volgorde].map(([s, nr]) => t.admin.from('club_vestigingen').update({ volgorde: nr }).eq('user_id', t.userId).eq('vestiging', s)),
    )
    const mislukt = uitslagen.find((u) => u.error)
    if (mislukt?.error) return fout(mislukt.error.message)
  }
  return { ok: true, sleutel }
}
