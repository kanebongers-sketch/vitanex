import Link from 'next/link'
import { Globe, Plus } from 'lucide-react'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { BEHEER } from '@/lib/aiyourgym/taal/woorden/club/beheer'
import { ZoekVeld } from './ZoekVeld'

// De kop van het instellingencentrum: welke sportschool, haar webadres en een
// zoekveld (Ctrl K). De naam pas je aan op de huisstijlpagina; de kop linkt
// daarheen voor wie dat mag. Alleen Kane maakt een nieuwe sportschool aan.

interface CentrumKopProps {
  naam: string
  demo: boolean
  /** Het webadres, null als het nog niet gekozen is; undefined = niet tonen (geen recht op de huisstijl). */
  adres?: string | null
  kleur: string
  /** Waar de naam staat (de huisstijlpagina), alleen voor wie de huisstijl mag. */
  naamHref: string | null
  magNieuw: boolean
}

export async function CentrumKop({ naam, demo, adres, kleur, naamHref, magNieuw }: CentrumKopProps) {
  const tekst = await clubTekst(BEHEER)
  return (
    <header className="club-ic-kop">
      <div className="club-ic-kopinhoud">
        <p className="club-boventitel">{tekst.algemeen.instellingen}</p>
        <h1>
          <span className="club-ic-merkstip" style={{ background: kleur }} aria-hidden />
          <span className="club-ic-naam">{naam}</span>
          {demo && <span className="club-chip club-chip--info">{tekst.kop.demo}</span>}
        </h1>
        {(adres !== undefined || naamHref) && (
          <p className="club-ic-meta">
            {adres !== undefined && (
              <span className={`club-ic-adres${adres ? '' : ' is-leeg'}`}>
                <Globe aria-hidden size={14} /> {adres ?? tekst.kop.geenAdres}
              </span>
            )}
            {naamHref && <Link href={naamHref}>{tekst.kop.naamWijzigen}</Link>}
          </p>
        )}
      </div>
      <div className="club-ic-kopacties">
        <ZoekVeld />
        {magNieuw && (
          <Link href="/club/huisstijl#sportscholen-kop" className="club-knop">
            <Plus aria-hidden size={16} /> {tekst.kop.nieuweSportschool}
          </Link>
        )}
      </div>
    </header>
  )
}
