import { Suspense } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import { MetriekDetail } from '@/components/gezondheid/MetriekDetail'
import { metriekLabel } from '@/lib/health/gezondheid-metrics'
import { isMetriekSleutel } from '@/lib/gezondheid/types'
import { huidigeTaalset } from '@/lib/i18n/server'

interface MetriekPaginaProps {
  params: Promise<{ metriek: string }>
}

export async function generateMetadata({ params }: MetriekPaginaProps): Promise<Metadata> {
  const { metriek } = await params
  const ts = await huidigeTaalset()
  if (!isMetriekSleutel(metriek)) return { title: ts.t('lichaam.meta.gezondheidTitel') }
  const label = metriekLabel(metriek, ts)
  return {
    title: ts.t('lichaam.meta.metriekTitel', { label }),
    description: ts.t('lichaam.meta.metriekOmschrijving', { label }),
    robots: { index: false, follow: false },
  }
}

export default async function MetriekPagina({ params }: MetriekPaginaProps) {
  const { metriek } = await params
  if (!isMetriekSleutel(metriek)) notFound()

  return (
    <div style={{ background: 'var(--bg-app)', minHeight: '100vh' }}>
      <Navbar />
      {/* useSearchParams (periode in de URL) vraagt om een Suspense-grens. */}
      <Suspense fallback={null}>
        <MetriekDetail sleutel={metriek} />
      </Suspense>
    </div>
  )
}
