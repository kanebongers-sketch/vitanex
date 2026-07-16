import { Kaart, NogNiets } from '@/components/lifeos/os/Kaart'
import { MomentLayout } from './MomentLayout'
import { MeerLade } from './MeerLade'
import { FocusKaart } from '@/components/lifeos/focus/FocusKaart'
import { BrainDumpKaart } from '@/components/lifeos/notities/BrainDumpKaart'
import { WaterKaart } from '@/components/lifeos/voeding/WaterKaart'
import { VoedingKaart } from '@/components/lifeos/voeding/VoedingKaart'
import { MacrosKaart } from '@/components/lifeos/voeding/MacrosKaart'
import { TrainingKaart } from '@/components/lifeos/training/TrainingKaart'

// "Wat doe ik dit uur?"
//
// Het enige moment dat over dóen gaat in plaats van over kijken. Dragend is het
// focusblok; de steunkaarten zijn alle drie capture: iets uit je hoofd, iets uit
// je dag, iets uit je training. Geen Vita-band — Vita ziet je dag aankomen
// ('s ochtends) en terug ('s avonds), maar hij hoort niet in je focusuur te
// praten.
//
// Focus werkt al: die heeft geen database nodig (en hoort er ook geen te hebben
// — een blok dat je gisteren begon is geen blok). De rest wacht op een bron en
// toont zolang een eerlijke lege staat.

export function Nu() {
  return (
    <MomentLayout
      dragend={<FocusKaart />}
      steun={
        <>
          <BrainDumpKaart />
          <WaterKaart />
          <TrainingKaart />
        </>
      }
      lade={
        <MeerLade titel="Meer van dit uur">
          <VoedingKaart />
          <MacrosKaart />
          <Kaart titel="Stappen" vervangt="Health · Fitbit" nadruk="compact" niveau={3}>
            <NogNiets wat="Geen bron" waarom="Komt mee met je wearable." />
          </Kaart>
          <Kaart titel="Gewoontes" vervangt="Streaks · Habitica" nadruk="compact" niveau={3}>
            <NogNiets wat="Nog geen gewoontes" waarom="Klein en dagelijks, of het werkt niet." />
          </Kaart>
          <Kaart titel="Straks" vervangt="Calendar" nadruk="compact" niveau={3}>
            <NogNiets wat="Agenda niet gekoppeld" waarom="Je volgende afspraak, meer niet." />
          </Kaart>
        </MeerLade>
      }
    />
  )
}
