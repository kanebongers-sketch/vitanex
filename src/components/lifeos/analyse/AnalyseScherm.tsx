import { PieChart, MapPin, Layers, Wallet, Users, CalendarClock, Info } from 'lucide-react'
import {
  OMZET_PER_VESTIGING,
  OMZET_PER_TRAJECT,
  CONTRACT_EINDE,
  NIEUWE_KLANTEN,
  ANALYSE_TOTAAL,
} from '@/lib/lifeos/analyse/analyse-data'
import { formatEuro, maandLabel } from './analyse-format'
import { OmzetBalken } from './OmzetBalken'
import { ContractEindeTijdlijn } from './ContractEindeTijdlijn'
import { GroeiStaafjes } from './GroeiStaafjes'
import { ANALYSE_STYLE } from './analyse-style'

// Zaken-analyse — waar komt de omzet vandaan, wat loopt er af, hoe groeit het.
// Puur presentational en statisch (geen fetch): leest de geaggregeerde import-
// momentopname en toont die. De peilmaand ("deze maand") is een prop met de
// import-maand als default, zodat het verleng-venster niet blind hardcoded is.

interface AnalyseSchermProps {
  peilmaand?: string
}

export function AnalyseScherm({ peilmaand = ANALYSE_TOTAAL.peildatum }: AnalyseSchermProps) {
  const dezeMaand = CONTRACT_EINDE.find((rij) => rij.maand === peilmaand)

  return (
    <section className="anl" aria-labelledby="anl-titel">
      <header className="anl-kop">
        <p className="anl-eyebrow">
          <PieChart size={14} strokeWidth={2.2} aria-hidden="true" /> Zaken · omzet-analyse
        </p>
        <h1 className="anl-titel" id="anl-titel">Waar je omzet vandaan komt</h1>
        <p className="anl-meta">
          Momentopname uit je <b>Fit Factory-import</b> — {ANALYSE_TOTAAL.klanten} actieve klanten
          over {ANALYSE_TOTAAL.vestigingen} vestigingen. Geen live-koppeling; peildatum{' '}
          <b>{maandLabel(peilmaand)}</b>.
        </p>
      </header>

      <ul className="anl-strip">
        <li className="anl-tegel">
          <p className="anl-tegel-label"><Wallet size={13} strokeWidth={2} aria-hidden="true" /> Omzet / maand</p>
          <p className="anl-tegel-waarde">{formatEuro(ANALYSE_TOTAAL.omzet)}</p>
          <p className="anl-tegel-sub">terugkerend (MRR)</p>
        </li>
        <li className="anl-tegel">
          <p className="anl-tegel-label"><Users size={13} strokeWidth={2} aria-hidden="true" /> Actieve klanten</p>
          <p className="anl-tegel-waarde">{ANALYSE_TOTAAL.klanten}</p>
          <p className="anl-tegel-sub">status actief</p>
        </li>
        <li className="anl-tegel">
          <p className="anl-tegel-label"><MapPin size={13} strokeWidth={2} aria-hidden="true" /> Vestigingen</p>
          <p className="anl-tegel-waarde">{ANALYSE_TOTAAL.vestigingen}</p>
          <p className="anl-tegel-sub">met omzet</p>
        </li>
        <li className="anl-tegel anl-tegel--aandacht">
          <p className="anl-tegel-label"><CalendarClock size={13} strokeWidth={2} aria-hidden="true" /> Loopt af · {maandLabel(peilmaand)}</p>
          <p className="anl-tegel-waarde">{dezeMaand?.aantal ?? 0}</p>
          <p className="anl-tegel-sub">{dezeMaand ? formatEuro(dezeMaand.omzet) : formatEuro(0)} te verlengen</p>
        </li>
      </ul>

      <OmzetBalken
        titel="Omzet per vestiging"
        bijschrift="Maandomzet en aantal actieve klanten per locatie."
        eenheid="klanten"
        icoon={MapPin}
        items={OMZET_PER_VESTIGING}
      />

      <OmzetBalken
        titel="Omzet per traject"
        bijschrift="Gegroepeerd op traject-type; promo- en duo-varianten samengeteld."
        eenheid="klanten"
        icoon={Layers}
        items={OMZET_PER_TRAJECT}
      />

      <ContractEindeTijdlijn
        rijen={CONTRACT_EINDE}
        peilmaand={peilmaand}
        zonderEinddatum={ANALYSE_TOTAAL.zonderEinddatum}
      />

      <GroeiStaafjes rijen={NIEUWE_KLANTEN} />

      <p className="anl-bron">
        <Info size={15} strokeWidth={2} aria-hidden="true" />
        <span>
          Op basis van je <b>Fit Factory-import</b> — één momentopname, geen verzonnen cijfers.
          De som van de vestiging-omzetten is exact de MRR ({formatEuro(ANALYSE_TOTAAL.omzet)}).
          Bijwerken? Importeer opnieuw.
        </span>
      </p>

      <style>{ANALYSE_STYLE}</style>
    </section>
  )
}
