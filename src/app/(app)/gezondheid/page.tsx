import type { Metadata } from 'next'
import Navbar from '@/components/layout/Navbar'
import { GezondheidOverzicht } from '@/components/gezondheid/GezondheidOverzicht'

export const metadata: Metadata = {
  title: 'Gezondheid – MentaForce',
  description: 'Stappen, slaap, hartslag en meer uit je gekoppelde bron, steeds naast je eigen normaal.',
  robots: { index: false, follow: false },
}

export default function GezondheidPagina() {
  return (
    <div style={{ background: 'var(--bg-app)', minHeight: '100vh' }}>
      <Navbar />
      <GezondheidOverzicht />
    </div>
  )
}
