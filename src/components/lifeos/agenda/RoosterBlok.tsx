'use client'

import type { CSSProperties } from 'react'
import { blokStijlVoorKleur } from '@/lib/lifeos/agenda/kleur'
import {
  tijdLabelVanMinuten,
  type HeleDagAfspraak,
  type RoosterBlok as RoosterBlokData,
} from '@/lib/lifeos/agenda/rooster'

// Gedeelde presentatie-primitieven voor het tijdrooster: één afspraak-blok en de
// hele-dag-chips. Zowel de losse dagkolom (DagKolom) als de gedeelde uur-as
// (DagenRoosterGrid) tekenen hiermee — één bron voor de blok-kleur, het contrast
// en de tijdlabels, zodat de meerdaagse weergave consistent blijft met de dag.

/** Schaal: 0,8px per minuut → uur-rijen van 48px, à la Google's dagweergave. */
export const PX_PER_MIN = 0.8
/** Verticale marge binnen het rooster-body, zodat de rand-labels niet afknippen. */
export const PAD_Y = 10

/** Het kleine, uppercase sectielabel dat boven de rooster-onderdelen staat. */
export const SECTIE_LABEL: CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--text-4)',
  margin: '0 0 8px',
}

interface RoosterBlokItemProps {
  blok: RoosterBlokData
  /**
   * Optioneel dag-voorvoegsel voor het `aria-label` ("wo 22, 10:00–11:00, Titel").
   * In de meerdaagse weergave draagt élk blok zijn dag, zodat een screenreader-
   * gebruiker niet op kolom-positie hoeft te vertrouwen.
   */
  dagLabel?: string
}

/**
 * Eén afspraak-blok op zijn plek en in zijn lane-kolom, in de kleur van zijn
 * agenda. De tekst is wit óf donker — dat wat het beste contrasteert met de
 * bloklichtheid (WCAG, `blokStijlVoorKleur`). Zonder kleur valt het blok terug op
 * de cyaan-stijl. Kleur draagt nooit alléén betekenis: de titel staat in het blok
 * én in het `aria-label`.
 */
export function RoosterBlokItem({ blok, dagLabel }: RoosterBlokItemProps) {
  const top = PAD_Y + blok.topMin * PX_PER_MIN
  const hoogte = Math.max(18, blok.duurMin * PX_PER_MIN)
  const breedtePct = 100 / blok.laneCount
  const titel = blok.titel ?? 'Afspraak zonder titel'
  const tijd =
    blok.eindMin !== null
      ? `${tijdLabelVanMinuten(blok.startMin)}–${tijdLabelVanMinuten(blok.eindMin)}`
      : tijdLabelVanMinuten(blok.startMin)

  const stijl = blokStijlVoorKleur(blok.kleur)
  // Gekleurd: agenda-kleur als achtergrond, tekst in de best-contrasterende tint.
  // Geen kleur: de vertrouwde cyaan-stijl.
  const kleurStijl: CSSProperties = stijl
    ? {
        background: stijl.achtergrond,
        border: `1px solid color-mix(in srgb, ${stijl.rand} 45%, var(--bg-app))`,
        borderLeft: `3px solid ${stijl.rand}`,
      }
    : {
        // `border` eerst, dan `borderLeft`: de linkerrand wint als accentbalk.
        border: '1px solid color-mix(in srgb, var(--brand) 28%, transparent)',
        borderLeft: '3px solid var(--brand)',
        background: 'var(--brand-soft)',
      }
  const tijdKleur = stijl ? stijl.tekst : 'var(--text-2)'
  const titelKleur = stijl ? stijl.tekst : 'var(--text-1)'

  const label = `${dagLabel ? `${dagLabel}, ` : ''}${tijd}, ${titel}${blok.locatie ? `, ${blok.locatie}` : ''}`

  return (
    <li
      aria-label={label}
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
        boxSizing: 'border-box',
        ...kleurStijl,
      }}
    >
      <span
        className="os-cijfer"
        aria-hidden="true"
        style={{ fontSize: 11, color: tijdKleur, opacity: stijl ? 0.85 : 1, whiteSpace: 'nowrap' }}
      >
        {tijd}
      </span>
      <span
        aria-hidden="true"
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: titelKleur,
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

/**
 * Eén hele-dag-event als chip: een kleur-stipje in de eigen agenda-kleur en een
 * subtiel getinte rand. Zonder kleur valt de chip terug op de cyaan-stijl.
 */
export function HeleDagChip({ titel, kleur }: { titel: string | null; kleur: string | null }) {
  const stijl = blokStijlVoorKleur(kleur)
  const rand = stijl?.rand ?? 'var(--brand)'
  const naam = titel ?? 'Afspraak zonder titel'
  return (
    <li
      aria-label={`Hele dag: ${naam}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        maxWidth: '100%',
        fontSize: 12,
        color: 'var(--text-1)',
        padding: '3px 10px',
        borderRadius: 999,
        border: `1px solid color-mix(in srgb, ${rand} 40%, transparent)`,
        background: `color-mix(in srgb, ${rand} 16%, transparent)`,
      }}
    >
      <span
        aria-hidden="true"
        style={{ width: 7, height: 7, borderRadius: 999, background: rand, flexShrink: 0 }}
      />
      <span
        style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
      >
        {naam}
      </span>
    </li>
  )
}

/** De hele-dag-events als een rij chips (voor de losse dagweergave). */
export function HeleDagStrook({ items }: { items: HeleDagAfspraak[] }) {
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
        <HeleDagChip key={item.id} titel={item.titel} kleur={item.kleur} />
      ))}
    </ul>
  )
}
