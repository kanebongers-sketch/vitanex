'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { AgendaDag } from '@/lib/lifeos/agenda/agenda'
import { datumSleutel, leesDatumSleutel } from '@/lib/lifeos/datum/datum'
import {
  bepaalVenster,
  bouwRoosterMetVenster,
  minutenSindsMiddernacht,
  tijdLabelVanMinuten,
  uurLijnen,
} from '@/lib/lifeos/agenda/rooster'
import { PAD_Y, PX_PER_MIN, SECTIE_LABEL } from './RoosterBlok'
import { DagKolom, type DagLabel } from './DagKolom'

// De meerdaagse rooster-grid: één gedeelde uur-as links en N dagkolommen ernaast,
// op hetzelfde GEDEELDE venster zodat de uur-rijen over de kolommen uitlijnen.
// Presentationeel — de data komt van AgendaDagenRooster. De enige eigen staat is
// de nu-lijn (pas ná mount gelezen, geen hydration-mismatch) en de auto-scroll.
//
// Layout: een CSS-grid met `minmax(kolom, 1fr)`-kolommen. Passen de kolommen? Dan
// vullen ze de kaart. Passen ze niet (smalle kaart)? Dan scrollt het geheel
// horizontaal en blijft de uur-as links plakken (sticky). Verticaal scrollt het
// rooster binnen een max-hoogte, met de dag-koppen sticky bovenaan.

const GUTTER = 52
const KOL_MIN = 132
const KOP_HOOGTE = 36
const HELEDAG_HOOGTE = 30
const MAX_HOOGTE = 420

interface DagenRoosterGridProps {
  dagen: AgendaDag[]
}

export function DagenRoosterGrid({ dagen }: DagenRoosterGridProps) {
  // Gedeeld venster over álle dagen, en per dag een rooster op dát venster.
  const venster = useMemo(() => bepaalVenster(dagen.map((d) => d.afspraken)), [dagen])
  const roosters = useMemo(
    () => dagen.map((d) => ({ dag: d.dag, rooster: bouwRoosterMetVenster(d.afspraken, venster) })),
    [dagen, venster],
  )

  const heeftIets = roosters.some(
    (r) => r.rooster.blokken.length > 0 || r.rooster.heleDag.length > 0,
  )
  const bandHoogte = roosters.some((r) => r.rooster.heleDag.length > 0) ? HELEDAG_HOOGTE : 0

  const hoogte = PAD_Y * 2 + (venster.eindMin - venster.startMin) * PX_PER_MIN
  const uren = useMemo(() => uurLijnen(venster.startMin, venster.eindMin), [venster])

  const scrollRef = useRef<HTMLDivElement>(null)
  const scrollGedaan = useRef(false)
  // null tot ná mount: de nu-lijn en de "vandaag"-markering lezen de klok pas in
  // de browser, zodat een (theoretische) server-render niet afwijkt.
  const [nuMin, setNuMin] = useState<number | null>(null)
  const [vandaagSleutel, setVandaagSleutel] = useState<string | null>(null)

  const eersteBlokStartMin = useMemo(() => {
    const starts = roosters.flatMap((r) => r.rooster.blokken.map((b) => b.startMin))
    return starts.length > 0 ? Math.min(...starts) : null
  }, [roosters])

  useEffect(() => {
    const el = scrollRef.current

    const werkBij = () => {
      const nu = new Date()
      const sleutel = datumSleutel(nu)
      setVandaagSleutel(sleutel)

      const min = minutenSindsMiddernacht(nu)
      const toontVandaag = dagen.some((d) => d.dag === sleutel)
      const binnenVenster = min >= venster.startMin && min <= venster.eindMin
      setNuMin(toontVandaag && binnenVenster ? min : null)

      // Eén keer: scroll naar "nu" (indien in beeld), anders naar de eerste
      // afspraak. Direct gezet (geen smooth-animatie) — rustig en daarmee
      // vanzelf reduced-motion-vriendelijk. De sticky kop dekt de bovenste
      // ~kopHoogte px, dus we tellen de band mee en laten wat lucht (−40).
      if (!scrollGedaan.current && el) {
        const doelMin =
          toontVandaag && binnenVenster ? min : (eersteBlokStartMin ?? venster.startMin)
        el.scrollTop = Math.max(0, bandHoogte + PAD_Y + (doelMin - venster.startMin) * PX_PER_MIN - 40)
        scrollGedaan.current = true
      }
    }

    werkBij()
    // Ruime tik: de nu-lijn hoeft niet per seconde te bewegen. Geen storm.
    const id = setInterval(werkBij, 60_000)
    return () => clearInterval(id)
  }, [dagen, venster, eersteBlokStartMin, bandHoogte])

  if (!heeftIets) {
    return (
      <section aria-label="Meerdaags tijdrooster">
        <p style={SECTIE_LABEL}>Tijdlijn — {dagen.length} dagen</p>
        <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0 }}>
          Niets gepland de komende dagen.
        </p>
      </section>
    )
  }

  return (
    <section aria-label="Meerdaags tijdrooster">
      <p style={SECTIE_LABEL}>Tijdlijn — {dagen.length} dagen</p>
      <div
        ref={scrollRef}
        style={{
          maxHeight: MAX_HOOGTE,
          overflow: 'auto',
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius-sm, 10px)',
          background: 'var(--bg-app)',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `${GUTTER}px repeat(${dagen.length}, minmax(${KOL_MIN}px, 1fr))`,
          }}
        >
          {/* Gedeelde uur-as: sticky links, blijft in beeld bij horizontaal scrollen. */}
          <div style={{ position: 'sticky', left: 0, zIndex: 3, background: 'var(--bg-app)' }}>
            <div
              style={{
                position: 'sticky',
                top: 0,
                zIndex: 1,
                height: KOP_HOOGTE,
                background: 'var(--bg-app)',
                borderBottom: '1px solid var(--line)',
              }}
            />
            {bandHoogte > 0 ? (
              <div style={{ height: bandHoogte, borderBottom: '1px solid var(--line)' }} />
            ) : null}
            <div style={{ position: 'relative', height: hoogte }}>
              {uren.map((min) => (
                <span
                  key={min}
                  className="os-cijfer"
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: PAD_Y + (min - venster.startMin) * PX_PER_MIN,
                    transform: 'translateY(-50%)',
                    fontSize: 10,
                    color: 'var(--text-4)',
                  }}
                >
                  {tijdLabelVanMinuten(min)}
                </span>
              ))}
            </div>
          </div>

          {roosters.map(({ dag, rooster }) => (
            <DagKolom
              key={dag}
              label={dagLabel(dag, vandaagSleutel)}
              rooster={rooster}
              isVandaag={vandaagSleutel === dag}
              nuMin={nuMin}
              uren={uren}
              hoogte={hoogte}
              vensterStartMin={venster.startMin}
              bandHoogte={bandHoogte}
              kopHoogte={KOP_HOOGTE}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

/**
 * Kort + lang label voor een dagkolom. "vandaag"/"morgen" krijgen een naam;
 * de rest een weekdag + datumnummer ("wo 22"). De lange vorm ("woensdag 22 juli")
 * voedt de kop-tooltip en het groep-`aria-label`. Client-side (na mount is
 * `vandaagSleutel` bekend), dus `toLocaleDateString` geeft geen hydration-verschil.
 */
function dagLabel(dagSleutel: string, vandaagSleutel: string | null): DagLabel {
  const d = leesDatumSleutel(dagSleutel)
  if (!d) return { kort: dagSleutel, lang: dagSleutel }

  const lang = d.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })

  if (vandaagSleutel !== null) {
    if (dagSleutel === vandaagSleutel) return { kort: 'vandaag', lang: `vandaag — ${lang}` }
    const morgen = new Date(d)
    morgen.setDate(morgen.getDate() - 1)
    if (datumSleutel(morgen) === vandaagSleutel) return { kort: 'morgen', lang: `morgen — ${lang}` }
  }

  const weekdag = d.toLocaleDateString('nl-NL', { weekday: 'short' }).replace('.', '')
  return { kort: `${weekdag} ${d.getDate()}`, lang }
}
