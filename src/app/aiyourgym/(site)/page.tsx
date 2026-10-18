import type { Metadata } from 'next'
import { EenSysteem } from '@/components/aiyourgym/home/EenSysteem'
import { Fundament } from '@/components/aiyourgym/home/Fundament'
import { Held } from '@/components/aiyourgym/home/Held'
import { Herkenbaar } from '@/components/aiyourgym/home/Herkenbaar'
import { Huisstijl } from '@/components/aiyourgym/home/Huisstijl'
import { Onderdelen } from '@/components/aiyourgym/home/Onderdelen'
import { PakkettenKort } from '@/components/aiyourgym/home/Pakketten'
import { Planning } from '@/components/aiyourgym/home/Planning'
import { Praktijk } from '@/components/aiyourgym/home/Praktijk'
import { StartStappen } from '@/components/aiyourgym/home/StartStappen'
import { Schemas } from '@/components/aiyourgym/home/Schemas'
import { Veelgesteld } from '@/components/aiyourgym/home/Veelgesteld'
import { Veilig } from '@/components/aiyourgym/home/Veilig'
import { Vergelijking } from '@/components/aiyourgym/home/Vergelijking'
import { VoorWieKort } from '@/components/aiyourgym/home/VoorWieKort'
import { Werkvloer } from '@/components/aiyourgym/home/Werkvloer'
import { AanmeldBand } from '@/components/aiyourgym/site/AanmeldBand'

export const metadata: Metadata = {
  title: { absolute: 'AI Your Gym | Clubsoftware voor sportscholen' },
  description:
    "Balie, vloer, trainers, eigenaar en leden in een systeem, met trainingsschema's zoals een trainer ze geeft: coaching bij elke oefening. Clubsoftware voor elk soort sportschool, met data in de EU.",
}

// Volgorde, gericht op aanmelden: belofte met twee routes (proberen of een demo
// plannen), dan de twee hoofdpunten waar het om draait: alles in een systeem
// en trainingsschema's zoals een trainer ze geeft. Daarna herkenbare pijn met
// de oplossing, de vijf hoofdstukken, de werkvloer, wie het bouwt en wat we beloven, het verschil
// zonder en met, voor wie, de ledenapp, planning, hoe je start, veiligheid,
// fundament, pakketten en de bezwaren in de vragen. Na elke grote sectie de knop.
export default function AiYourGymHome() {
  return (
    <>
      <Held />
      <EenSysteem />
      <Schemas />
      <Herkenbaar />
      <Onderdelen />
      <Werkvloer />
      <Praktijk />
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
