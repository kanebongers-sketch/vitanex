// ─── Club, betalen: PT-sessies afboeken bij een afspraak (SERVER-ONLY) ──────
// De trainer boekt bij een afspraak van het type personal training een sessie
// af van het PT-tegoed van het lid (een keer per afspraak), en kan dat
// ongedaan maken. Een geannuleerde afspraak kan niet worden afgeboekt.

import type { NextResponse } from 'next/server'
import { clubFout, clubJson, logActie, type ClubToegang } from '@/lib/club/toegang'
import { haalAfspraak, haalType } from '@/lib/club/afspraken/opslag'
import type { Afspraak } from '@/lib/club/afspraken/model'
import { isUuid } from '@/lib/club/kern/organisatie'
import { betalenActief } from './config'
import { boekTegoedAf, geefTegoedTerug, haalBetaalAccount, haalTegoeden, nettoVoorAfspraak } from './opslag'
import { bruikbaarSaldo, isPtAfspraakType } from './regels'

const UIT = { beschikbaar: false } as const

async function ptAfspraak(t: ClubToegang, id: string): Promise<Afspraak | null> {
  if (!isUuid(id)) return null
  const afspraak = await haalAfspraak(t.admin, t.userId, id)
  if (!afspraak) return null
  const type = await haalType(t.admin, t.userId, afspraak.typeId)
  return type && isPtAfspraakType(type.naam) ? afspraak : null
}

/** Staat er een PT-sessie op deze afspraak, en hoeveel sessies heeft het lid nog? */
export async function ptStand(t: ClubToegang, id: string): Promise<NextResponse> {
  if (!betalenActief()) return clubJson(UIT)
  const account = await haalBetaalAccount(t.admin, t.userId)
  if (!account?.betalenAan) return clubJson(UIT)
  const afspraak = await ptAfspraak(t, id)
  if (!afspraak) return clubJson(UIT)
  const [tegoeden, netto] = await Promise.all([haalTegoeden(t.admin, t.userId, afspraak.lidId), nettoVoorAfspraak(t.admin, t.userId, id)])
  if (!tegoeden || netto === null) return clubFout('Het PT-tegoed kon niet worden gelezen.', 500)
  return clubJson({ beschikbaar: true, saldo: bruikbaarSaldo(tegoeden, 'pt', afspraak.vestiging, new Date()), afgeboekt: netto < 0 })
}

export async function ptAfboeken(t: ClubToegang, id: string): Promise<NextResponse> {
  if (!betalenActief()) return clubFout('Niet gevonden.', 404)
  const afspraak = await ptAfspraak(t, id)
  if (!afspraak) return clubFout('Dit is geen afspraak voor personal training.', 404)
  if (afspraak.status === 'geannuleerd') return clubFout('Deze afspraak is geannuleerd.', 409)
  const uit = await boekTegoedAf(t.admin, { userId: t.userId, lidId: afspraak.lidId, soort: 'pt', vestiging: afspraak.vestiging, reserveringId: null, afspraakId: id, door: t.naam })
  if (uit === 'geen') return clubFout('Dit lid heeft geen geldig PT-tegoed voor deze vestiging.', 409)
  if (uit === 'al') return clubFout('Voor deze afspraak is al een sessie afgeboekt.', 409)
  if (uit === 'fout') return clubFout('Afboeken is niet gelukt. Probeer het opnieuw.', 500)
  await logActie(t, 'PT-sessie afgeboekt', null, afspraak.vestiging)
  return clubJson({ afgeboekt: true })
}

export async function ptTerugzetten(t: ClubToegang, id: string): Promise<NextResponse> {
  if (!betalenActief()) return clubFout('Niet gevonden.', 404)
  const afspraak = await ptAfspraak(t, id)
  if (!afspraak) return clubFout('Dit is geen afspraak voor personal training.', 404)
  const terug = await geefTegoedTerug(t.admin, { userId: t.userId, lidId: afspraak.lidId, reserveringId: null, afspraakId: id, door: t.naam })
  if (terug === null) return clubFout('Terugzetten is niet gelukt. Probeer het opnieuw.', 500)
  if (!terug) return clubFout('Voor deze afspraak staat geen sessie afgeboekt.', 409)
  await logActie(t, 'PT-sessie teruggezet', null, afspraak.vestiging)
  return clubJson({ afgeboekt: false })
}
