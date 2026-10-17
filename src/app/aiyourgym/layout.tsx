import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { connection } from 'next/server'
import { eisKane } from '@/lib/club/toegang'
import { siteActief } from '@/lib/aiyourgym/schakelaar'

// De verkoopwebsite van AI Your Gym. Met de schakelaar uit alleen voor Kane
// (anders een gewone 404) en nooit in zoekmachines; zie src/lib/aiyourgym/schakelaar.ts.

export async function generateMetadata(): Promise<Metadata> {
  return siteActief() ? {} : { robots: { index: false, follow: false } }
}

export default async function AiYourGymLayout({ children }: { children: ReactNode }) {
  // Nooit vooraf bouwen: tijdens de build is er geen inlog, dan werd de 404 vastgezet.
  await connection()
  if (!siteActief()) await eisKane()
  return children
}
