'use client'

// Presentational: detail van één metriek bij geladen data. Periodekeuze via
// Tabs (de container bewaart hem in de URL), grafiek met je normaal, highlight,
// slaapfases/trainingen waar relevant, uitleg en bronnen.

import { Pin, PinOff } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from '@/components/ui/Tabs'
import { METRIEKEN, metriekenInGroep } from '@/lib/health/gezondheid-metrics'
import { berekenHighlight } from '@/lib/gezondheid/highlights'
import { berekenNormaal, metingenVoorNormaal } from '@/lib/gezondheid/normaal'
import { bronnenVan, vatMetriekSamen } from '@/lib/gezondheid/samenvatting'
import { PERIODES, bouwTrend, isPeriode, periodeSamenvatting, type Periode } from '@/lib/gezondheid/trends'
import type { GezondheidAntwoord, MetriekSleutel } from '@/lib/gezondheid/types'
import { CompactRegel } from './AlleMetrieken'
import { HighlightLijst } from './HighlightLijst'
import { MetriekWaarde } from './MetriekWaarde'
import { NormaalBlok } from './NormaalBlok'
import { SlaapFasesBlok } from './SlaapFasesBlok'
import { TrendGrafiek } from './TrendGrafiek'
import { WorkoutLijst } from './WorkoutLijst'
import styles from './gezondheid.module.css'

interface MetriekDetailWeergaveProps {
  data: GezondheidAntwoord
  sleutel: MetriekSleutel
  periode: Periode
  onPeriode: (periode: Periode) => void
  isVastgezet: boolean
  onWisselVastgezet: () => void
}

function PeriodeStat({ data, sleutel, periode }: { data: GezondheidAntwoord; sleutel: MetriekSleutel; periode: Periode }) {
  const omschrijving = PERIODES.find((p) => p.waarde === periode)?.omschrijving ?? ''
  const { waarde, dagen } = periodeSamenvatting(bouwTrend(data.dagen, sleutel, periode, data.vandaag), sleutel)
  const isTotaal = METRIEKEN[sleutel].aggregatie === 'totaal'
  return (
    <div className={styles.detailStat}>
      <span className={styles.detailStatLabel}>{isTotaal ? 'Totaal' : 'Gemiddeld per dag'}, {omschrijving}</span>
      {waarde === null
        ? <p className={styles.blokWaarde}>Geen metingen</p>
        : <MetriekWaarde sleutel={sleutel} waarde={waarde} />}
      {waarde !== null && <span className={styles.kleineTekst}>{dagen} {dagen === 1 ? 'dag' : 'dagen'} {isTotaal ? 'met training' : 'met meting'}</span>}
    </div>
  )
}

function Verwant({ data, sleutel }: { data: GezondheidAntwoord; sleutel: MetriekSleutel }) {
  const lijst = metriekenInGroep(METRIEKEN[sleutel].groep)
    .filter((s) => s !== sleutel)
    .map((s) => vatMetriekSamen(data.dagen, s, data.vandaag))
    .filter((s) => s !== null)
  if (lijst.length === 0) return null
  return (
    <section className={styles.sectie} aria-labelledby="kop-verwant">
      <h2 id="kop-verwant" className={styles.sectieKop}>Ook in deze groep</h2>
      <ul className={styles.compactLijst}>
        {lijst.map((s) => <li key={s.sleutel}><CompactRegel s={s} vandaag={data.vandaag} /></li>)}
      </ul>
    </section>
  )
}

export function MetriekDetailWeergave({
  data, sleutel, periode, onPeriode, isVastgezet, onWisselVastgezet,
}: MetriekDetailWeergaveProps) {
  const cfg = METRIEKEN[sleutel]
  const normaal = berekenNormaal(data.dagen, sleutel, data.vandaag)
  const highlight = berekenHighlight(data.dagen, sleutel, data.vandaag)
  const bronnen = bronnenVan(data.dagen, sleutel)

  return (
    <>
      <PeriodeStat data={data} sleutel={sleutel} periode={periode} />

      <TabsRoot value={periode} onValueChange={(w) => { if (isPeriode(w)) onPeriode(w) }}>
        <TabsList aria-label="Periode van de grafiek">
          {PERIODES.map((p) => <TabsTrigger key={p.waarde} value={p.waarde}>{p.label}</TabsTrigger>)}
        </TabsList>
        {PERIODES.map((p) => (
          <TabsContent key={p.waarde} value={p.waarde}>
            <TrendGrafiek
              sleutel={sleutel}
              punten={bouwTrend(data.dagen, sleutel, p.waarde, data.vandaag)}
              normaal={normaal}
              periode={p.waarde}
              omschrijving={`${p.label.toLowerCase()}, ${p.omschrijving}`}
            />
          </TabsContent>
        ))}
      </TabsRoot>

      {highlight && (
        <section className={styles.sectie} aria-label="Wat opvalt">
          <HighlightLijst highlights={[highlight]} metLink={false} />
        </section>
      )}

      <div className={`${styles.sectie} ${styles.tweeKolom}`}>
        <NormaalBlok
          sleutel={sleutel}
          normaal={normaal}
          metingenInVenster={metingenVoorNormaal(data.dagen, sleutel, data.vandaag)}
          samenvatting={vatMetriekSamen(data.dagen, sleutel, data.vandaag)}
          vandaag={data.vandaag}
        />
        <section aria-labelledby="kop-over">
          <h2 id="kop-over" className={styles.blokTitel}>Over {cfg.label.toLowerCase()}</h2>
          <p className={styles.kleineTekst}>{cfg.uitleg}</p>
          {bronnen.length > 0 && (
            <p className={`${styles.kleineTekst} ${styles.hint}`}>Bron: {bronnen.join(', ')}.</p>
          )}
        </section>
      </div>

      {sleutel === 'slaap' && (
        <div className={styles.sectie}><SlaapFasesBlok dagen={data.dagen} vandaag={data.vandaag} /></div>
      )}
      {sleutel === 'workouts' && (
        <div className={styles.sectie}><WorkoutLijst workouts={data.workouts} vandaag={data.vandaag} /></div>
      )}

      <Verwant data={data} sleutel={sleutel} />

      <div className={styles.acties}>
        <Button
          variant="secondary"
          onClick={onWisselVastgezet}
          leftIcon={isVastgezet ? <PinOff size={16} aria-hidden="true" /> : <Pin size={16} aria-hidden="true" />}
        >
          {isVastgezet ? 'Losmaken uit samenvatting' : 'Vastzetten in samenvatting'}
        </Button>
      </div>
    </>
  )
}
