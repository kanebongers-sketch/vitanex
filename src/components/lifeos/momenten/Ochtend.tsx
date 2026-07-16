import { Kaart, NogNiets } from '@/components/lifeos/os/Kaart'
import { MomentLayout } from './MomentLayout'
import { MeerLade } from './MeerLade'
import { HerstelPaneel } from '@/components/lifeos/herstel/HerstelPaneel'
import { AgendaKaart } from '@/components/lifeos/agenda/AgendaKaart'
import { Top3Kaart } from '@/components/lifeos/taken/Top3Kaart'
import { VitaKaart } from '@/components/lifeos/vita/VitaKaart'

// "Hoe sta ik ervoor en wat wordt vandaag?"
//
// Dragend is herstel: het kleurt de rest van de dag, en het is het enige wat al
// vaststaat als je wakker wordt. Agenda en top-3 staan ernaast. Vita krijgt de
// volle band eronder — hij is niet nóg een widget, hij legt het verband tussen
// de kaarten erboven.
//
// De vier kaarten hieronder zijn client-eilanden: `getAuthenticatedUser` leest
// een Bearer-header en er is geen cookie-sessie, dus een Server Component kent
// de gebruiker niet. Dit paneel zelf blijft wél een Server Component — de
// grens ligt zo laag mogelijk.
//
// De kaarten in de lade hebben nog geen databron en tonen een eerlijke lege
// staat. Géén voorbeeldcijfers: een demo-getal dat op een meting lijkt is
// precies de leugen die we in MentaForce hebben opgeruimd.

export function Ochtend() {
  return (
    <MomentLayout
      dragend={<HerstelPaneel />}
      steun={
        <>
          <AgendaKaart />
          <Top3Kaart />
        </>
      }
      verbindt={
        // De enige kaart zonder vervangt-label. Vita vervangt geen app; hij is
        // de reden dat de rest in één app hoort staan (README §Vita).
        <VitaKaart nadruk="normaal" />
      }
      lade={
        <MeerLade titel="Meer van je ochtend">
          <Kaart titel="Stemming" vervangt="Daylio" nadruk="compact" niveau={3}>
            <NogNiets wat="Niet gelogd" waarom="Eén tik. Pas over weken zegt het iets." />
          </Kaart>
          <Kaart titel="Gewicht" vervangt="Withings · Health" nadruk="compact" niveau={3}>
            <NogNiets wat="Geen weging" waarom="Trend over 7 dagen, niet het cijfer van vandaag." />
          </Kaart>
          <Kaart titel="Weekdoelen" vervangt="Notion · Sunsama" nadruk="compact" niveau={3}>
            <NogNiets wat="Nog niet gesteld" waarom="Waar je top-3 vandaan komt." />
          </Kaart>
          <Kaart titel="Inbox-triage" vervangt="Gmail openen" nadruk="compact" niveau={3}>
            <NogNiets wat="Niet gekoppeld" waarom="Wie vraagt vandaag iets van je. Geen mailclient." />
          </Kaart>
        </MeerLade>
      }
    />
  )
}
