// Lege staat: er is nog geen enkele meting. Eerlijk zeggen wat er nodig is.

import Link from 'next/link'
import { Watch } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { useVertaling } from '@/lib/i18n/TaalProvider'
import styles from './gezondheid.module.css'

interface LegeGezondheidProps {
  koppelRoute: string
}

export function LegeGezondheid({ koppelRoute }: LegeGezondheidProps) {
  const { t } = useVertaling()
  return (
    <section className={styles.sectie} aria-label={t('lichaam.leeg.aria')}>
      <EmptyState
        icon={Watch}
        title={t('lichaam.leeg.titel')}
        headingLevel={2}
        description={t('lichaam.leeg.tekst')}
        action={
          <Link href={koppelRoute} className={styles.knopLink}>
            {t('lichaam.leeg.koppelen')}
          </Link>
        }
      />
    </section>
  )
}
