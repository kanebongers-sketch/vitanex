'use client'

// Wanneer is er voor het laatst gesynchroniseerd, en een knop om het nu te doen.

import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { BRON_LABELS, TIJDZONE, lokaleDatum } from '@/lib/gezondheid/samenvoegen'
import { datumKort } from '@/lib/gezondheid/statistiek'
import type { BronStatus } from '@/lib/gezondheid/types'
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

function beschrijf(status: BronStatus, vandaag: string): string {
  const iso = status.laatsteSync ?? ''
  const tijd = new Intl.DateTimeFormat('nl-NL', { timeZone: TIJDZONE, hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
  const datum = lokaleDatum(iso)
  const wanneer = datum === vandaag ? `vandaag om ${tijd}` : `${datum ? datumKort(datum) : ''} om ${tijd}`
  return `Bijgewerkt ${wanneer} via ${BRON_LABELS[status.bron] ?? status.bron}`
}

export function SyncRegel({ bronnen, vandaag, bezig, onBijwerken }: SyncRegelProps) {
  const recent = laatsteSync(bronnen)
  return (
    <div className={styles.statusRegel}>
      <span aria-live="polite">
        {bezig ? 'Bezig met bijwerken…' : recent ? beschrijf(recent, vandaag) : 'Nog geen automatische synchronisatie'}
      </span>
      <Button variant="ghost" size="sm" loading={bezig} onClick={onBijwerken} leftIcon={<RefreshCw size={15} aria-hidden="true" />}>
        Nu bijwerken
      </Button>
    </div>
  )
}
