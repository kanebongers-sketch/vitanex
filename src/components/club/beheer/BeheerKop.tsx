import Link from 'next/link'
import { CircleAlert, Globe, Plus } from 'lucide-react'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { BEHEER } from '@/lib/aiyourgym/taal/woorden/club/beheer'

// De kop van het instellingencentrum: welke sportschool, haar adres en welke
// onderdelen aan staan, wat nog ingesteld moet worden, en (alleen Kane) een
// nieuwe sportschool. De huisstijl zelf is een regel in de groep Sportschool.

interface BeheerKopProps {
  naam: string
  demo: boolean
  /** Het eigen adres, null als het nog niet gekozen is; undefined = niet tonen (geen recht op de huisstijl). */
  adres?: string | null
  kleur: string
  modules: string[]
  /** Titels van onderdelen die nog aandacht vragen (nog niet ingesteld). */
  teDoen: string[]
  /** Alleen Kane maakt sportscholen aan; voor anderen zou de knop een 404 geven. */
  magNieuw: boolean
}

export async function BeheerKop({ naam, demo, adres, kleur, modules, teDoen, magNieuw }: BeheerKopProps) {
  const tekst = await clubTekst(BEHEER)
  return (
    <header className="club-beheer-kop">
      <div className="club-beheer-kopinhoud">
        <p className="club-boventitel">{tekst.algemeen.instellingen}</p>
        <h1>
          <span className="club-beheer-stip" style={{ background: kleur }} aria-hidden />
          {naam}
          {demo && <span className="club-chip club-chip--info">{tekst.kop.demo}</span>}
        </h1>
        {adres !== undefined && (
          <p className="club-beheer-adres">
            <Globe aria-hidden size={15} /> {adres ?? tekst.kop.geenAdres}
          </p>
        )}
        <p className="club-beheer-modules">{modules.join(' · ')}</p>
        {teDoen.length > 0 && (
          <p className="club-beheer-tedoen">
            <CircleAlert aria-hidden size={16} /> {tekst.kop.nogInstellen(teDoen.join(', '))}
          </p>
        )}
      </div>
      {magNieuw && (
        <div className="club-acties">
          <Link href="/club/huisstijl#sportscholen-kop" className="club-knop club-knop--primair">
            <Plus aria-hidden size={16} /> {tekst.kop.nieuweSportschool}
          </Link>
        </div>
      )}
    </header>
  )
}
