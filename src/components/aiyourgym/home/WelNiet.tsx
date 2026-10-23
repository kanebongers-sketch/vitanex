import { Check, Minus } from 'lucide-react'
import { NIET, WEL, type WelNietPunt } from '@/components/aiyourgym/inhoud/eerlijk'
import { SectieKop } from '@/components/aiyourgym/site/bouwstenen'

// Eerlijk als bewijs: wat AI Your Gym doet en wat (nu) niet. Zolang er geen
// klantverhalen zijn, is open zijn over de grenzen ons sociaal bewijs.

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

export function WelNiet() {
  return (
    <section className="ayg-sectie ayg-welniet" id="wel-niet" aria-labelledby="welniet-titel">
      <div className="ayg-wrap">
        <SectieKop
          id="welniet-titel"
          label="Eerlijk"
          naast
          titel={
            <>
              Wat we doen. <mark className="ayg-markeer">En wat niet.</mark>
            </>
          }
          tekst="Liever nu duidelijk dan straks een verrassing. Dit is wat AI Your Gym voor je club doet, en wat bij je eigen ledenadministratie blijft."
        />
        <div className="ayg-welniet-raster">
          <Kolom soort="wel" titel="Dit doet AI Your Gym" punten={WEL} />
          <Kolom soort="niet" titel="Dit doet het (nu) niet" punten={NIET} />
        </div>
      </div>
    </section>
  )
}
