import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { connection } from 'next/server'
import { eisKane } from '@/lib/club/toegang'
import { aygIndexeren, siteActief } from '@/lib/aiyourgym/schakelaar'

// De verkoopwebsite van AI Your Gym. Met de schakelaar uit alleen voor Kane
// (anders een gewone 404). In zoekmachines alleen als de site actief is EN de
// aparte schakelaar AIYOURGYM_INDEXEREN aan staat; zie src/lib/aiyourgym/schakelaar.ts.

// Altijd licht: ook als de browser websites zelf donker maakt (donkere modus,
// Dark Reader), anders wordt de achtergrond donker en blijft de inkt donker.
export const viewport: Viewport = { colorScheme: 'only light', themeColor: '#f2f0e9' }

export async function generateMetadata(): Promise<Metadata> {
  return siteActief() && aygIndexeren() ? {} : { robots: { index: false, follow: false } }
}

export default async function AiYourGymLayout({ children }: { children: ReactNode }) {
  // Nooit vooraf bouwen: tijdens de build is er geen inlog, dan werd de 404 vastgezet.
  await connection()
  if (!siteActief()) await eisKane()
  return children
}
