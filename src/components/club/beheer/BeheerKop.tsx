import Link from 'next/link'
import { Globe, Plus, Palette } from 'lucide-react'

// De kop van het instellingencentrum: welke sportschool, haar adres en welke
// onderdelen aan staan, met snelkoppelingen naar huisstijl en een nieuwe sportschool.

interface BeheerKopProps {
  naam: string
  demo: boolean
  adres: string | null
  kleur: string
  modules: string[]
}

export function BeheerKop({ naam, demo, adres, kleur, modules }: BeheerKopProps) {
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
      </div>
      <div className="club-acties">
        <Link href="/clubkane/huisstijl" className="club-knop">
          <Palette aria-hidden size={16} /> Huisstijl
        </Link>
        <Link href="/clubkane/huisstijl#sportscholen-kop" className="club-knop club-knop--primair">
          <Plus aria-hidden size={16} /> Nieuwe sportschool
        </Link>
      </div>
    </header>
  )
}
