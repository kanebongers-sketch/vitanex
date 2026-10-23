import { AygLogo } from './AygLogo'

// Alleen het beeldmerk van AI Your Gym (het embleem met A I Y G), als sier naast
// zichtbare tekst. Zie AygLogo en de merkgids in docs/aiyourgym/brand/.

interface Props {
  /** Altijd de versie voor een donkere ondergrond (creme plaat). */
  opDonker?: boolean
  className?: string
}

export function AygSymbool({ opDonker = false, className }: Props) {
  return <AygLogo vorm="beeldmerk" opDonker={opDonker} sier className={className} />
}
