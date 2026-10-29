'use client'

import { Sparkles } from 'lucide-react'
import { soortInfo, type SportschoolSoort } from '@/lib/club/start/soorten'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { tekst as inTaal } from '@/lib/aiyourgym/taal/woordenboek'
import { useTaal } from '@/lib/aiyourgym/taal/client'
import { START } from '@/lib/aiyourgym/taal/woorden/club/start'

// Boven een stap die al is ingevuld vanuit de soort sportschool: een korte
// regel, en daaronder meteen de invoer zelf. Geen samenvatting die de invoer
// verbergt en niets dat pas na een klik verschijnt.

interface AlvastIngevuldProps {
  soort: SportschoolSoort | null
}

/** "Alvast ingevuld voor een pt-studio, pas aan wat niet klopt", of niets zonder soort. */
export function alvastTekst(soort: SportschoolSoort | null, taal: Taal = 'nl'): string | null {
  return soort ? inTaal(START, taal).alvast(soortInfo(soort, taal).lidwoord) : null
}

export function AlvastIngevuld({ soort }: AlvastIngevuldProps) {
  const tekst = alvastTekst(soort, useTaal())
  if (!tekst) return null
  return (
    <p className="club-start-alvast">
      <Sparkles aria-hidden size={16} /> {tekst}
    </p>
  )
}
