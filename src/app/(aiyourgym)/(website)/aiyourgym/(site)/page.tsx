import type { Metadata } from 'next'
import { Held } from '@/components/aiyourgym/home/Held'
import { HomeVragen } from '@/components/aiyourgym/home/HomeVragen'
import { Ledenapp } from '@/components/aiyourgym/home/Ledenapp'
import { Oogopslag } from '@/components/aiyourgym/home/Oogopslag'
import { Overstappen } from '@/components/aiyourgym/home/Overstappen'
import { Praktijk } from '@/components/aiyourgym/home/Praktijk'
import { Schemas } from '@/components/aiyourgym/home/Schemas'
import { WelNiet } from '@/components/aiyourgym/home/WelNiet'
import { AanmeldBand } from '@/components/aiyourgym/site/AanmeldBand'

export const metadata: Metadata = {
  title: { absolute: 'AI Your Gym | Clubsoftware voor sportscholen' },
  description:
    "Balie, vloer, trainers, eigenaar en leden in een systeem, met trainingsschema's zoals een trainer ze geeft: coaching en een 3D-beeld bij elke oefening. Clubsoftware voor elk soort sportschool, met data in de EU.",
}

// Kort en gericht op aanmelden (besluit Kane 21-10-2026): de belofte met twee
// routes en het product, wat het is in een oogopslag, trainingsschema's met
// 3D als blikvanger, de ledenapp, wie het bouwt en waarom, eerlijk wat het wel
// en niet doet, overstappen in drie stappen, ingeklapte vragen en de afsluitende oproep. De details staan op de subpagina's
// (functies, trainingsschema's, ledenapp, voor wie, overstappen).
export default function AiYourGymHome() {
  return (
    <>
      <Held />
      <Oogopslag />
      <Schemas />
      <Ledenapp />
      <Praktijk />
      <WelNiet />
      <Overstappen />
      <HomeVragen />
      <AanmeldBand />
    </>
  )
}
