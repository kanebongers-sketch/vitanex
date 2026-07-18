'use client'

import type { Rooster } from '@/lib/lifeos/agenda/rooster'
import { HeleDagChip, RoosterBlokItem, PAD_Y, PX_PER_MIN } from './RoosterBlok'

// Eén dagkolom in de meerdaagse weergave: een plakkende dag-kop, een optionele
// (uniform hoge) hele-dag-band en de getimede body met uur-strepen, blokken en —
// alleen vandaag — de nu-lijn. Presentationeel: props erin, UI eruit. Het venster
// is GEDEELD (via de grid meegegeven), zodat de uur-rijen over de kolommen
// uitlijnen. De nu-lijn en het venster komen van de grid; deze kolom leest zelf
// geen klok (dat zou op de server anders renderen dan in de browser).

/** Twee labels voor één dag: kort in de kop/aria, lang voor de kop-title-tooltip. */
export interface DagLabel {
  /** Kort: "vandaag", "wo 22". Staat in de kop én als voorvoegsel in blok-aria. */
  kort: string
  /** Lang: "woensdag 22 juli". Voor de `title` van de kop. */
  lang: string
}

interface DagKolomProps {
  label: DagLabel
  rooster: Rooster
  isVandaag: boolean
  /** Nu in lokale minuten, of null (niet vandaag / buiten venster). Van de grid. */
  nuMin: number | null
  /** De hele uren van het gedeelde venster, voor de uur-strepen. */
  uren: number[]
  /** Hoogte van de getimede body in px (gedeeld, gelijk voor elke kolom). */
  hoogte: number
  /** Bovenkant van het gedeelde venster in lokale minuten. */
  vensterStartMin: number
  /** Hoogte van de hele-dag-band in px; 0 = geen band (geen kolom heeft er een). */
  bandHoogte: number
  /** Hoogte van de dag-kop in px (gedeeld met de uur-as-hoek). */
  kopHoogte: number
}

export function DagKolom({
  label,
  rooster,
  isVandaag,
  nuMin,
  uren,
  hoogte,
  vensterStartMin,
  bandHoogte,
  kopHoogte,
}: DagKolomProps) {
  const { blokken, heleDag } = rooster

  return (
    <div
      role="group"
      aria-label={label.lang}
      style={{
        // Breedte komt van de grid (minmax); `minWidth: 0` laat de kop-tekst
        // netjes met ellipsis afknippen i.p.v. de kolom op te rekken.
        position: 'relative',
        minWidth: 0,
        borderLeft: '1px solid var(--line)',
      }}
    >
      <header
        title={label.lang}
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          height: kopHoogte,
          padding: '0 8px',
          background: isVandaag ? 'color-mix(in srgb, var(--brand) 12%, var(--bg-app))' : 'var(--bg-app)',
          borderBottom: `1px solid ${isVandaag ? 'var(--brand)' : 'var(--line)'}`,
          boxShadow: isVandaag ? 'inset 0 -2px 0 var(--brand)' : undefined,
        }}
      >
        {isVandaag ? (
          <span
            aria-hidden="true"
            style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--brand)', flexShrink: 0 }}
          />
        ) : null}
        <span
          className="os-cijfer"
          style={{
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.01em',
            color: isVandaag ? 'var(--brand)' : 'var(--text-2)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {label.kort}
        </span>
      </header>

      {bandHoogte > 0 ? (
        <div style={{ height: bandHoogte, borderBottom: '1px solid var(--line)', overflow: 'hidden' }}>
          {heleDag.length > 0 ? (
            <ul
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 4,
                listStyle: 'none',
                margin: 0,
                padding: '4px 5px',
              }}
            >
              {heleDag.map((item) => (
                <HeleDagChip key={item.id} titel={item.titel} kleur={item.kleur} />
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div style={{ position: 'relative', height: hoogte }}>
        {uren.map((min) => (
          <div
            key={min}
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: PAD_Y + (min - vensterStartMin) * PX_PER_MIN,
              borderTop: '1px solid var(--line)',
            }}
          />
        ))}

        <ul style={{ position: 'absolute', inset: '0 4px', margin: 0, padding: 0, listStyle: 'none' }}>
          {blokken.map((blok) => (
            <RoosterBlokItem key={blok.id} blok={blok} dagLabel={label.kort} />
          ))}
        </ul>

        {isVandaag && nuMin !== null ? (
          <NuLijn nuMin={nuMin} vensterStartMin={vensterStartMin} />
        ) : null}
      </div>
    </div>
  )
}

/** De cyaan "nu"-lijn over de volle kolombreedte, met een bolletje links. */
function NuLijn({ nuMin, vensterStartMin }: { nuMin: number; vensterStartMin: number }) {
  const top = PAD_Y + (nuMin - vensterStartMin) * PX_PER_MIN
  return (
    <div
      aria-hidden="true"
      style={{ position: 'absolute', left: 0, right: 0, top, height: 0, pointerEvents: 'none', zIndex: 1 }}
    >
      <span
        style={{
          position: 'absolute',
          left: -3,
          top: -3,
          width: 7,
          height: 7,
          borderRadius: 999,
          background: 'var(--brand)',
        }}
      />
      <span
        style={{ position: 'absolute', left: 0, right: 0, top: 0, borderTop: '1.5px solid var(--brand)' }}
      />
    </div>
  )
}
