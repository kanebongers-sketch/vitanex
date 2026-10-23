import Link from 'next/link'
import type { ComponentType } from 'react'
import { ArrowUpRight, CalendarDays, ChartColumn, Dumbbell, ScanLine, Smartphone } from 'lucide-react'
import { ROLLEN, type RolSleutel } from '@/components/aiyourgym/inhoud/systeem'
import { aygPad } from '@/components/aiyourgym/site/paden'

// Wat AI Your Gym is, in een oogopslag: vijf plekken in een club, een systeem.
// Per plek een zin en een link naar de pagina met de details.

const ICOON: Record<RolSleutel, ComponentType<{ size?: number; 'aria-hidden'?: boolean }>> = {
  balie: ScanLine,
  vloer: CalendarDays,
  trainer: Dumbbell,
  eigenaar: ChartColumn,
  lid: Smartphone,
}

const VERDER = [
  { label: 'Alle functies', pad: '/functies' },
  { label: 'Voor wie', pad: '/voor-wie' },
] as const

export function Oogopslag() {
  return (
    <section className="ayg-sectie ayg-oog" aria-labelledby="oog-titel">
      <div className="ayg-wrap">
        <div className="ayg-oog-kop">
          <p className="ayg-label ayg-label--accent">In een oogopslag</p>
          <h2 className="ayg-h2" id="oog-titel">
            Vijf plekken. <mark className="ayg-markeer">Een</mark> systeem.
          </h2>
          <p className="ayg-lead">Balie, vloer, trainers, eigenaar en leden werken in dezelfde gegevens. Niets dubbel, niets overtypen.</p>
        </div>
        <ol className="ayg-oog-rij">
          {ROLLEN.map((r, i) => {
            const Icoon = ICOON[r.sleutel]
            return (
              <li key={r.sleutel}>
                <Link href={aygPad(r.pad)} className="ayg-oog-plek">
                  <span className="ayg-oog-boven">
                    <Icoon size={20} aria-hidden />
                    <span className="ayg-oog-nr" aria-hidden>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </span>
                  <h3 className="ayg-oog-naam">{r.naam}</h3>
                  <p>{r.kop}</p>
                  <ArrowUpRight className="ayg-oog-pijl" size={18} aria-hidden />
                </Link>
              </li>
            )
          })}
        </ol>
        <nav className="ayg-oog-verder" aria-label="Meer over AI Your Gym">
          {VERDER.map((v) => (
            <Link key={v.pad} href={aygPad(v.pad)} className="ayg-pijllink">
              {v.label} <ArrowUpRight size={16} aria-hidden />
            </Link>
          ))}
        </nav>
      </div>
    </section>
  )
}
