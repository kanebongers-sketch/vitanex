import Link from 'next/link'
import type { ComponentType } from 'react'
import { ArrowUpRight, CalendarDays, ChartColumn, Dumbbell, ScanLine, Smartphone } from 'lucide-react'
import { DagTijd } from '@/components/aiyourgym/dag/DagTijd'
import { formatKlok } from '@/components/aiyourgym/dag/klok'
import { momentTijd, ROL_TIJD } from '@/components/aiyourgym/dag/momenten'
import { ROLLEN, type RolSleutel } from '@/components/aiyourgym/inhoud/systeem'
import { aygPad } from '@/components/aiyourgym/site/paden'
import { getSiteTaal } from '@/lib/aiyourgym/taal/server'
import { DAG } from '@/lib/aiyourgym/taal/woorden/website/dag'
import { OOGOPSLAG } from '@/lib/aiyourgym/taal/woorden/website/home'

// 07:00, de hele dag in een oogopslag: vijf plekken in een club als een
// dienstrooster, elk op het moment van de dag dat ze aan de beurt zijn (ROL_TIJD).
// Bewust stil (geauthorde stilte voor de piek bij de schema's): geen scrollbeweging,
// alleen ontworpen hover en focus. Per plek een zin en een link naar de details.

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
  const naam = DAG[taal].momenten.dag
  const rollen = ROLLEN.map((r, i) => ({ ...r, tekst: t.rollen[i] ?? r, tijd: ROL_TIJD[r.sleutel] })).sort((a, b) => a.tijd - b.tijd)
  const verder = [
    { label: t.functies, pad: '/functies' },
    { label: t.voorWie, pad: '/voor-wie' },
  ]
  return (
    <section className="ayg-sectie dag-oog" aria-labelledby="oog-titel" id="dag" data-dag={momentTijd('dag')} data-dag-naam={naam}>
      <div className="ayg-wrap dag-oog-raster">
        <div className="dag-oog-kop">
          <DagTijd minuten={momentTijd('dag')} naam={naam} />
          <h2 className="ayg-h2" id="oog-titel">
            {t.titel.voor}
            <mark className="ayg-markeer">{t.titel.accent}</mark>
            {t.titel.na}
          </h2>
          <p className="ayg-lead">{t.lead}</p>
          <nav className="dag-oog-verder" aria-label={t.meerLabel}>
            {verder.map((v) => (
              <Link key={v.pad} href={aygPad(v.pad)} className="ayg-pijllink">
                {v.label} <ArrowUpRight size={16} aria-hidden />
              </Link>
            ))}
          </nav>
        </div>
        <ol className="dag-rooster">
          {rollen.map((r) => {
            const Icoon = ICOON[r.sleutel]
            const tijd = formatKlok(r.tijd)
            return (
              <li key={r.sleutel}>
                <Link href={aygPad(r.pad)} className="dag-rooster-rij">
                  <time dateTime={tijd} className="dag-rooster-tijd">
                    {tijd}
                  </time>
                  <span className="dag-rooster-naam">
                    <Icoon size={18} aria-hidden />
                    <span>{r.tekst.naam}</span>
                  </span>
                  <span className="dag-rooster-zin">{r.tekst.kop}</span>
                  <ArrowUpRight className="dag-rooster-pijl" size={18} aria-hidden />
                </Link>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
