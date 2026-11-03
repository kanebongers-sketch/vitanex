import Link from 'next/link'
import { BellRing } from 'lucide-react'
import { clubToegang } from '@/lib/club/toegang'
import { clubPad } from '@/lib/club/kern/vestiging'
import { haalOpenTelling } from '@/lib/club/prikbord/opslag'
import { kijkerVan, prikbordZichtbaar } from '@/lib/club/prikbord/toegang'
import { totaalOpen } from '@/lib/club/prikbord/model'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { PRIKBORD } from '@/lib/aiyourgym/taal/woorden/club/prikbord'
import './prikbord.css'

// De regel bovenaan Vandaag (deel 4 plaatst hem in club/page.tsx): alleen als
// er iets open staat, bijvoorbeeld "2 nieuwe mededelingen, 1 werkwijze te
// bevestigen". Een tik opent het Prikbord. Bij 0, zonder recht of zonder het
// pakket Team en vloer: niets. Blokkeert nooit (besluit: alleen bovenaan).
// Laadt zelf, zodat Vandaag hem in een Suspense kan zetten.

interface Props {
  /** De vestiging van Vandaag (sleutel), voor de link naar het Prikbord. */
  vestiging?: string | null
}

export async function PrikbordRegel({ vestiging = null }: Props) {
  const t = await clubToegang()
  if (!t || !prikbordZichtbaar(t)) return null
  const telling = await haalOpenTelling(t.admin, t.userId, kijkerVan(t), new Date())
  if (!telling || totaalOpen(telling) === 0) return null
  const tekst = (await clubTekst(PRIKBORD)).regel
  const delen = [
    telling.mededelingen > 0 ? tekst.mededelingen(telling.mededelingen) : null,
    telling.werkwijzen > 0 ? tekst.werkwijzen(telling.werkwijzen) : null,
  ].filter((d): d is string => d !== null)
  const href = vestiging ? clubPad('/prikbord', vestiging) : '/club/prikbord'
  return (
    <Link href={href} className="pb-regel" aria-label={`${tekst.label}: ${delen.join(', ')}`}>
      <BellRing size={18} aria-hidden />
      <span className="pb-regel-tekst">{delen.join(', ')}</span>
      <span className="pb-regel-open">{tekst.open}</span>
    </Link>
  )
}
