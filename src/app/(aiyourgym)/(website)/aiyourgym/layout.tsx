import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { connection } from 'next/server'
import { eisPlatformEigenaar } from '@/lib/club/toegang'
import { aygIndexeren, siteActief } from '@/lib/aiyourgym/schakelaar'

// De verkoopwebsite van AI Your Gym. Met de schakelaar uit alleen voor Kane
// (anders een gewone 404). In zoekmachines alleen als de site actief is EN de
// aparte schakelaar AIYOURGYM_INDEXEREN aan staat; zie src/lib/aiyourgym/schakelaar.ts.

// Obsidian Luxury (besluit Kane 28-10-2026): de site is altijd obsidiaan met warm
// wit, met lichte (ivoren) secties als ritme. Een vast donker kleurenschema, dus de
// browser kleurt niets zelf om; de balk van de telefoon wordt obsidiaan.
export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#0a0a0b',
}

export async function generateMetadata(): Promise<Metadata> {
  return siteActief() && aygIndexeren() ? {} : { robots: { index: false, follow: false } }
}

export default async function AiYourGymLayout({ children }: { children: ReactNode }) {
  // Nooit vooraf bouwen: tijdens de build is er geen inlog, dan werd de 404 vastgezet.
  await connection()
  if (!siteActief()) await eisPlatformEigenaar()
  return children
}
