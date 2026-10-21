import type { Metadata } from 'next'
import { Held } from '@/components/aiyourgym/home/Held'
import { Oogopslag } from '@/components/aiyourgym/home/Oogopslag'
import { Praktijk } from '@/components/aiyourgym/home/Praktijk'
import { Schemas } from '@/components/aiyourgym/home/Schemas'
import { AanmeldBand } from '@/components/aiyourgym/site/AanmeldBand'

export const metadata: Metadata = {
  title: { absolute: 'AI Your Gym | Clubsoftware voor sportscholen' },
  description:
    "Balie, vloer, trainers, eigenaar en leden in een systeem, met trainingsschema's zoals een trainer ze geeft: coaching en een 3D-beeld bij elke oefening. Clubsoftware voor elk soort sportschool, met data in de EU.",
}

// Kort en gericht op aanmelden (besluit Kane 21-10-2026): de belofte met twee
// routes en het product, wat het is in een oogopslag, trainingsschema's met
// 3D als blikvanger, wie het bouwt en de afsluitende oproep. De details staan
// op de subpagina's (functies, trainingsschema's, ledenapp, voor wie, overstappen).
export default function AiYourGymHome() {
  return (
    <>
      <Held />
      <Oogopslag />
      <Schemas />
      <Praktijk />
      <AanmeldBand />
    </>
  )
}
