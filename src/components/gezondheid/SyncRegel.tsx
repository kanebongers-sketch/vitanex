'use client'

// Wanneer is er voor het laatst gesynchroniseerd, en een knop om het nu te doen.

import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { TIJDZONE, bronLabel, lokaleDatum } from '@/lib/gezondheid/samenvoegen'
import { datumKort } from '@/lib/gezondheid/statistiek'
import type { BronStatus } from '@/lib/gezondheid/types'
import type { Taalset } from '@/lib/i18n/taalset'
import { useTaalset } from './useTaalset'
import styles from './gezondheid.module.css'

interface SyncRegelProps {
  bronnen: readonly BronStatus[]
  vandaag: string
  bezig: boolean
  onBijwerken: () => void
}

function laatsteSync(bronnen: readonly BronStatus[]): BronStatus | null {
  return bronnen
    .filter((b) => b.laatsteSync !== null)
    .reduce<BronStatus | null>((recent, b) => (!recent || (b.laatsteSync ?? '') > (recent.laatsteSync ?? '') ? b : recent), null)
}

function beschrijf(status: BronStatus, vandaag: string, ts: Taalset): string {
  const iso = status.laatsteSync ?? ''
  const tijd = new Intl.DateTimeFormat(ts.locale, { timeZone: TIJDZONE, hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
  const datum = lokaleDatum(iso)
  const bron = bronLabel(status.bron, ts)
  if (datum === vandaag) return ts.t('lichaam.sync.vandaag', { tijd, bron })
  return ts.t('lichaam.sync.opDatum', { datum: datum ? datumKort(datum, ts) : '', tijd, bron })
}

export function SyncRegel({ bronnen, vandaag, bezig, onBijwerken }: SyncRegelProps) {
  const ts = useTaalset()
  const recent = laatsteSync(bronnen)
  return (
    <div className={styles.statusRegel}>
      <span aria-live="polite">
        {bezig ? ts.t('lichaam.sync.bezig') : recent ? beschrijf(recent, vandaag, ts) : ts.t('lichaam.sync.nooit')}
      </span>
      <Button variant="ghost" size="sm" loading={bezig} onClick={onBijwerken} leftIcon={<RefreshCw size={15} aria-hidden="true" />}>
        {ts.t('lichaam.sync.nu')}
      </Button>
    </div>
  )
}
