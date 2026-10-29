import { Oproep } from '@/components/aiyourgym/voorpagina/Oproep'

interface Props {
  /** Bleef voor oudere aanroepen; de oproep heeft overal dezelfde zin (richting Kleurhoofdstukken). */
  titel?: string
}

// De afsluitende oproep onderaan elke pagina: hetzelfde hoofdstuk als op de
// voorpagina (een zin met een gat voor de naam van je club), zodat elke pagina op
// dezelfde manier eindigt.
export async function AanmeldBand(_props: Props) {
  return <Oproep />
}
