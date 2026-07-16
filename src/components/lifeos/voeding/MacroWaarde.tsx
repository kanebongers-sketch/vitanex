import type { Totaal } from '@/lib/lifeos/voeding/totalen'
import { macroTekst } from '@/lib/lifeos/voeding/formatteer'

// Eén macro-waarde. Presentational: props in → UI uit.
//
// ─── DE DEKKINGSZIN IS NIET OPTIONEEL ───────────────────────────────────────
// `macroTekst` geeft de waarde en de dekking als één object terug, en deze
// component rendert beide of geen van beide. Er is geen pad waarlangs '42 g'
// op het scherm komt zonder 'uit 1 van 3 maaltijden' eronder — dat is precies
// de bedoeling. Zodra die twee losse variabelen worden, is het een kwestie van
// tijd tot iemand de tweede vergeet.
//
// Drie staten:
//   niets gemeten  → '—' + 'niet ingevuld'. Nooit '0 g': dat zou beweren dat
//                    je het at en het nul was.
//   deels gemeten  → het getal + uit hoeveel maaltijden het komt.
//   volledig       → het getal, zonder voorbehoud. Ruis bij een compleet getal
//                    leert je het voorbehoud negeren als het er wél toe doet.

interface MacroWaardeProps {
  label: string
  totaal: Totaal
  eenheid: string
  /** Je eigen doel, of null. Zonder doel: alleen het getal, geen percentage. */
  doel?: number | null
  decimalen?: number
  /** De dragende waarde van de kaart krijgt de schaal. */
  groot?: boolean
}

export function MacroWaarde({
  label,
  totaal,
  eenheid,
  doel = null,
  decimalen = 0,
  groot = false,
}: MacroWaardeProps) {
  const tekst = macroTekst(totaal, eenheid, decimalen)

  return (
    <div style={groot ? { gridColumn: '1 / -1' } : undefined}>
      <dt
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--text-4)',
          marginBottom: groot ? 6 : 5,
        }}
      >
        {label}
      </dt>
      <dd style={{ margin: 0 }}>
        {tekst === null ? (
          <NietIngevuld groot={groot} />
        ) : (
          <>
            <span
              className="os-cijfer"
              style={{
                fontSize: groot ? 34 : 18,
                fontWeight: 500,
                // Cyaan is accent, geen vlakvuller: alleen de dragende waarde
                // krijgt 'm. Cyaan op --bg-card = 10,65:1, ruim AA.
                color: groot ? 'var(--brand)' : 'var(--text-1)',
                lineHeight: 1,
              }}
            >
              {tekst.waarde}
            </span>

            {tekst.dekking === null ? (
              doel === null ? null : <Doel totaal={totaal} doel={doel} eenheid={eenheid} />
            ) : (
              // Het getal is echt, maar het dekt niet je hele dag. Dat staat er
              // dus bij — en het doel niet: een percentage van een onvolledig
              // totaal is een onzingetal.
              <span style={{ display: 'block', fontSize: 11, color: 'var(--status-aandacht)', marginTop: 5 }}>
                {tekst.dekking}
              </span>
            )}
          </>
        )}
      </dd>
    </div>
  )
}

function NietIngevuld({ groot }: { groot: boolean }) {
  return (
    <>
      {/* Het streepje is de vorm van "geen waarde". Voor een screenreader is het
          ruis: de tekst eronder zegt het in woorden. */}
      <span
        className="os-cijfer"
        style={{ fontSize: groot ? 34 : 18, color: 'var(--text-4)', lineHeight: 1 }}
        aria-hidden="true"
      >
        —
      </span>
      <span style={{ display: 'block', fontSize: 11, color: 'var(--text-4)', marginTop: 5 }}>
        niet ingevuld
      </span>
    </>
  )
}

/**
 * Alleen bij een volledig totaal én een doel dat je zelf stelde.
 *
 * Beschrijft, oordeelt niet: "van je doel", geen "te weinig". LifeOS is geen
 * diëtist.
 */
function Doel({ totaal, doel, eenheid }: { totaal: Totaal; doel: number; eenheid: string }) {
  if (totaal.waarde === null || doel <= 0) return null
  const pct = Math.round((totaal.waarde / doel) * 100)

  return (
    <span style={{ display: 'block', fontSize: 11, color: 'var(--text-4)', marginTop: 5 }}>
      {pct}% van je doel ({doel} {eenheid})
    </span>
  )
}
