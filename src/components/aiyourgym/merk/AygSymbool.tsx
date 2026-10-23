import { AygLogo } from './AygLogo'

// Alleen het beeldmerk van AI Your Gym (de tegel met de figuur), als sier naast
// zichtbare tekst. Zie AygLogo en de merkgids in docs/aiyourgym/brand/.

interface Props {
  /** Altijd de donkere versie (smaragd tegel). */
  opDonker?: boolean
  className?: string
}

export function AygSymbool({ opDonker = false, className }: Props) {
  return <AygLogo vorm="beeldmerk" opDonker={opDonker} sier className={className} />
}
