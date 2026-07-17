'use client'

import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { KnopLink } from '@/components/lifeos/os/Knop'
import { DomeinSectie, Stat, StatRij } from './DomeinSectie'
import { useDomein, type DomeinUitkomst } from './useDomein'
import { DomeinSkelet } from './DomeinSkelet'
import { haalJson, isObject, getalOfNull } from '@/lib/lifeos/api/http'
import { leesWellbeing, type WellbeingView } from '@/components/lifeos/welzijn/lees-welzijn'
import { scoreNiveau } from '@/lib/pijlers/score'

// ─── Domein: Gezondheid ─────────────────────────────────────────────────────
// De samenvatting, niet de details. `WelzijnScoreKaart` toont de zes ringen en
// de weekstrip; dit domein beantwoordt één trap hoger: "hoe staat mijn
// gezondheid ervoor, en weet ik dat eigenlijk wel?"
//
// Die tweede helft is hier het punt. De wellbeing-score is het gemiddelde van
// alléén de gemeten pijlers, dus een 78 uit twee pijlers is iets heel anders dan
// een 78 uit zes. "x van 6 gemeten" staat daarom net zo groot als de score zelf.
//
// Drie bronnen, en de laatste twee mogen falen zonder het domein te slopen:
//   /api/pijlers          — verplicht (zonder score is er geen domein)
//   /api/vandaag          — optioneel (de dagchecklist)
//   /api/lichaamsmetingen — optioneel (gewicht)

interface GezondheidData {
  welzijn: WellbeingView
  /** `null` = we konden de dagchecklist niet ophalen. Niet: "niets gedaan". */
  vandaag: { gedaan: number; totaal: number } | null
  /** `null` = nog nooit gewogen, óf niet op te halen. Zie `gewichtBekend`. */
  gewichtKg: number | null
}

/** Narrowt `GET /api/vandaag` → `scores.{gedaan,totaal}`. */
function leesVandaag(ruw: unknown): { gedaan: number; totaal: number } | null {
  if (!isObject(ruw) || !isObject(ruw.scores)) return null
  const gedaan = getalOfNull(ruw.scores.gedaan)
  const totaal = getalOfNull(ruw.scores.totaal)
  if (gedaan === null || totaal === null) return null
  return { gedaan, totaal }
}

/** Narrowt `GET /api/lichaamsmetingen` → het nieuwste gewicht (of geen). */
function leesGewicht(ruw: unknown): { gewichtKg: number | null } | null {
  if (!isObject(ruw) || !Array.isArray(ruw.metingen)) return null
  // De route sorteert aflopend op datum, dus de eerste is de nieuwste.
  const nieuwste = ruw.metingen[0]
  if (!isObject(nieuwste)) return { gewichtKg: null }
  return { gewichtKg: getalOfNull(nieuwste.gewicht_kg) }
}

async function haalGezondheid(): Promise<DomeinUitkomst<GezondheidData>> {
  const [pijlers, vandaag, metingen] = await Promise.all([
    haalJson('/api/pijlers', leesWellbeing),
    haalJson('/api/vandaag', leesVandaag),
    haalJson('/api/lichaamsmetingen', leesGewicht),
  ])

  // Alleen de pijlers zijn dragend. Valt de dagchecklist of het gewicht weg, dan
  // tonen we dat stukje niet — in plaats van het hele domein op storing te
  // zetten terwijl de score gewoon binnen is.
  if (!pijlers.ok) return { ok: false, fout: pijlers.fout }

  return {
    ok: true,
    waarde: {
      welzijn: pijlers.waarde,
      vandaag: vandaag.ok ? vandaag.waarde : null,
      gewichtKg: metingen.ok ? metingen.waarde.gewichtKg : null,
    },
  }
}

export function GezondheidDomein() {
  const { staat, opnieuw } = useDomein(haalGezondheid)

  return (
    <DomeinSectie
      titel="Gezondheid"
      definitie="Je zes pijlers, je dag en je lichaam — uit je echte MentaForce-data."
    >
      {staat.fase === 'laden' ? <DomeinSkelet statistieken={3} /> : null}
      {staat.fase === 'fout' ? <Foutmelding bericht={staat.bericht} opnieuw={opnieuw} /> : null}
      {staat.fase === 'ok' ? <Inhoud data={staat.data} /> : null}
    </DomeinSectie>
  )
}

function Inhoud({ data }: { data: GezondheidData }) {
  const { welzijn, vandaag, gewichtKg } = data
  const niveau = scoreNiveau(welzijn.score)
  const compleet = welzijn.gemeten === welzijn.totaal

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <StatRij>
        <Stat
          // Geen score = een streepje. Nooit een 0: dat leest als "je welzijn is nul".
          waarde={welzijn.score === null ? '—' : String(welzijn.score)}
          naam={`Welzijn · ${niveau.label}`}
          detail={`${welzijn.gemeten} van ${welzijn.totaal} pijlers gemeten`}
          kleur={niveau.kleur}
        />
        <Stat
          waarde={vandaag === null ? '—' : `${vandaag.gedaan}/${vandaag.totaal}`}
          naam="Vandaag afgevinkt"
          detail={vandaag === null ? 'checklist niet opgehaald' : 'dagelijkse activiteiten'}
        />
        <Stat
          waarde={gewichtKg === null ? '—' : `${gewichtKg}`}
          naam="Gewicht (kg)"
          detail={gewichtKg === null ? 'nog niet gewogen' : 'laatste meting'}
        />
      </StatRij>

      {/* De eerlijke voetnoot bij de score. Zonder dit is een 80 uit twee
          pijlers niet te onderscheiden van een 80 uit zes. */}
      {!compleet ? (
        <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.5 }}>
          Deze score telt alleen de pijlers waar data voor is. {welzijn.totaal - welzijn.gemeten} van{' '}
          {welzijn.totaal} nog niet — log stress en stemming hierboven, dan wordt dit cijfer
          compleet.
        </p>
      ) : null}

      <KnopLink href="/checkin" variant="stil">
        Check-in doen
      </KnopLink>
    </div>
  )
}
