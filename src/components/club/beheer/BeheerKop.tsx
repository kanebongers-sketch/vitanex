import Link from 'next/link'
import { CircleAlert, Globe, Plus, Palette } from 'lucide-react'

// De kop van het instellingencentrum: welke sportschool, haar adres en welke
// onderdelen aan staan, wat nog ingesteld moet worden, en snelkoppelingen naar
// de huisstijl en (alleen Kane) een nieuwe sportschool.

interface BeheerKopProps {
  naam: string
  demo: boolean
  adres: string | null
  kleur: string
  modules: string[]
  /** Titels van onderdelen die nog aandacht vragen (nog niet ingesteld). */
  teDoen: string[]
  /** Alleen Kane maakt sportscholen aan; voor anderen zou de knop een 404 geven. */
  magNieuw: boolean
}

export function BeheerKop({ naam, demo, adres, kleur, modules, teDoen, magNieuw }: BeheerKopProps) {
  return (
    <header className="club-beheer-kop">
      <div className="club-beheer-kopinhoud">
        <p className="club-boventitel">Instellingencentrum</p>
        <h1>
          <span className="club-beheer-stip" style={{ background: kleur }} aria-hidden />
          {naam}
          {demo && <span className="club-chip club-chip--info">Demo</span>}
        </h1>
        <p className="club-beheer-adres">
          <Globe aria-hidden size={15} /> {adres ?? 'Nog geen eigen adres gekozen'}
        </p>
        <p className="club-beheer-modules">{modules.join(' · ')}</p>
        {teDoen.length > 0 && (
          <p className="club-beheer-tedoen">
            <CircleAlert aria-hidden size={16} /> Nog instellen: {teDoen.join(', ')}
          </p>
        )}
      </div>
      <div className="club-acties">
        <Link href="/clubkane/huisstijl" className="club-knop">
          <Palette aria-hidden size={16} /> Huisstijl
        </Link>
        {magNieuw && (
          <Link href="/clubkane/huisstijl#sportscholen-kop" className="club-knop club-knop--primair">
            <Plus aria-hidden size={16} /> Nieuwe sportschool
          </Link>
        )}
      </div>
    </header>
  )
}
