'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { AfspraakJson } from '@/lib/lifeos/agenda/agenda'
import { datumSleutel } from '@/lib/lifeos/datum/datum'
import {
  bouwRooster,
  minutenSindsMiddernacht,
  tijdLabelVanMinuten,
  uurLijnen,
  type RoosterBlok,
} from '@/lib/lifeos/agenda/rooster'

// Presentationeel client-eiland: het tekent een tijdrooster à la Google Calendar
// uit de pure layout in `rooster.ts`. De enige eigen staat is de "nu"-lijn, die
// pas ná mount de klok leest — net als FocusKaart — om een hydration-mismatch te
// vermijden (de server heeft een andere tijd dan de browser).

interface AgendaRoosterProps {
  afspraken: AfspraakJson[]
  /** Dagsleutel (YYYY-MM-DD) van de getoonde dag. Bepaalt of de nu-lijn hoort. */
  dag: string
}

/** Schaal: 0,8px per minuut → uur-rijen van 48px, à la Google's dagweergave. */
const PX_PER_MIN = 0.8
/** Breedte van de uur-as links, in px. */
const GUTTER = 52
/** Verticale marge binnen het rooster, zodat de rand-labels niet afknippen. */
const PAD_Y = 10
/** Hoogte van de scroll-container; daarboven scrollt het rooster in zichzelf. */
const MAX_HOOGTE = 400

const LABEL: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--text-4)',
  margin: '0 0 8px',
}

export function AgendaRooster({ afspraken, dag }: AgendaRoosterProps) {
  const rooster = useMemo(() => bouwRooster(afspraken), [afspraken])
  const { vensterStartMin, vensterEindMin, blokken, heleDag } = rooster

  const scrollRef = useRef<HTMLDivElement>(null)
  const scrollGedaan = useRef(false)
  // null tot ná mount: de server rendert dan geen nu-lijn, de browser wel — geen
  // mismatch. null = "niet vandaag" of "buiten het venster".
  const [nuMin, setNuMin] = useState<number | null>(null)

  const eersteBlokStartMin = useMemo(
    () => (blokken.length > 0 ? Math.min(...blokken.map((b) => b.startMin)) : null),
    [blokken],
  )

  useEffect(() => {
    const el = scrollRef.current

    const werkBij = () => {
      const nu = new Date()
      const min = minutenSindsMiddernacht(nu)
      const isVandaag = datumSleutel(nu) === dag
      const binnenVenster = min >= vensterStartMin && min <= vensterEindMin
      setNuMin(isVandaag && binnenVenster ? min : null)

      // Eén keer: scroll naar "nu" (indien vandaag én in beeld), anders naar de
      // eerste afspraak. Direct gezet (geen smooth-animatie) — rustig, en
      // daarmee vanzelf reduced-motion-vriendelijk.
      if (!scrollGedaan.current && el) {
        const doelMin =
          isVandaag && binnenVenster ? min : (eersteBlokStartMin ?? vensterStartMin)
        el.scrollTop = Math.max(0, PAD_Y + (doelMin - vensterStartMin) * PX_PER_MIN - 40)
        scrollGedaan.current = true
      }
    }

    werkBij()
    // Ruime tik: de nu-lijn hoeft niet per seconde te bewegen. Geen storm.
    const id = setInterval(werkBij, 60_000)
    return () => clearInterval(id)
  }, [dag, vensterStartMin, vensterEindMin, eersteBlokStartMin])

  // Lege dag: niets met een tijd én geen hele-dag-event. Eerlijk zeggen, geen
  // leeg rooster van 15 uur tonen.
  if (blokken.length === 0 && heleDag.length === 0) {
    return (
      <div>
        <p style={LABEL}>Tijdlijn</p>
        <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0 }}>Niets gepland vandaag.</p>
      </div>
    )
  }

  const uren = uurLijnen(vensterStartMin, vensterEindMin)
  const hoogte = PAD_Y * 2 + (vensterEindMin - vensterStartMin) * PX_PER_MIN

  return (
    <section aria-label="Tijdrooster van je dag">
      <p style={LABEL}>Tijdlijn</p>

      {heleDag.length > 0 ? <HeleDagStrook items={heleDag} /> : null}

      {blokken.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0 }}>
          Verder niets met een tijd vandaag.
        </p>
      ) : (
        <div
          ref={scrollRef}
          style={{
            position: 'relative',
            maxHeight: MAX_HOOGTE,
            overflowY: 'auto',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius-sm, 10px)',
            background: 'var(--bg-app)',
          }}
        >
          <div style={{ position: 'relative', height: hoogte }}>
            {uren.map((min) => (
              <UurLijn key={min} min={min} vensterStartMin={vensterStartMin} />
            ))}

            <ul
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: GUTTER,
                right: 6,
                margin: 0,
                padding: 0,
                listStyle: 'none',
              }}
            >
              {blokken.map((blok) => (
                <RoosterBlokItem key={blok.id} blok={blok} />
              ))}

              {nuMin !== null ? <NuLijn nuMin={nuMin} vensterStartMin={vensterStartMin} /> : null}
            </ul>
          </div>
        </div>
      )}
    </section>
  )
}

/** De hele-dag-events als rustige cyaan-getinte chips bovenaan het rooster. */
function HeleDagStrook({ items }: { items: { id: string; titel: string | null }[] }) {
  return (
    <ul
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6,
        listStyle: 'none',
        margin: '0 0 8px',
        padding: 0,
      }}
    >
      {items.map((item) => (
        <li
          key={item.id}
          style={{
            fontSize: 12,
            color: 'var(--text-1)',
            padding: '3px 9px',
            borderRadius: 999,
            border: '1px solid color-mix(in srgb, var(--brand) 34%, transparent)',
            background: 'var(--brand-soft)',
          }}
        >
          {item.titel ?? 'Afspraak zonder titel'}
        </li>
      ))}
    </ul>
  )
}

/** Eén uur-lijn met het uur-label in de linker as. */
function UurLijn({ min, vensterStartMin }: { min: number; vensterStartMin: number }) {
  const top = PAD_Y + (min - vensterStartMin) * PX_PER_MIN
  return (
    <div aria-hidden="true" style={{ position: 'absolute', top, left: 0, right: 0, height: 0 }}>
      <span
        className="os-cijfer"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: GUTTER - 10,
          transform: 'translateY(-50%)',
          textAlign: 'right',
          fontSize: 10,
          color: 'var(--text-4)',
        }}
      >
        {tijdLabelVanMinuten(min)}
      </span>
      <span
        style={{
          position: 'absolute',
          left: GUTTER,
          right: 0,
          top: 0,
          borderTop: '1px solid var(--line)',
        }}
      />
    </div>
  )
}

/** Eén afspraak-blok, cyaan-getint, op zijn plek en in zijn lane-kolom. */
function RoosterBlokItem({ blok }: { blok: RoosterBlok }) {
  const top = PAD_Y + blok.topMin * PX_PER_MIN
  const hoogte = Math.max(18, blok.duurMin * PX_PER_MIN)
  const breedtePct = 100 / blok.laneCount
  const titel = blok.titel ?? 'Afspraak zonder titel'
  const tijd =
    blok.eindMin !== null
      ? `${tijdLabelVanMinuten(blok.startMin)}–${tijdLabelVanMinuten(blok.eindMin)}`
      : tijdLabelVanMinuten(blok.startMin)

  return (
    <li
      aria-label={`${tijd}, ${titel}${blok.locatie ? `, ${blok.locatie}` : ''}`}
      style={{
        position: 'absolute',
        top,
        height: hoogte,
        left: `${blok.laneIndex * breedtePct}%`,
        width: `calc(${breedtePct}% - 3px)`,
        display: 'flex',
        flexWrap: 'wrap',
        alignContent: 'flex-start',
        gap: '1px 6px',
        overflow: 'hidden',
        padding: '3px 7px',
        borderRadius: 6,
        // `border` eerst, dan `borderLeft`: de linkerrand wint en wordt de dikke
        // cyaan accentbalk, de rest een dunne cyaan-getinte lijn.
        border: '1px solid color-mix(in srgb, var(--brand) 28%, transparent)',
        borderLeft: '3px solid var(--brand)',
        background: 'var(--brand-soft)',
        boxSizing: 'border-box',
      }}
    >
      <span
        className="os-cijfer"
        aria-hidden="true"
        style={{ fontSize: 11, color: 'var(--text-2)', whiteSpace: 'nowrap' }}
      >
        {tijd}
      </span>
      <span
        aria-hidden="true"
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--text-1)',
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {titel}
      </span>
    </li>
  )
}

/** De cyaan "nu"-lijn met een bolletje links — zoals Google's rode lijn. */
function NuLijn({ nuMin, vensterStartMin }: { nuMin: number; vensterStartMin: number }) {
  const top = PAD_Y + (nuMin - vensterStartMin) * PX_PER_MIN
  return (
    <li
      aria-hidden="true"
      style={{ position: 'absolute', top, left: 0, right: 0, height: 0, pointerEvents: 'none' }}
    >
      <span
        style={{
          position: 'absolute',
          left: -4,
          top: -3,
          width: 7,
          height: 7,
          borderRadius: 999,
          background: 'var(--brand)',
        }}
      />
      <span style={{ position: 'absolute', left: 0, right: 0, top: 0, borderTop: '1.5px solid var(--brand)' }} />
    </li>
  )
}
