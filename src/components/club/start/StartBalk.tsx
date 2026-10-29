import Link from 'next/link'
import { LifeBuoy, Sparkles } from 'lucide-react'
import { UitlogKnop } from '@/components/club/shell/UitlogKnop'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { START } from '@/lib/aiyourgym/taal/woorden/club/start'
import './start-balk.css'

// De balk zolang de startwizard loopt: geen menu met onderdelen die nog niet
// open zijn, alleen de wizard, hulp en uitloggen. `wizard` = false voor het
// team van de sportschool: zij wachten tot de eigenaar klaar is.

interface StartBalkProps {
  naam: string
  logoUrl: string | null
  wizard: boolean
}

export async function StartBalk({ naam, logoUrl, wizard }: StartBalkProps) {
  const t = (await clubTekst(START)).balk
  return (
    <header className="club-startbalk">
      <span className="club-startbalk-merk">
        {logoUrl ? <img src={logoUrl} alt="" width={32} height={32} /> : null}
        <strong>{naam}</strong>
      </span>
      <nav className="club-startbalk-nav" aria-label={t.nav}>
        {wizard && (
          <Link href="/club/start" className="club-startbalk-link">
            <Sparkles aria-hidden size={15} /> {t.wizard}
          </Link>
        )}
        <Link href="/club/hulp" className="club-startbalk-link">
          <LifeBuoy aria-hidden size={15} /> {t.hulp}
        </Link>
        <UitlogKnop />
      </nav>
    </header>
  )
}

/** Voor het team zolang de eigenaar de wizard nog doorloopt. */
export async function WizardWacht({ naam }: { naam: string }) {
  const t = (await clubTekst(START)).balk
  return (
    <section className="club-startbalk-wacht" aria-labelledby="wacht-kop">
      <h1 id="wacht-kop">{t.wachtKop(naam)}</h1>
      <p>{t.wachtTekst}</p>
    </section>
  )
}
