import Link from 'next/link'
import { ArrowRight, Check, Minus } from 'lucide-react'
import { NIET_KORT, WEL_KORT } from '@/components/aiyourgym/inhoud/eerlijk'
import { aygPad } from '@/components/aiyourgym/site/paden'

// Eerlijk als bewijs, kort op de voorpagina: vier dingen die AI Your Gym doet
// en vier die het (nu) niet doet. De volledige lijst met uitleg staat op
// /overstappen#wel-niet (component WelNiet).

interface KolomProps {
  soort: 'wel' | 'niet'
  titel: string
  punten: readonly string[]
}

function Kolom({ soort, titel, punten }: KolomProps) {
  const Icoon = soort === 'wel' ? Check : Minus
  return (
    <div className="ayg-welkort-kolom" data-soort={soort}>
      <h3 className="ayg-welkort-titel">
        <span className="ayg-welniet-teken" aria-hidden>
          <Icoon size={15} strokeWidth={2.6} />
        </span>
        {titel}
      </h3>
      <ul>
        {punten.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
    </div>
  )
}

export function WelNietKort() {
  return (
    <section className="ayg-sectie ayg-welkort" id="wel-niet" aria-labelledby="welkort-titel">
      <div className="ayg-wrap ayg-welkort-raster">
        <div className="ayg-welkort-kop">
          <p className="ayg-label ayg-label--accent">Eerlijk</p>
          <h2 className="ayg-h2" id="welkort-titel">
            Wat we doen. <mark className="ayg-markeer">En wat niet.</mark>
          </h2>
          <p className="ayg-welkort-zin">Liever nu duidelijk dan straks een verrassing.</p>
        </div>
        <div className="ayg-welkort-vak">
          <Kolom soort="wel" titel="Doet het" punten={WEL_KORT} />
          <Kolom soort="niet" titel="Doet het (nu) niet" punten={NIET_KORT} />
        </div>
        <Link href={aygPad('/overstappen#wel-niet')} className="ayg-pijllink ayg-welkort-link">
          Alles wat wel en niet <ArrowRight size={16} aria-hidden />
        </Link>
      </div>
    </section>
  )
}
