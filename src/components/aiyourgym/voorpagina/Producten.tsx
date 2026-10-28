import { AppLessen } from '@/components/aiyourgym/mockups/AppSchermen'
import { Toestel } from '@/components/aiyourgym/mockups/kaders'
import { AppWeek } from '@/components/aiyourgym/mockups/product/AppWeek'
import { LedenkaartScherm } from '@/components/aiyourgym/mockups/product/LedenkaartScherm'
import { SchemaScherm } from '@/components/aiyourgym/mockups/product/SchemaScherm'
import { VandaagScherm } from '@/components/aiyourgym/mockups/product/VandaagScherm'
import { getSiteTaal } from '@/lib/aiyourgym/taal/server'
import { VOORPAGINA } from '@/lib/aiyourgym/taal/woorden/website/voorpagina'
import { aygPad, navLinks } from '../site/paden'
import { Productblok } from './Productblok'

// De vier productblokken na de held: Werkvloer (Vandaag), de ledenkaart,
// trainingsschema's en de ledenapp. Om en om tekst links en scherm rechts, elk
// in een eigen laag obsidiaan. De schermen zijn getekend in de stijl van Club met
// vaste voorbeelddata van Kernhal; de links gaan naar de subpagina met de details.

export async function Producten() {
  const taal = await getSiteTaal()
  const t = VOORPAGINA[taal].producten
  const pad = (sleutel: 'schemas' | 'ledenapp') => navLinks(taal).find((l) => l.sleutel === sleutel)?.pad ?? aygPad('/functies')
  return (
    <>
      <Productblok
        id="vp-werkvloer"
        vlak="vlak"
        kop={t.werkvloer.kop}
        tekst={t.werkvloer.tekst}
        punten={t.werkvloer.punten}
        link={{ label: t.werkvloer.link, pad: aygPad('/functies#beheer') }}
        beeldLabel={t.werkvloer.beeldLabel}
      >
        <VandaagScherm />
      </Productblok>
      <Productblok
        id="vp-ledenkaart"
        vlak="basis"
        spiegel
        kop={t.ledenkaart.kop}
        tekst={t.ledenkaart.tekst}
        punten={t.ledenkaart.punten}
        link={{ label: t.ledenkaart.link, pad: aygPad('/functies#betrokkenheid') }}
        beeldLabel={t.ledenkaart.beeldLabel}
      >
        <LedenkaartScherm />
      </Productblok>
      <Productblok
        id="vp-schemas"
        vlak="hoog"
        kop={t.schemas.kop}
        tekst={t.schemas.tekst}
        punten={t.schemas.punten}
        link={{ label: t.schemas.link, pad: pad('schemas') }}
        beeldLabel={t.schemas.beeldLabel}
      >
        <SchemaScherm />
      </Productblok>
      <Productblok
        id="vp-ledenapp"
        vlak="vlak"
        spiegel
        vorm="telefoon"
        kop={t.ledenapp.kop}
        tekst={t.ledenapp.tekst}
        punten={t.ledenapp.punten}
        link={{ label: t.ledenapp.link, pad: pad('ledenapp') }}
        beeldLabel={t.ledenapp.beeldLabel}
      >
        <div className="vp-telefoons">
          <Toestel tab="Lessen" className="vp-telefoon-achter">
            <AppLessen />
          </Toestel>
          <Toestel tab="Home" className="vp-telefoon-voor">
            <AppWeek />
          </Toestel>
        </div>
      </Productblok>
    </>
  )
}
