import { type NextRequest, NextResponse } from 'next/server'
import { clubFout, clubJson, logActie, vereisBeheerdersBeheer } from '@/lib/club/toegang'
import { leesNieuweVestiging } from '@/lib/club/instellingen/vestigingen-invoer'
import { maakVestiging } from '@/lib/club/instellingen/vestigingen-opslag'
import { zorgVoorVestigingAbonnementen } from '@/lib/aiyourgym/vestiging-abonnement-opslag'
import { meldFout } from '@/lib/club/betrouwbaarheid/melden'

// POST /api/club/vestigingen  { naam, adres? }  een vestiging toevoegen aan de sportschool die open staat.
// Staffels (besluit Kane 31-10-2026): met Stripe gekoppeld krijgt de nieuwe
// vestiging meteen een eigen abonnement met dezelfde pakketten (de hoeveelheid
// is het aantal actieve leden, minimaal 1). Zonder Stripe gebeurt er niets.
// Lukt Stripe nu niet, dan staat de vestiging er wel en maakt de dagelijkse
// cron het abonnement alsnog (idempotent, nooit dubbel).

export async function POST(req: NextRequest) {
  const t = await vereisBeheerdersBeheer(req)
  if (t instanceof NextResponse) return t
  const invoer = leesNieuweVestiging(await req.json().catch(() => null))
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  const uit = await maakVestiging(t, invoer.waarde)
  if (!uit.ok) return clubFout(uit.fout, uit.status)
  await logActie(t, 'Vestiging toegevoegd', invoer.waarde.naam, uit.sleutel)
  const abonnement = await zorgVoorVestigingAbonnementen(t.admin, t.userId).catch(() => 'fout' as const)
  if (abonnement === 'fout') await meldFout({ fout: 'Abonnement voor een nieuwe vestiging niet gemaakt; de cron probeert het opnieuw', route: '/api/club/vestigingen', methode: 'POST', soort: 'handmatig' }, t.admin)
  return clubJson({ sleutel: uit.sleutel }, 201)
}
