import Link from 'next/link'
import { ClipboardList } from 'lucide-react'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { LID_INTAKE } from '@/lib/aiyourgym/taal/woorden/ledenapp/lid-intake'
import './aanmelden.css'

// Op Home in de ledenapp, zolang er nog geen intake is: een uitnodiging om de
// korte intake te doen (vier vragen, ongeveer een minuut).

interface Props {
  href: string
  taal: Taal
}

export function IntakeKaart({ href, taal }: Props) {
  const t = LID_INTAKE[taal].kaart
  return (
    <section className="club-in-kaart club-mijn-blok" aria-labelledby="in-kaart-kop">
      <span className="club-in-kaart-icoon" aria-hidden><ClipboardList size={22} /></span>
      <div>
        <h2 id="in-kaart-kop">{t.kop}</h2>
        <p>{t.uitleg}</p>
      </div>
      <Link href={href} className="club-lidapp-knop club-lidapp-knop--primair">{t.knop}</Link>
    </section>
  )
}
