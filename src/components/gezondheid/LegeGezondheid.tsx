// Lege staat: er is nog geen enkele meting. Eerlijk zeggen wat er nodig is.

import Link from 'next/link'
import { Watch } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import styles from './gezondheid.module.css'

interface LegeGezondheidProps {
  koppelRoute: string
}

export function LegeGezondheid({ koppelRoute }: LegeGezondheidProps) {
  return (
    <section className={styles.sectie} aria-label="Nog geen gezondheidsdata">
      <EmptyState
        icon={Watch}
        title="Nog geen metingen"
        description="Koppel Apple Health, Health Connect of Google Fit. Daarna verschijnen hier je stappen, slaap, hartslag en meer — naast je eigen normaal zodra er genoeg metingen zijn."
        action={
          <Link href={koppelRoute} className={styles.knopLink}>
            Bron koppelen
          </Link>
        }
      />
    </section>
  )
}
