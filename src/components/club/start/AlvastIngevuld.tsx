import { Sparkles } from 'lucide-react'
import { SOORT_INFO, type SportschoolSoort } from '@/lib/club/start/soorten'

// Boven een stap die al is ingevuld vanuit de soort sportschool: een korte
// regel, en daaronder meteen de invoer zelf. Geen samenvatting die de invoer
// verbergt en niets dat pas na een klik verschijnt.

interface AlvastIngevuldProps {
  soort: SportschoolSoort | null
}

/** "Alvast ingevuld voor een pt-studio, pas aan wat niet klopt", of niets zonder soort. */
export function alvastTekst(soort: SportschoolSoort | null): string | null {
  return soort ? `Alvast ingevuld voor een ${SOORT_INFO[soort].titel.toLowerCase()}, pas aan wat niet klopt.` : null
}

export function AlvastIngevuld({ soort }: AlvastIngevuldProps) {
  const tekst = alvastTekst(soort)
  if (!tekst) return null
  return (
    <p className="club-start-alvast">
      <Sparkles aria-hidden size={16} /> {tekst}
    </p>
  )
}
