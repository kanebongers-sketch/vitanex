import Link from 'next/link'
import { ArrowRight, Check, Minus } from 'lucide-react'
import { aygPad } from '@/components/aiyourgym/site/paden'
import { getSiteTaal } from '@/lib/aiyourgym/taal/server'
import { WEL_NIET_KORT } from '@/lib/aiyourgym/taal/woorden/website/home-vertrouwen'

// Eerlijk als bewijs, kort op de voorpagina: vier dingen die AI Your Gym doet
// en vier die het (nu) niet doet. De volledige lijst met uitleg staat op
// /overstappen#wel-niet (component WelNiet). Teksten in de taal van de pagina
// (woordenboek WEL_NIET_KORT).

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

export async function WelNietKort() {
  const taal = await getSiteTaal()
  const t = WEL_NIET_KORT[taal]
  return (
    <section className="ayg-sectie ayg-welkort" id="wel-niet" aria-labelledby="welkort-titel">
      <div className="ayg-wrap ayg-welkort-raster">
        <div className="ayg-welkort-kop">
          <p className="ayg-label ayg-label--accent">{t.label}</p>
          <h2 className="ayg-h2" id="welkort-titel">
            {t.titel.voor}
            <mark className="ayg-markeer">{t.titel.accent}</mark>
          </h2>
          <p className="ayg-welkort-zin">{t.zin}</p>
        </div>
        <div className="ayg-welkort-vak">
          <Kolom soort="wel" titel={t.welTitel} punten={t.wel} />
          <Kolom soort="niet" titel={t.nietTitel} punten={t.niet} />
        </div>
        <Link href={aygPad('/overstappen#wel-niet', taal)} className="ayg-pijllink ayg-welkort-link">
          {t.link} <ArrowRight size={16} aria-hidden />
        </Link>
      </div>
    </section>
  )
}
