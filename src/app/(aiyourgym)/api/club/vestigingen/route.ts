import { type NextRequest, NextResponse } from 'next/server'
import { clubFout, clubJson, logActie, vereisBeheerdersBeheer } from '@/lib/club/toegang'
import { leesNieuweVestiging } from '@/lib/club/instellingen/vestigingen-invoer'
import { maakVestiging } from '@/lib/club/instellingen/vestigingen-opslag'

// POST /api/club/vestigingen  { naam, adres? }  een vestiging toevoegen aan de sportschool die open staat.

export async function POST(req: NextRequest) {
  const t = await vereisBeheerdersBeheer(req)
  if (t instanceof NextResponse) return t
  const invoer = leesNieuweVestiging(await req.json().catch(() => null))
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  const uit = await maakVestiging(t, invoer.waarde)
  if (!uit.ok) return clubFout(uit.fout, uit.status)
  await logActie(t, 'Vestiging toegevoegd', invoer.waarde.naam, uit.sleutel)
  return clubJson({ sleutel: uit.sleutel }, 201)
}
