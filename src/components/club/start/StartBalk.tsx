import Link from 'next/link'
import { LifeBuoy, Sparkles } from 'lucide-react'
import { UitlogKnop } from '@/components/club/shell/UitlogKnop'
import './start-balk.css'

// De balk zolang de startwizard loopt: geen menu met onderdelen die nog niet
// open zijn, alleen de wizard, hulp en uitloggen. `wizard` = false voor het
// team van de sportschool: zij wachten tot de eigenaar klaar is.

interface StartBalkProps {
  naam: string
  logoUrl: string | null
  wizard: boolean
}

export function StartBalk({ naam, logoUrl, wizard }: StartBalkProps) {
  return (
    <header className="club-startbalk">
      <span className="club-startbalk-merk">
        {logoUrl ? <img src={logoUrl} alt="" width={32} height={32} /> : null}
        <strong>{naam}</strong>
      </span>
      <nav className="club-startbalk-nav" aria-label="Startwizard">
        {wizard && (
          <Link href="/club/start" className="club-startbalk-link">
            <Sparkles aria-hidden size={15} /> Startwizard
          </Link>
        )}
        <Link href="/club/hulp" className="club-startbalk-link">
          <LifeBuoy aria-hidden size={15} /> Hulp
        </Link>
        <UitlogKnop />
      </nav>
    </header>
  )
}

/** Voor het team zolang de eigenaar de wizard nog doorloopt. */
export function WizardWacht({ naam }: { naam: string }) {
  return (
    <section className="club-startbalk-wacht" aria-labelledby="wacht-kop">
      <h1 id="wacht-kop">{naam} wordt ingericht</h1>
      <p>De eigenaar zet Club nu klaar. Zodra dat af is, opent alles hier vanzelf. Ververs de pagina om te kijken of het al zover is.</p>
    </section>
  )
}
