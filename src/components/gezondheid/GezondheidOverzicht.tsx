'use client'

// Container voor /gezondheid: haalt de samengevoegde data op, start een stille
// achtergrond-sync met de gekoppelde bron en ververst daarna. De weergave zelf
// is presentational (OverzichtWeergave).

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import { syncGezondheidsdata } from '@/lib/health/health-sync'
import { datumLang } from '@/lib/gezondheid/statistiek'
import type { GezondheidAntwoord } from '@/lib/gezondheid/types'
import { haalGezondheid, type Geladen } from './haal-gezondheid'
import { OverzichtWeergave } from './OverzichtWeergave'
import { OVERZICHT_DAGEN } from './routes'
import { SyncRegel } from './SyncRegel'
import { useVastgezet } from './useVastgezet'
import styles from './gezondheid.module.css'

type Status =
  | { soort: 'laden' }
  | { soort: 'fout'; tekst: string }
  | { soort: 'klaar'; data: GezondheidAntwoord }

export function GezondheidOverzicht() {
  const router = useRouter()
  const { toast } = useToast()
  const { vastgezet } = useVastgezet()
  const [status, setStatus] = useState<Status>({ soort: 'laden' })
  const [syncBezig, setSyncBezig] = useState(false)

  const verwerk = useCallback((uit: Geladen) => {
    if (uit.soort === 'uitgelogd') { router.replace('/login?next=/gezondheid'); return }
    setStatus(uit)
  }, [router])

  useEffect(() => {
    let actief = true
    void haalGezondheid(OVERZICHT_DAGEN).then((uit) => { if (actief) verwerk(uit) })
    // Stille sync (gethrottled in health-sync); alleen bij nieuwe data opnieuw laden.
    void syncGezondheidsdata()
      .then((uitkomst) => (uitkomst && actief ? haalGezondheid(OVERZICHT_DAGEN) : null))
      .then((uit) => { if (uit && actief && uit.soort === 'klaar') verwerk(uit) })
    return () => { actief = false }
  }, [verwerk])

  async function bijwerken() {
    setSyncBezig(true)
    try {
      const uitkomst = await syncGezondheidsdata({ forceer: true })
      const uit = await haalGezondheid(OVERZICHT_DAGEN)
      verwerk(uit)
      if (!uitkomst) toast({ title: 'Geen gekoppelde bron gevonden om bij te werken.', variant: 'warning' })
      else if (uit.soort === 'fout') toast({ title: uit.tekst, variant: 'error' })
    } finally {
      setSyncBezig(false)
    }
  }

  const vandaag = status.soort === 'klaar' ? status.data.vandaag : null

  return (
    <main className={styles.kader}>
      <header>
        <p className={styles.overline}>{vandaag ? datumLang(vandaag) : 'Gezondheid'}</p>
        <h1 className={styles.titel}>Gezondheid</h1>
        <p className={styles.intro}>
          Je metingen van je telefoon of horloge, aangevuld met wat je zelf invoert —
          steeds naast je eigen normaal.
        </p>
        {status.soort === 'klaar' && (
          <SyncRegel bronnen={status.data.bronnen} vandaag={status.data.vandaag} bezig={syncBezig} onBijwerken={() => void bijwerken()} />
        )}
      </header>

      {status.soort === 'laden' && (
        <div className={styles.laden} role="status" aria-busy="true">
          <span className={styles.srOnly}>Je gezondheidsdata wordt geladen…</span>
          <Skeleton width="70%" height={32} />
          <Skeleton width="55%" height={32} />
          <Skeleton width="100%" height={180} radius="var(--radius-lg)" />
          <Skeleton width="100%" height={96} radius="var(--radius-lg)" />
        </div>
      )}

      {status.soort === 'fout' && (
        <div role="alert" className={styles.sectie}>
          <p className={styles.intro}>{status.tekst}</p>
          <Button variant="secondary" className={styles.hint} onClick={() => {
            setStatus({ soort: 'laden' })
            void haalGezondheid(OVERZICHT_DAGEN).then(verwerk)
          }}>
            Opnieuw proberen
          </Button>
        </div>
      )}

      {status.soort === 'klaar' && <OverzichtWeergave data={status.data} vastgezet={vastgezet} />}
    </main>
  )
}
