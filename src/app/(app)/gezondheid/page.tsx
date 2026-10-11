import type { Metadata } from 'next'
import Navbar from '@/components/layout/Navbar'
import { GezondheidOverzicht } from '@/components/gezondheid/GezondheidOverzicht'
import { huidigeTaalset } from '@/lib/i18n/server'

export async function generateMetadata(): Promise<Metadata> {
  const ts = await huidigeTaalset()
  return {
    title: ts.t('lichaam.meta.gezondheidTitel'),
    description: ts.t('lichaam.meta.gezondheidOmschrijving'),
    robots: { index: false, follow: false },
  }
}

export default function GezondheidPagina() {
  return (
    <div style={{ background: 'var(--bg-app)', minHeight: '100vh' }}>
      <Navbar />
      <GezondheidOverzicht />
    </div>
  )
}
