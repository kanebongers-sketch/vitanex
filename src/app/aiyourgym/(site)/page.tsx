import type { Metadata } from 'next'
import { Fundament } from '@/components/aiyourgym/home/Fundament'
import { Held } from '@/components/aiyourgym/home/Held'
import { Huisstijl } from '@/components/aiyourgym/home/Huisstijl'
import { Onderdelen } from '@/components/aiyourgym/home/Onderdelen'
import { Overstap, PakkettenKort } from '@/components/aiyourgym/home/Pakketten'
import { Planning } from '@/components/aiyourgym/home/Planning'
import { Training } from '@/components/aiyourgym/home/Training'
import { Werkvloer } from '@/components/aiyourgym/home/Werkvloer'
import { AanmeldBand } from '@/components/aiyourgym/site/AanmeldBand'

export const metadata: Metadata = {
  title: { absolute: 'AI Your Gym | Clubsoftware voor sportscholen' },
  description:
    "Check-in, groepslessen, personeelsrooster, trainingsschema's met coaching per oefening en een ledenapp in je eigen huisstijl. Clubsoftware voor sportscholen, met data in de EU.",
}

export default function AiYourGymHome() {
  return (
    <>
      <Held />
      <Onderdelen />
      <Training />
      <Werkvloer />
      <Huisstijl />
      <Planning />
      <Fundament />
      <Overstap />
      <PakkettenKort />
      <AanmeldBand />
    </>
  )
}
