import Link from 'next/link'
import type { ComponentType } from 'react'
import { ArrowUpRight, CalendarDays, ChartColumn, Dumbbell, ScanLine, Smartphone } from 'lucide-react'
import { ROLLEN, type RolSleutel } from '@/components/aiyourgym/inhoud/systeem'
import { aygPad } from '@/components/aiyourgym/site/paden'
import { getSiteTaal } from '@/lib/aiyourgym/taal/server'
import { OOGOPSLAG } from '@/lib/aiyourgym/taal/woorden/website/home'

// Wat AI Your Gym is, in een oogopslag: vijf plekken in een club, een systeem.
// Per plek een zin en een link naar de pagina met de details. Teksten in de
// taal van de pagina (woordenboek OOGOPSLAG, rollen in de volgorde van ROLLEN).

const ICOON: Record<RolSleutel, ComponentType<{ size?: number; 'aria-hidden'?: boolean }>> = {
  balie: ScanLine,
  vloer: CalendarDays,
  trainer: Dumbbell,
  eigenaar: ChartColumn,
  lid: Smartphone,
}

export async function Oogopslag() {
  const taal = await getSiteTaal()
  const t = OOGOPSLAG[taal]
  const verder = [
    { label: t.functies, pad: '/functies' },
    { label: t.voorWie, pad: '/voor-wie' },
  ]
  return (
    <section className="ayg-sectie ayg-oog" aria-labelledby="oog-titel">
      <div className="ayg-wrap">
        <div className="ayg-oog-kop">
          <p className="ayg-label ayg-label--accent">{t.label}</p>
          <h2 className="ayg-h2" id="oog-titel">
            {t.titel.voor}
            <mark className="ayg-markeer">{t.titel.accent}</mark>
            {t.titel.na}
          </h2>
          <p className="ayg-lead">{t.lead}</p>
        </div>
        <ol className="ayg-oog-rij">
          {ROLLEN.map((r, i) => {
            const Icoon = ICOON[r.sleutel]
            const tekst = t.rollen[i] ?? r
            return (
              <li key={r.sleutel}>
                <Link href={aygPad(r.pad, taal)} className="ayg-oog-plek">
                  <span className="ayg-oog-boven">
                    <Icoon size={20} aria-hidden />
                    <span className="ayg-oog-nr" aria-hidden>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </span>
                  <h3 className="ayg-oog-naam">{tekst.naam}</h3>
                  <p>{tekst.kop}</p>
                  <ArrowUpRight className="ayg-oog-pijl" size={18} aria-hidden />
                </Link>
              </li>
            )
          })}
        </ol>
        <nav className="ayg-oog-verder" aria-label={t.meerLabel}>
          {verder.map((v) => (
            <Link key={v.pad} href={aygPad(v.pad, taal)} className="ayg-pijllink">
              {v.label} <ArrowUpRight size={16} aria-hidden />
            </Link>
          ))}
        </nav>
      </div>
    </section>
  )
}
