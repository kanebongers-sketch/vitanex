'use client'

// Container voor /gezondheid/[metriek]: haalt een jaar data op, bewaart de
// gekozen periode in de URL (?periode=week) en beheert het vastzetten.

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import { METRIEKEN, groepLabel, metriekLabel } from '@/lib/health/gezondheid-metrics'
import { isPeriode, type Periode } from '@/lib/gezondheid/trends'
import type { GezondheidAntwoord, MetriekSleutel } from '@/lib/gezondheid/types'
import { haalGezondheid, type Geladen } from './haal-gezondheid'
import { useTaalset } from './useTaalset'
import { MetriekDetailWeergave } from './MetriekDetailWeergave'
import { DETAIL_DAGEN } from './routes'
import { useVastgezet } from './useVastgezet'
import styles from './gezondheid.module.css'

type Status =
  | { soort: 'laden' }
  | { soort: 'fout'; tekst: string }
  | { soort: 'klaar'; data: GezondheidAntwoord }

interface MetriekDetailProps {
  sleutel: MetriekSleutel
}

export function MetriekDetail({ sleutel }: MetriekDetailProps) {
  const router = useRouter()
  const zoek = useSearchParams()
  const { toast } = useToast()
  const ts = useTaalset()
  const { vastgezet, wissel } = useVastgezet()
  const [status, setStatus] = useState<Status>({ soort: 'laden' })
  const cfg = METRIEKEN[sleutel]
  const label = metriekLabel(sleutel, ts)
  const periodeParam = zoek.get('periode')
  const periode: Periode = isPeriode(periodeParam) ? periodeParam : 'dag'

  const verwerk = useCallback((uit: Geladen) => {
    if (uit.soort === 'uitgelogd') { router.replace(`/login?next=/gezondheid/${sleutel}`); return }
    setStatus(uit)
  }, [router, sleutel])

  useEffect(() => {
    let actief = true
    void haalGezondheid(DETAIL_DAGEN, ts).then((uit) => { if (actief) verwerk(uit) })
    return () => { actief = false }
  }, [verwerk, ts])

  function kiesPeriode(nieuw: Periode) {
    router.replace(`/gezondheid/${sleutel}${nieuw === 'dag' ? '' : `?periode=${nieuw}`}`, { scroll: false })
  }

  function wisselVastgezet() {
    const wasVastgezet = vastgezet.includes(sleutel)
    if (!wissel(sleutel)) {
      toast({ title: ts.t('lichaam.detail.opslaanMislukt'), variant: 'error' })
      return
    }
    toast({ title: ts.t(wasVastgezet ? 'lichaam.detail.losgemaakt' : 'lichaam.detail.vastgezet', { label }), variant: 'success' })
  }

  return (
    <main className={styles.kader}>
      <Link href="/gezondheid" className={styles.terug}>
        <ArrowLeft size={16} aria-hidden="true" /> {ts.t('lichaam.overzicht.titel')}
      </Link>
      <header>
        <p className={styles.overline}>{groepLabel(cfg.groep, ts)}</p>
        <h1 className={`${styles.titel} ${styles.titelDetail}`}>{label}</h1>
      </header>

      {status.soort === 'laden' && (
        <div className={styles.laden} role="status" aria-busy="true">
          <span className={styles.srOnly}>{ts.t('lichaam.detail.laden', { label })}</span>
          <Skeleton width="40%" height={48} />
          <Skeleton width="100%" height={40} />
          <Skeleton width="100%" height={240} radius="var(--radius-lg)" />
        </div>
      )}

      {status.soort === 'fout' && (
        <div role="alert" className={styles.sectie}>
          <p className={styles.intro}>{status.tekst}</p>
          <Button variant="secondary" className={styles.hint} onClick={() => {
            setStatus({ soort: 'laden' })
            void haalGezondheid(DETAIL_DAGEN, ts).then(verwerk)
          }}>
            {ts.t('lichaam.opnieuw')}
          </Button>
        </div>
      )}

      {status.soort === 'klaar' && (
        <MetriekDetailWeergave
          data={status.data}
          sleutel={sleutel}
          periode={periode}
          onPeriode={kiesPeriode}
          isVastgezet={vastgezet.includes(sleutel)}
          onWisselVastgezet={wisselVastgezet}
        />
      )}
    </main>
  )
}
