import { Check, Minus } from 'lucide-react'
import type { WelNietPunt } from '@/components/aiyourgym/inhoud/eerlijk'
import { SectieKop } from '@/components/aiyourgym/site/bouwstenen'
import { siteTekst } from '@/lib/aiyourgym/taal/server'
import { WEL_NIET } from '@/lib/aiyourgym/taal/woorden/website/home-vertrouwen'

// Eerlijk als bewijs: wat AI Your Gym doet en wat (nu) niet. Zolang er geen
// klantverhalen zijn, is open zijn over de grenzen ons sociaal bewijs.
// Teksten in de taal van de pagina (woordenboek WEL_NIET).

interface KolomProps {
  soort: 'wel' | 'niet'
  titel: string
  punten: readonly WelNietPunt[]
}

function Kolom({ soort, titel, punten }: KolomProps) {
  const Icoon = soort === 'wel' ? Check : Minus
  return (
    <div className="ayg-welniet-kolom" data-soort={soort}>
      <h3 className="ayg-welniet-kop">
        <span className="ayg-welniet-teken" aria-hidden>
          <Icoon size={16} strokeWidth={2.6} />
        </span>
        {titel}
      </h3>
      <ul>
        {punten.map((p) => (
          <li key={p.titel}>
            <strong>{p.titel}</strong>
            <span>{p.tekst}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export async function WelNiet() {
  const t = await siteTekst(WEL_NIET)
  return (
    <section className="ayg-sectie ayg-welniet" id="wel-niet" aria-labelledby="welniet-titel">
      <div className="ayg-wrap">
        <SectieKop
          id="welniet-titel"
          label={t.label}
          naast
          titel={
            <>
              {t.titel.voor}
              <mark className="ayg-markeer">{t.titel.accent}</mark>
            </>
          }
          tekst={t.tekst}
        />
        <div className="ayg-welniet-raster">
          <Kolom soort="wel" titel={t.welTitel} punten={t.wel} />
          <Kolom soort="niet" titel={t.nietTitel} punten={t.niet} />
        </div>
      </div>
    </section>
  )
}
