import { AlertTriangle, Link2 } from 'lucide-react'
import { Kaart, NogNiets } from '@/components/lifeos/os/Kaart'
import type { HerstelBron } from '@/lib/lifeos/herstel/herstel'
import { bronLabel, getalTekst, slaapTekst } from '@/lib/lifeos/herstel/formatteer'
import { heeftMeting, type HerstelDag } from '@/lib/lifeos/herstel/week'

/**
 * De drie staten van de herstelkaart, als union — niet als drie losse booleans.
 *
 * Dat is bewust een type-beslissing en geen stijlkwestie: met `{ fout?, data? }`
 * is "fout én leeg" representeerbaar, en dan is het een kwestie van tijd tot
 * een netwerkfout als "je hebt niets gemeten" op het scherm staat. In MentaForce
 * gebeurde dat op drie plekken. Hier kán het niet: er is precies één staat.
 */
export type HerstelToestand =
  | { staat: 'fout'; melding: string }
  | { staat: 'niets-gekoppeld' }
  | { staat: 'niets-gemeten' }
  | { staat: 'gemeten'; dag: HerstelDag; wanneer: string }

interface HerstelKaartProps {
  toestand: HerstelToestand
}

export function HerstelKaart({ toestand }: HerstelKaartProps) {
  return (
    <Kaart titel="Herstel" vervangt="Whoop · Oura" nadruk="dragend">
      {inhoud(toestand)}
    </Kaart>
  )
}

function inhoud(toestand: HerstelToestand) {
  switch (toestand.staat) {
    case 'fout':
      return <Fout melding={toestand.melding} />
    case 'niets-gekoppeld':
      return (
        <NietsGekoppeld />
      )
    case 'niets-gemeten':
      return (
        <NogNiets
          wat="Nog niets gemeten"
          waarom="Je wearable heeft vannacht niets doorgegeven. Synchroniseer, of draag 'm vannacht."
        />
      )
    case 'gemeten':
      // Een dag mét rijen maar zónder ingevuld veld is geen meting. Zonder deze
      // check zou de kaart een rij lege streepjes tonen alsof dat data was.
      return toestand.dag.samen !== null && heeftMeting(toestand.dag.samen)
        ? <Gemeten dag={toestand.dag} wanneer={toestand.wanneer} />
        : (
          <NogNiets
            wat="Nog niets gemeten"
            waarom="Er staan wel gegevens klaar, maar geen enkele meting is ingevuld."
          />
        )
  }
}

/**
 * De foutstaat. Nadrukkelijk NIET de lege staat: geen streepje, geen "nog niets
 * gemeten". Dit zegt dat wíj iets niet konden, niet dat jij iets niet deed.
 */
function Fout({ melding }: { melding: string }) {
  return (
    <div role="alert" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <AlertTriangle
        size={18}
        strokeWidth={2.2}
        aria-hidden="true"
        style={{ color: 'var(--status-aandacht)', flexShrink: 0, marginTop: 2 }}
      />
      <div>
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', margin: '0 0 4px' }}>
          Herstel kon niet geladen worden
        </p>
        <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0, lineHeight: 1.5 }}>
          {melding}
        </p>
      </div>
    </div>
  )
}

function NietsGekoppeld() {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <Link2
        size={18}
        strokeWidth={2.2}
        aria-hidden="true"
        style={{ color: 'var(--text-4)', flexShrink: 0, marginTop: 2 }}
      />
      <div>
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', margin: '0 0 4px' }}>
          Nog geen wearable gekoppeld
        </p>
        <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0, lineHeight: 1.5 }}>
          Koppel WHOOP of Oura, dan hoef je die apps &lsquo;s ochtends niet meer te openen.
        </p>
      </div>
    </div>
  )
}

function Gemeten({ dag, wanneer }: { dag: HerstelDag; wanneer: string }) {
  const m = dag.samen
  if (m === null) return null

  const score = getalTekst(m.leverancierScore, 0)
  const scoreBron = dag.herkomst.leverancierScore

  return (
    <div>
      {score !== null && scoreBron !== null ? (
        <Score score={score} bron={scoreBron} wanneer={wanneer} />
      ) : (
        // Geen herstelcijfer, wel metingen. We verzinnen er geen: de losse
        // waarden staan er gewoon, zonder samenvattend getal.
        <p style={{ fontSize: 13, color: 'var(--text-3)', margin: '0 0 16px', lineHeight: 1.5 }}>
          Geen herstelcijfer voor {wanneer} — wel deze metingen.
        </p>
      )}

      <dl
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(132px, 1fr))',
          gap: '14px 18px',
          margin: 0,
        }}
      >
        <Metriek label="HRV" waarde={getalTekst(m.hrvMs, 0)} eenheid="ms" bron={dag.herkomst.hrvMs} />
        <Metriek label="Rusthartslag" waarde={getalTekst(m.rustHartslag, 0)} eenheid="bpm" bron={dag.herkomst.rustHartslag} />
        <Metriek label="Slaap" waarde={slaapTekst(m.slaapMinuten)} bron={dag.herkomst.slaapMinuten} />
        <Metriek label="Slaapefficiëntie" waarde={getalTekst(m.slaapEfficientie, 0)} eenheid="%" bron={dag.herkomst.slaapEfficientie} />
      </dl>
    </div>
  )
}

function Score({ score, bron, wanneer }: { score: string; bron: HerstelBron; wanneer: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 20 }}>
      <p
        className="os-cijfer"
        style={{ fontSize: 52, fontWeight: 500, color: 'var(--brand)', margin: 0, lineHeight: 0.9 }}
      >
        {score}
      </p>
      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', margin: '0 0 2px' }}>
          Herstel {wanneer}
        </p>
        {/* Het cijfer staat nooit los van zijn bron: een WHOOP-71 en een Oura-71
            zijn niet hetzelfde getal, en dat mag de kaart niet verzwijgen. */}
        <p style={{ fontSize: 12, color: 'var(--text-4)', margin: 0 }}>
          volgens {bronLabel(bron)}
        </p>
      </div>
    </div>
  )
}

interface MetriekProps {
  label: string
  waarde: string | null
  eenheid?: string
  bron: HerstelBron | null
}

function Metriek({ label, waarde, eenheid, bron }: MetriekProps) {
  const gemeten = waarde !== null && bron !== null

  return (
    <div>
      <dt
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--text-4)',
          marginBottom: 5,
        }}
      >
        {label}
      </dt>
      <dd style={{ margin: 0 }}>
        {gemeten ? (
          <>
            <span
              className="os-cijfer"
              style={{ fontSize: 19, color: 'var(--text-1)', fontWeight: 500 }}
            >
              {waarde}
            </span>
            {eenheid !== undefined ? (
              <span style={{ fontSize: 12, color: 'var(--text-4)', marginLeft: 3 }}>{eenheid}</span>
            ) : null}
            <span
              style={{ display: 'block', fontSize: 11, color: 'var(--text-4)', marginTop: 3 }}
            >
              {bronLabel(bron)}
            </span>
          </>
        ) : (
          // Niet gemeten. Een streepje, geen 0 — en het label eronder zegt
          // waarom er niets staat, in plaats van het stil te laten.
          <>
            <span
              className="os-cijfer"
              style={{ fontSize: 19, color: 'var(--text-4)' }}
              aria-hidden="true"
            >
              —
            </span>
            <span style={{ display: 'block', fontSize: 11, color: 'var(--text-4)', marginTop: 3 }}>
              niet gemeten
            </span>
          </>
        )}
      </dd>
    </div>
  )
}
