import type { Metadata } from 'next'
import { Held } from '@/components/aiyourgym/home/Held'
import { HomeVragen } from '@/components/aiyourgym/home/HomeVragen'
import { Oogopslag } from '@/components/aiyourgym/home/Oogopslag'
import { OokGeregeld } from '@/components/aiyourgym/home/OokGeregeld'
import { Praktijk } from '@/components/aiyourgym/home/Praktijk'
import { Schemas } from '@/components/aiyourgym/home/Schemas'
import { SoortKeuze } from '@/components/aiyourgym/home/SoortKeuze'
import { WelNietKort } from '@/components/aiyourgym/home/WelNietKort'
import { AanmeldBand } from '@/components/aiyourgym/site/AanmeldBand'

export const metadata: Metadata = {
  title: { absolute: 'AI Your Gym | Clubsoftware voor sportscholen' },
  description:
    "Balie, vloer, trainers, eigenaar en leden in een systeem, met trainingsschema's zoals een trainer ze geeft: coaching en een bewegend beeld bij elke oefening. Clubsoftware voor elk soort sportschool, met data in de EU.",
}

// Kort en gericht op aanmelden (besluit Kane 21-10-2026): de belofte met twee
// routes en het product, een snelle keuze per soort sportschool, wat het is in
// een oogopslag, trainingsschema's met 3D als blikvanger, ledenapp en
// overstappen als twee korte vakken, Kane kort, eerlijk wat het wel en niet
// doet, vier vragen en de afsluitende oproep. De details staan op de
// subpagina's (functies, trainingsschema's, ledenapp, voor wie, overstappen).
// .ayg-home geeft de voorpagina een strakker ritme dan de subpagina's.
export default function AiYourGymHome() {
  return (
    <div className="ayg-home">
      <Held />
      <SoortKeuze />
      <Oogopslag />
      <Schemas />
      <OokGeregeld />
      <Praktijk />
      <WelNietKort />
      <HomeVragen />
      <AanmeldBand />
    </div>
  )
}
