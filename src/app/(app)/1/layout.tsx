import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Vandaag – MentaForce',
  description: 'Elke ochtend weet je wat vandaag telt: één kaart op basis van je slaap, je check-in en je plan.',
  robots: { index: false, follow: false },
}

export default function VandaagLayout({ children }: { children: React.ReactNode }) {
  return children
}
