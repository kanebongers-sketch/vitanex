import type { LidKaart } from '@/lib/club/leden/kaart'
import { weekBalken, PATROON_WEKEN } from '@/lib/club/leden/patroon'
import { bezoekPerMaand } from '@/lib/club/ontwerp/reeks'
import { eenDecimaal, metTeken } from '@/lib/club/cijfers/opmaak'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { ONTWERP } from '@/lib/aiyourgym/taal/woorden/club/ontwerp'
import { CijferStrook, CijferTegel } from '@/components/club/ontwerp/CijferTegel'

// Bovenaan het overzicht van de ledenkaart: het bezoek van dit lid in drie
// cijfers. Het hoofdcijfer is de lopende kalendermaand (regel Kane), met de
// hele vorige maand als basis in grijs: een maand die nog loopt is niet eerlijk
// beter of slechter dan een volle maand, dus geen kleur. Daarnaast het
// gemiddelde per week over 12 weken met het verloop, en de no-shows.

interface BezoekCijfersProps {
  kaart: LidKaart
  nu: Date
}

export async function BezoekCijfers({ kaart, nu }: BezoekCijfersProps) {
  const w = (await clubTekst(ONTWERP)).ledenkaart
  const bezoeken = kaart.bezoeken.map((b) => b.op)
  const maand = bezoekPerMaand(bezoeken, nu)
  const weken = weekBalken(bezoeken, nu)
  const totaal = weken.reduce((s, b) => s + b.aantal, 0)
  const verschil = maand.dezeMaand - maand.vorigeMaand
  return (
    <CijferStrook label={w.titel}>
      <CijferTegel
        hoofd
        label={w.dezeMaand}
        waarde={String(maand.dezeMaand)}
        verschil={{ tekst: verschil === 0 ? w.zelfde : w.tegenVorige(metTeken(verschil)), oordeel: null }}
        sub={`${w.vorigeMaand(maand.vorigeMaand)} · ${w.periode}`}
      />
      <CijferTegel
        label={w.perWeek}
        waarde={eenDecimaal(totaal / PATROON_WEKEN)}
        sub={w.perWeekSub}
        trend={{ waarden: weken.map((b) => b.aantal), label: w.trendLabel, lopend: true }}
      />
      <CijferTegel label={w.noShows} waarde={String(kaart.noShows)} sub={kaart.noShows === 0 ? w.geenNoShows : w.noShowsSub} />
    </CijferStrook>
  )
}
