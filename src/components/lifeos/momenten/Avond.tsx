import { Kaart, NogNiets } from '@/components/lifeos/os/Kaart'
import { MomentLayout } from './MomentLayout'
import { MeerLade } from './MeerLade'
import { JournalKaart } from '@/components/lifeos/journal/JournalKaart'
import { InboxKaart } from '@/components/lifeos/inbox/InboxKaart'
import { AgendaKaart } from '@/components/lifeos/agenda/AgendaKaart'

// "Hoe ging het, en wat morgen?"
//
// Dragend is de reflectie — het enige wat 's avonds alleen jíj kunt invullen;
// de rest kan een koppeling doen. Ernaast staat wat morgen klaarzet. Inbox-
// triage staat hier en niet in de ochtend als steunkaart: 's ochtends leidt hij
// af van je top-3, 's avonds is het opruimen.
//
// De agenda staat hier bewust nóg een keer (hij staat ook in de ochtend): dat is
// niet dezelfde vraag. 's Ochtends is het "wat wordt vandaag", 's avonds "wat
// staat er morgen". Zelfde kaart, ander moment — geen duplicaat.

export function Avond() {
  return (
    <MomentLayout
      dragend={<JournalKaart />}
      steun={
        <>
          <AgendaKaart />
          <InboxKaart />
          <Kaart titel="Gewoontes" vervangt="Streaks · Habitica">
            <NogNiets wat="Nog geen gewoontes" waarom="Afvinken wat je vandaag gedaan hebt." />
          </Kaart>
        </>
      }
      lade={
        <MeerLade titel="Meer van je avond">
          <Kaart titel="Bedtijd" vervangt="Sleep Cycle · Health" nadruk="compact" niveau={3}>
            <NogNiets wat="Geen bron" waarom="Wat je nu doet, meet je morgenochtend." />
          </Kaart>
          <Kaart titel="Voeding vandaag" vervangt="MyFitnessPal" nadruk="compact" niveau={3}>
            <NogNiets wat="Niets gelogd" waarom="Totaal van de dag, geen oordeel." />
          </Kaart>
          <Kaart titel="Training vandaag" vervangt="Workout logger" nadruk="compact" niveau={3}>
            <NogNiets wat="Niets gelogd" waarom="Wat je deed, en hoe het voelde." />
          </Kaart>
          <Kaart titel="Weekdoelen" vervangt="Notion · Sunsama" nadruk="compact" niveau={3}>
            <NogNiets wat="Nog niet gesteld" waarom="Nog vier dagen te gaan of niet." />
          </Kaart>
        </MeerLade>
      }
    />
  )
}
