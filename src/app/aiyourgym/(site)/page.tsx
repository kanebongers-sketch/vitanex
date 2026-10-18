import type { Metadata } from 'next'
import { Fundament } from '@/components/aiyourgym/home/Fundament'
import { Held } from '@/components/aiyourgym/home/Held'
import { Herkenbaar } from '@/components/aiyourgym/home/Herkenbaar'
import { Huisstijl } from '@/components/aiyourgym/home/Huisstijl'
import { Onderdelen } from '@/components/aiyourgym/home/Onderdelen'
import { PakkettenKort } from '@/components/aiyourgym/home/Pakketten'
import { Planning } from '@/components/aiyourgym/home/Planning'
import { StartStappen } from '@/components/aiyourgym/home/StartStappen'
import { Training } from '@/components/aiyourgym/home/Training'
import { Veelgesteld } from '@/components/aiyourgym/home/Veelgesteld'
import { Veilig } from '@/components/aiyourgym/home/Veilig'
import { Vergelijking } from '@/components/aiyourgym/home/Vergelijking'
import { VoorWieKort } from '@/components/aiyourgym/home/VoorWieKort'
import { Werkvloer } from '@/components/aiyourgym/home/Werkvloer'
import { AanmeldBand } from '@/components/aiyourgym/site/AanmeldBand'

export const metadata: Metadata = {
  title: { absolute: 'AI Your Gym | Clubsoftware voor sportscholen' },
  description:
    "Check-in, groepslessen, personeelsrooster, trainingsschema's met coaching per oefening en een ledenapp in je eigen huisstijl. Clubsoftware voor elk soort sportschool, met data in de EU.",
}

// Volgorde, gericht op aanmelden: belofte met knoppen, herkenbare pijn met de
// oplossing, wat erin zit, het hart (coaching), de werkvloer, het verschil
// zonder en met, voor wie, de ledenapp, planning, hoe je start, veiligheid,
// fundament, pakketten en de bezwaren in de vragen. Na elke grote sectie de knop.
export default function AiYourGymHome() {
  return (
    <>
      <Held />
      <Herkenbaar />
      <Onderdelen />
      <Training />
      <Werkvloer />
      <Vergelijking />
      <VoorWieKort />
      <Huisstijl />
      <Planning />
      <StartStappen />
      <Veilig />
      <Fundament />
      <PakkettenKort />
      <Veelgesteld />
      <AanmeldBand />
    </>
  )
}
