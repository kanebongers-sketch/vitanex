'use client'

// ─── Weekdoelen-blok — het énige localStorage-blok op dit scherm ──────────────
// Bronscheiding: de rest van de weekreview komt uit /api/inzichten/weekrapport;
// weekdoelen leven bewust alleen client-side in localStorage (src/lib/weekdoelen).
// Daarom lezen we hier pas in een effect — nooit tijdens render — zodat SSR en
// hydration localStorage niet aanraken. Tot die read rendert het blok niets.

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import {
  laadWeekHistorie, laadWeekSelectie,
  type WeekHistorieEntry, type WeekSelectie,
} from '@/lib/doelen/weekdoelen'
import {
  doelmomentenTekst, telHistorieGehaald, telWeekMomenten, vorigeWeek, vorigeWeekTekst,
} from './weekdoelen-blok'

interface WeekdoelenOpslag {
  selectie: WeekSelectie | null
  historie: WeekHistorieEntry[]
}

function DoelenLink({ label }: { label: string }) {
  return (
    <Link
      href="/doelen"
      style={{
        display: 'inline-block', marginTop: 10,
        fontSize: 11, fontWeight: 700, textDecoration: 'none',
        color: 'var(--text-1)', border: '1px solid var(--border-strong)',
        borderRadius: 8, padding: '5px 11px',
      }}
    >
      {label}
    </Link>
  )
}

export default function WeekdoelenBlok() {
  const [opslag, setOpslag] = useState<WeekdoelenOpslag | null>(null)

  useEffect(() => {
    // Uitgesteld naar een microtask (zelfde patroon als page.tsx) — geen synchrone
    // setState in het effect. De laadfuncties vangen corrupte opslag zelf af.
    void Promise.resolve().then(() => {
      setOpslag({ selectie: laadWeekSelectie(), historie: laadWeekHistorie() })
    })
  }, [])

  if (!opslag) return null

  // Een selectie zonder doelen is niets om te tonen — behandel als afwezig.
  const selectie = opslag.selectie && opslag.selectie.doelen.length > 0 ? opslag.selectie : null
  const vorige = vorigeWeek(opslag.historie, selectie?.weekStart)

  // Geen weekdoelen gekozen én geen afgeronde week → blok verbergen (rustigst).
  if (!selectie && !vorige) return null

  const momenten = selectie ? telWeekMomenten(selectie.doelen) : null
  const heeftMomenten = momenten !== null && momenten.gelogd > 0
  const vorigeRegel = vorige ? vorigeWeekTekst(telHistorieGehaald(vorige)) : null

  return (
    <section aria-label="Weekdoelen">
      <Card className="mf-fade-in" style={{ padding: '16px 18px', marginTop: 14 }}>
        <p className="mf-section-label" style={{ marginBottom: 8 }}>Weekdoelen</p>

        <p style={{
          fontSize: 14, color: 'var(--text-1)', lineHeight: 1.65, margin: 0,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {heeftMomenten && momenten !== null
            ? doelmomentenTekst(momenten)
            : selectie
              ? 'Je weekdoelen staan klaar — er is nog geen moment gelogd.'
              : 'Voor deze week heb je nog geen weekdoelen gekozen.'}
        </p>

        {vorigeRegel && (
          <p style={{
            fontSize: 12, color: 'var(--text-4)', margin: '6px 0 0',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {vorigeRegel}
          </p>
        )}

        {!heeftMomenten && (
          <DoelenLink label={selectie ? 'Log een moment' : 'Kies je weekdoelen'} />
        )}
      </Card>
    </section>
  )
}
