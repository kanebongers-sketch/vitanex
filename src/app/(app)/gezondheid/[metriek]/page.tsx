import { Suspense } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import { MetriekDetail } from '@/components/gezondheid/MetriekDetail'
import { METRIEKEN } from '@/lib/health/gezondheid-metrics'
import { isMetriekSleutel } from '@/lib/gezondheid/types'

interface MetriekPaginaProps {
  params: Promise<{ metriek: string }>
}

export async function generateMetadata({ params }: MetriekPaginaProps): Promise<Metadata> {
  const { metriek } = await params
  if (!isMetriekSleutel(metriek)) return { title: 'Gezondheid – MentaForce' }
  const cfg = METRIEKEN[metriek]
  return {
    title: `${cfg.label} – Gezondheid – MentaForce`,
    description: `${cfg.label} per dag, week en maand, naast je eigen normaal.`,
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
