import Link from 'next/link'
import { CalendarClock } from 'lucide-react'
import type { ClubToegang } from '@/lib/club/toegang'
import { magBeheerdersBeheren } from '@/lib/club/beheerders/rechten'
import { ABONNEMENT_PAD } from '@/lib/aiyourgym/abonnement'
import { stripeAbonnementVan, vindAbonnement } from '@/lib/aiyourgym/abonnement-opslag'
import { proefTeller, proefTotVan } from '@/lib/aiyourgym/proefmails/proefperiode'

// Een rustige regel "Proefperiode tot 15 november · nog 9 dagen" voor Kane en
// de eigenaar, alleen als de sportschool echt in een proefperiode zit en we
// het einde kennen. Geen kleur van alarm en geen aftellen: alleen de datum.

export async function Proefperiode({ t }: { t: ClubToegang }) {
  if (!magBeheerdersBeheren(t)) return null
  const gelezen = await vindAbonnement(t.admin, t.userId)
  if (gelezen.soort !== 'gevonden') return null
  const rij = gelezen.rij
  const metStripe = rij.stripeKlantId !== null || rij.stripeAbonnementId !== null
  const stripe = metStripe && rij.status === 'actief' ? await stripeAbonnementVan(rij) : null
  const teller = proefTeller(proefTotVan({ status: rij.status, aangemaaktOp: rij.aangemaaktOp, metStripe }, stripe), new Date())
  if (!teller) return null
  return (
    <p className="club-proef">
      <CalendarClock aria-hidden size={14} />
      <span>
        <strong>{teller.kop}</strong> · {teller.dagen}
      </span>
      <Link href={ABONNEMENT_PAD}>Abonnement</Link>
    </p>
  )
}
