'use client'

import { useId, useState, type CSSProperties, type ReactNode } from 'react'
import { Check, ChevronDown, Star, Trash2 } from 'lucide-react'
import { geenOordeelZin } from '@/lib/lifeos/taken/feiten'
import type { TaakOordeel } from '@/lib/lifeos/taken/prioriteit'
import type { Taak, Top3Positie } from '@/lib/lifeos/taken/taken'
import { IconKnop } from './IconKnop'

// Eén regel van de volledige takenlijst. Presentationeel: hij kent geen fetch,
// alleen dat er afgevinkt, gewijzigd en verwijderd kan worden. De knoppen rechts
// zijn rustig — ze verschijnen bij hover of focus, niet permanent, zodat de
// lijst niet schreeuwt.
//
// ─── DE RIJ VERZINT NOOIT EEN POSITIE ───────────────────────────────────────
//
//   Een taak zonder score staat niet stilletjes onderaan alsof hij onbelangrijk
//   is: hij zegt zélf welk feit ontbreekt. Dat is het verschil tussen "dit doet
//   er niet toe" en "ik weet het niet" — en alleen het tweede is waar.

interface TaakRijProps {
  oordeel: TaakOordeel
  onVink: (taak: Taak) => void
  onVerwijder: (taak: Taak) => void
  /**
   * De laagste vrije top-3-plek. Weglaten = geen ster op deze rij (bv. in
   * 'Later': de top-3 gaat over vandaag). `null` = de top-3 is vol.
   *
   * De taken die al ín de top-3 staan komen hier niet langs — die staan in
   * `Top3Sectie`, mét hun eigen knop om zich los te maken. Deze ster zet er dus
   * alleen taken ín, en dat is precies één betekenis per knop.
   */
  vrijePositie?: Top3Positie | null
  onTop3?: (taak: Taak, positie: Top3Positie | null) => void
  /** Het detail (`TaakDetail`) als slot: de rij weet niet wat erin zit. */
  detail?: ReactNode
}

export function TaakRij({ oordeel, onVink, onVerwijder, vrijePositie, onTop3, detail }: TaakRijProps) {
  const [hover, setHover] = useState(false)
  const [vinkHover, setVinkHover] = useState(false)
  const [knopFocus, setKnopFocus] = useState(false)
  const [open, setOpen] = useState(false)
  const detailId = useId()

  const taak = oordeel.taak
  const toonKnoppen = hover || knopFocus || open
  const rand = taak.klaar || vinkHover ? 'var(--brand)' : 'var(--line-strong)'

  return (
    <li
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ borderTop: '1px solid var(--line)' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0' }}>
        <button
          type="button"
          role="checkbox"
          aria-checked={taak.klaar}
          aria-label={`${taak.titel} — ${taak.klaar ? 'afgevinkt' : 'afvinken'}`}
          onClick={() => onVink(taak)}
          onMouseEnter={() => setVinkHover(true)}
          onMouseLeave={() => setVinkHover(false)}
          style={{
            ...VINK,
            borderColor: rand,
            background: taak.klaar ? 'var(--brand-soft)' : 'transparent',
          }}
        >
          <Check
            size={13}
            strokeWidth={3}
            aria-hidden="true"
            style={{
              color: 'var(--brand)',
              opacity: taak.klaar ? 1 : vinkHover ? 0.4 : 0,
              transition: 'opacity 150ms var(--ease)',
            }}
          />
        </button>

        <span style={{ flex: 1, minWidth: 0, display: 'grid', gap: 3 }}>
          <span
            style={{
              ...TITEL,
              color: taak.klaar ? 'var(--text-4)' : 'var(--text-1)',
              textDecoration: taak.klaar ? 'line-through' : 'none',
            }}
          >
            {taak.titel}
          </span>
          {taak.klaar ? null : <Meta oordeel={oordeel} />}
        </span>

        {onTop3 ? (
          <SterKnop
            taak={taak}
            vrijePositie={vrijePositie ?? null}
            zichtbaar={toonKnoppen}
            onTop3={onTop3}
            onFocusWissel={setKnopFocus}
          />
        ) : null}

        {detail ? (
          <IconKnop
            label={`${taak.titel} — details ${open ? 'sluiten' : 'openen'}`}
            zichtbaar={toonKnoppen}
            aria-expanded={open}
            aria-controls={detailId}
            onClick={() => setOpen((o) => !o)}
            onFocusWissel={setKnopFocus}
          >
            <ChevronDown
              size={15}
              strokeWidth={2}
              aria-hidden="true"
              style={{
                transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 180ms var(--ease)',
              }}
            />
          </IconKnop>
        ) : null}

        <IconKnop
          label={`${taak.titel} verwijderen`}
          zichtbaar={toonKnoppen}
          onClick={() => onVerwijder(taak)}
          onFocusWissel={setKnopFocus}
        >
          <Trash2 size={14} strokeWidth={2} aria-hidden="true" />
        </IconKnop>
      </div>

      {detail && open ? <div id={detailId}>{detail}</div> : null}
    </li>
  )
}

/**
 * De regel onder de titel: waarom staat deze taak hier?
 *
 * Met een score tonen we de redenen in woorden en niet het getal: "Deadline is
 * morgen" is bruikbaar, "73" is een dashboard. Zonder score staat er wélk feit
 * ontbreekt — nooit een verzonnen positie.
 */
function Meta({ oordeel }: { oordeel: TaakOordeel }) {
  if (oordeel.score === null) {
    return <span style={{ ...META, color: 'var(--text-4)' }}>{geenOordeelZin(oordeel.ontbreekt)}</span>
  }
  // Hooguit twee redenen: dit staat onder een titel, het is geen rapport.
  return <span style={META}>{oordeel.redenen.slice(0, 2).join(' · ')}</span>
}

interface SterKnopProps {
  taak: Taak
  vrijePositie: Top3Positie | null
  zichtbaar: boolean
  onTop3: (taak: Taak, positie: Top3Positie | null) => void
  onFocusWissel: (aan: boolean) => void
}

/**
 * De knop die de top-3 bedienbaar maakt — precies wat er tot nu toe ontbrak.
 *
 * Twee standen, allebei waar: er is ruimte (klik = op de laagste vrije plek), of
 * de top-3 is vol (uitgezet, mét de reden — niet stil niets doen). Drie is drie.
 */
function SterKnop({ taak, vrijePositie, zichtbaar, onTop3, onFocusWissel }: SterKnopProps) {
  const vol = vrijePositie === null

  return (
    <IconKnop
      label={vol ? 'Je top-3 is vol — haal er eerst een taak uit' : `${taak.titel} in je top-3 zetten`}
      titel={vol ? 'Je top-3 is vol. Drie is drie.' : undefined}
      zichtbaar={zichtbaar}
      disabled={vol}
      onClick={() => onTop3(taak, vrijePositie)}
      onFocusWissel={onFocusWissel}
    >
      <Star size={14} strokeWidth={2} aria-hidden="true" />
    </IconKnop>
  )
}

const VINK: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 20,
  height: 20,
  marginTop: 1,
  flexShrink: 0,
  padding: 0,
  borderRadius: 6,
  border: '1px solid var(--line-strong)',
  cursor: 'pointer',
  transition: 'border-color 180ms var(--ease), background 180ms var(--ease)',
}

const TITEL: CSSProperties = {
  fontSize: 14,
  lineHeight: 1.4,
  overflowWrap: 'anywhere',
  transition: 'color 180ms var(--ease)',
}

const META: CSSProperties = {
  fontSize: 11.5,
  lineHeight: 1.4,
  color: 'var(--text-3)',
  overflowWrap: 'anywhere',
}

