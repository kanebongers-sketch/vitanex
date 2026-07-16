import type { WaterVoortgang as Voortgang } from '@/lib/lifeos/voeding/totalen'
import { waterTekst } from '@/lib/lifeos/voeding/formatteer'

// De voortgangsbalk. Presentational: props in → UI uit, geen fetch, geen state.
//
// Verschijnt ALLEEN als je zelf een waterdoel stelde. Zonder doel toont
// `WaterKaart` het totaal zonder percentage — zie de uitleg daar.

interface WaterVoortgangProps {
  voortgang: Voortgang
}

export function WaterVoortgang({ voortgang }: WaterVoortgangProps) {
  const { totaalMl, doelMl, pct } = voortgang
  const doelTekst = waterTekst(doelMl)

  // De balk klemt op 100 — verder loopt hij het scherm uit. Het percentage
  // ernaast doet dat NIET: 120% is wat er gebeurde, en dat mag de kaart niet
  // verzwijgen om de vorm te redden.
  const balk = Math.min(pct, 100) / 100

  return (
    <div style={{ display: 'grid', gap: 8, marginTop: 2 }}>
      <p style={{ fontSize: 12, color: 'var(--text-4)', margin: 0, lineHeight: 1.5 }}>
        {pct}% van je doel{doelTekst === null ? '' : ` · ${doelTekst}`}
      </p>

      {/* Het cijfer staat er in tekst naast, dus de balk is decoratie voor het
          oog. `aria-hidden` in plaats van een progressbar-rol: een screenreader
          zou anders hetzelfde getal twee keer voorlezen. */}
      <div
        aria-hidden="true"
        style={{
          height: 4,
          borderRadius: 999,
          background: 'var(--bg-raised)',
          overflow: 'hidden',
        }}
      >
        {/* scaleX i.p.v. width: transform is compositor-werk, width kost per
            frame een layout. Origin links, anders groeit hij vanuit het midden. */}
        <span
          style={{
            display: 'block',
            height: '100%',
            borderRadius: 'inherit',
            background: 'var(--brand)',
            transformOrigin: 'left center',
            transform: `scaleX(${balk})`,
            transition: 'transform 300ms var(--ease)',
          }}
        />
      </div>

      <p style={{ fontSize: 11, color: 'var(--text-4)', margin: 0 }}>
        {/* Het doel is van Kane, niet van ons. Dat staat er ook zo. */}
        doel dat je zelf stelde: {doelTekst ?? `${doelMl} ml`}
        {totaalMl >= doelMl ? ' · gehaald' : ''}
      </p>
    </div>
  )
}
