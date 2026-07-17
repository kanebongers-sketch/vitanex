import { JournalKaart } from '@/components/lifeos/journal/JournalKaart'
import { GezondheidDomein } from './GezondheidDomein'
import { ProductiviteitDomein } from './ProductiviteitDomein'
import { GroeiDomein } from './GroeiDomein'
import { BusinessDomein } from './BusinessDomein'

// ─── Mijn leven ─────────────────────────────────────────────────────────────
// De cockpit is ingedeeld per TOOL: een kaart voor water, een voor taken, een
// voor je agenda. Dat werkt als je iets wíl doen. Het beantwoordt alleen niet de
// vraag waar een Life OS eigenlijk voor bestaat: hoe staat mijn leven ervoor?
//
// Dit is die tweede indeling — per DOMEIN, één trap boven de tools. Vier
// uitsneden, elk met de vraag "hoe staat dit ervoor, en weet ik dat eigenlijk
// wel?".
//
// Server Component: alleen indeling, geen state. Drie domeinen zijn hun eigen
// client-eiland dat zichzelf ophaalt; Business haalt niets op, want er is niets.
//
// ── Over de compositie ──────────────────────────────────────────────────────
// Bewust géén raster van vier gelijke vakjes. Dat is de template-look die de
// regels verbieden, en het zou liegen over de rangorde: Gezondheid heeft zes
// pijlers en drie bronnen, Business heeft nul. Dus:
//
//   1. Gezondheid over de volle breedte — het rijkste domein draagt het overzicht.
//   2. Productiviteit naast Persoonlijke groei — twee gelijkwaardige kolommen.
//      De journal-kaart staat ónder het groei-domein: het domein is de lens, de
//      kaart is het gereedschap. (Die kaart bestond al maar werd nergens
//      geïmporteerd — reflectiedata die je nooit te zien kreeg.)
//   3. Business over de volle breedte — niet om een leeg domein op te blazen,
//      maar omdat "waarom staat hier niets en wat is ervoor nodig" ruimte kost
//      om eerlijk op te schrijven.
//
// Zoals `Kaart` weten de domeinen zelf niets van deze plaatsing: de grid-klassen
// zitten hier, niet in de componenten.

export function MijnLeven() {
  return (
    <section className="os-leven" aria-labelledby="os-leven-kop">
      <header>
        <h2 id="os-leven-kop" className="os-zone__kop">
          Mijn leven
        </h2>
        {/* Eerlijk over wat dit is: een lens op wat er gemeten is, niet een
            oordeel over hoe je het doet. */}
        <p className="os-zone__intro">
          Vier domeinen, uit je echte data. Wat niet gemeten is, blijft leeg — een streepje is hier
          geen nul.
        </p>
      </header>

      <div className="os-leven__grid">
        <div className="os-leven__breed">
          <GezondheidDomein />
        </div>

        <ProductiviteitDomein />

        {/* Het domein en zijn gereedschap in één kolom. */}
        <div style={{ display: 'grid', gap: 'var(--ruimte-kaart)', alignContent: 'start' }}>
          <GroeiDomein />
          <JournalKaart />
        </div>

        <div className="os-leven__breed">
          <BusinessDomein />
        </div>
      </div>
    </section>
  )
}
