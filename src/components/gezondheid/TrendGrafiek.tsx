'use client'

// Detailgrafiek met uitlezing. Bedienbaar met muis, aanraking én toetsenbord
// (pijltjes, Home/End) als slider over de punten; daarnaast een sr-only tabel
// met alle waarden als tekstalternatief.

import { useState, type KeyboardEvent, type PointerEvent } from 'react'
import { METRIEKEN, formatMetWaarde, metriekLabel } from '@/lib/health/gezondheid-metrics'
import { grafiekDomein, labelIndexen, rasterWaarden, yProcent } from '@/lib/gezondheid/grafiek'
import type { Normaal } from '@/lib/gezondheid/normaal'
import type { Periode, TrendPunt } from '@/lib/gezondheid/trends'
import type { MetriekSleutel } from '@/lib/gezondheid/types'
import type { Taalset } from '@/lib/i18n/taalset'
import { GrafiekMarkeringen } from './GrafiekMarkeringen'
import { useTaalset } from './useTaalset'
import styles from './gezondheid.module.css'

interface TrendGrafiekProps {
  sleutel: MetriekSleutel
  punten: readonly TrendPunt[]
  normaal: Normaal | null
  periode: Periode
  omschrijving: string
}

function laatsteMetWaarde(punten: readonly TrendPunt[]): number | null {
  for (let i = punten.length - 1; i >= 0; i--) if (punten[i].waarde !== null) return i
  return null
}

function uitlezing(sleutel: MetriekSleutel, punt: TrendPunt, periode: Periode, ts: Taalset): { waarde: string; context: string } {
  if (punt.waarde === null) return { waarde: ts.t('lichaam.grafiek.geenMeting'), context: punt.labelLang }
  const waarde = formatMetWaarde(sleutel, punt.waarde, ts)
  if (periode === 'dag') {
    return { waarde, context: punt.onvolledig ? ts.t('lichaam.grafiek.totNuToe', { datum: punt.labelLang }) : punt.labelLang }
  }
  const dagen = ts.t(punt.aantal === 1 ? 'lichaam.grafiek.gemetenEen' : 'lichaam.grafiek.gemetenMeer', { aantal: punt.aantal })
  const lopend = punt.onvolledig ? ts.t(periode === 'week' ? 'lichaam.grafiek.lopendeWeek' : 'lichaam.grafiek.lopendeMaand') : ''
  const soort = ts.t(METRIEKEN[sleutel].aggregatie === 'totaal' ? 'lichaam.grafiek.totaal' : 'lichaam.grafiek.gemiddeld')
  return { waarde, context: `${soort}, ${punt.labelLang} · ${dagen}${lopend}` }
}

const STAP_TOETSEN: Record<string, (i: number, n: number) => number> = {
  ArrowLeft: (i) => i - 1,
  ArrowDown: (i) => i - 1,
  ArrowRight: (i) => i + 1,
  ArrowUp: (i) => i + 1,
  Home: () => 0,
  End: (_, n) => n - 1,
}

export function TrendGrafiek({ sleutel, punten, normaal, periode, omschrijving }: TrendGrafiekProps) {
  const ts = useTaalset()
  const cfg = METRIEKEN[sleutel]
  const label = metriekLabel(sleutel, ts)
  const [gekozen, setGekozen] = useState<number | null>(null)
  const standaard = laatsteMetWaarde(punten)
  const actief = gekozen ?? standaard ?? punten.length - 1
  const domein = grafiekDomein(punten.map((p) => p.waarde), normaal, cfg.grafiek)
  const lezing = uitlezing(sleutel, punten[actief], periode, ts)

  function kiesUitPointer(e: PointerEvent<HTMLDivElement>) {
    const vlak = e.currentTarget.getBoundingClientRect()
    const i = Math.floor(((e.clientX - vlak.left) / vlak.width) * punten.length)
    setGekozen(Math.min(Math.max(i, 0), punten.length - 1))
  }

  function toets(e: KeyboardEvent<HTMLDivElement>) {
    const stap = STAP_TOETSEN[e.key]
    if (!stap) return
    e.preventDefault()
    setGekozen(Math.min(Math.max(stap(actief, punten.length), 0), punten.length - 1))
  }

  return (
    <figure className={styles.grafiek}>
      <p className={styles.uitlezing} aria-hidden="true">
        <span className={styles.uitlezingWaarde}>{lezing.waarde}</span>
        {lezing.context}
      </p>
      <div className={styles.grafiekRij}>
        <div
          className={styles.grafiekVlak}
          role="slider"
          tabIndex={0}
          aria-label={ts.t('lichaam.grafiek.sliderAria', { label, omschrijving })}
          aria-valuemin={0}
          aria-valuemax={punten.length - 1}
          aria-valuenow={actief}
          aria-valuetext={`${lezing.waarde}, ${lezing.context}`}
          onPointerDown={kiesUitPointer}
          onPointerMove={kiesUitPointer}
          onPointerLeave={(e) => { if (e.pointerType === 'mouse') setGekozen(null) }}
          onKeyDown={toets}
        >
          <GrafiekMarkeringen punten={punten} domein={domein} normaal={normaal} vorm={cfg.grafiek} actief={actief} />
        </div>
        <div className={styles.yAs} aria-hidden="true">
          {rasterWaarden(domein).map((w) => (
            <span key={w} className={styles.yLabel} style={{ top: `${yProcent(w, domein)}%` }}>{cfg.formatteer(w, ts)}</span>
          ))}
        </div>
      </div>
      <div className={styles.xAs} aria-hidden="true">
        {labelIndexen(punten.length).map((i, j, alle) => (
          <span
            key={punten[i].sleutel}
            className={styles.xLabel}
            style={{
              left: `${((i + 0.5) / punten.length) * 100}%`,
              transform: `translateX(${j === 0 ? '-25%' : j === alle.length - 1 ? '-75%' : '-50%'})`,
            }}
          >
            {punten[i].label}
          </span>
        ))}
      </div>
      {normaal && (
        <p className={styles.legenda}>
          <span><span className={styles.legendaBand} aria-hidden="true" />{ts.t('lichaam.grafiek.bereik')}</span>
          <span><span className={styles.legendaMediaan} aria-hidden="true" />{ts.t('lichaam.grafiek.mediaan')}</span>
        </p>
      )}
      <table className={styles.srOnly}>
        <caption>{label}, {omschrijving}</caption>
        <thead><tr><th scope="col">{ts.t('lichaam.grafiek.periode')}</th><th scope="col">{ts.t('lichaam.grafiek.waarde')}</th></tr></thead>
        <tbody>
          {punten.map((p) => (
            <tr key={p.sleutel}>
              <th scope="row">{p.labelLang}</th>
              <td>{p.waarde === null ? ts.t('lichaam.grafiek.geenMetingKlein') : formatMetWaarde(sleutel, p.waarde, ts)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
