import type { CSSProperties } from 'react'
import { ImageOff } from 'lucide-react'
import { BEELD_BRON, isBeeldPad, type OefeningBeelden } from '@/lib/club/training/beeld'
import './oefening-beeld.css'

// De "gif" van een oefening: begin- en eindhouding wisselen elkaar rustig af
// (alleen opacity, zie oefening-beeld.css). De tekeningen zijn kleurloze SVG's;
// we gebruiken ze als CSS-masker, zodat de lijnkleur uit de tokens komt.
// Bij prefers-reduced-motion staan beide houdingen naast elkaar met labels.
// Vaste beeldverhouding: geen verschuiving als de tekening binnenkomt.

export type BeeldFormaat = 'klein' | 'middel' | 'groot'

interface OefeningBeeldProps {
  naam: string
  beeld: OefeningBeelden | null
  formaat?: BeeldFormaat
  /** Lijnen in het merkaccent (brons) in plaats van licht. */
  accent?: boolean
  /** Staat de naam er al naast (knop, rij)? Dan is de tekening voor schermlezers decoratie. */
  decoratief?: boolean
}

function masker(pad: string): CSSProperties {
  // Het pad is al genarrowd tot /club/oefeningen/<nr>-start|eind.svg; dubbel gecontroleerd omdat het in CSS belandt.
  const url = isBeeldPad(pad) ? `url("${pad}")` : 'none'
  return { WebkitMaskImage: url, maskImage: url }
}

function toegankelijk(decoratief: boolean, label: string) {
  return decoratief ? { 'aria-hidden': true } : { role: 'img', 'aria-label': label }
}

export function OefeningBeeld({ naam, beeld, formaat = 'middel', accent = false, decoratief = false }: OefeningBeeldProps) {
  const klassen = `club-training-beeld club-training-beeld--${formaat}${accent ? ' club-training-beeld--accent' : ''}`
  if (!beeld) {
    return (
      <span className={`${klassen} is-leeg`} {...toegankelijk(decoratief, `Nog geen tekening van ${naam}`)}>
        <ImageOff aria-hidden size={formaat === 'klein' ? 16 : 22} />
        {formaat !== 'klein' && <span className="club-training-beeld-leegtekst">Nog geen tekening</span>}
      </span>
    )
  }
  return (
    <span className={klassen} {...toegankelijk(decoratief, `Beginhouding en eindhouding van ${naam}`)}>
      <span className="club-training-beeld-houding club-training-beeld-houding--start" aria-hidden>
        <span className="club-training-beeld-tekening" style={masker(beeld.start)} />
        <span className="club-training-beeld-label">Begin</span>
      </span>
      <span className="club-training-beeld-houding club-training-beeld-houding--eind" aria-hidden>
        <span className="club-training-beeld-tekening" style={masker(beeld.eind)} />
        <span className="club-training-beeld-label">Eind</span>
      </span>
    </span>
  )
}

/** Voor papier: begin en eind naast elkaar als gewone afbeelding (zwart op wit). */
export function OefeningBeeldPrint({ naam, beeld }: { naam: string; beeld: OefeningBeelden | null }) {
  if (!beeld || !isBeeldPad(beeld.start) || !isBeeldPad(beeld.eind)) return null
  return (
    <span className="club-training-beeldprint">
      <img src={beeld.start} alt={`Beginhouding van ${naam}`} width={64} height={64} />
      <img src={beeld.eind} alt={`Eindhouding van ${naam}`} width={64} height={64} />
    </span>
  )
}

/** De naamsvermelding die de licentie (CC BY-SA 4.0) vraagt. */
export function BeeldBron({ className = '' }: { className?: string }) {
  return (
    <p className={`club-training-beeldbron ${className}`}>
      Illustraties:{' '}
      <a href={BEELD_BRON.bron} target="_blank" rel="noopener noreferrer">Everkinetic</a>,{' '}
      <a href={BEELD_BRON.licentie} target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a>
    </p>
  )
}
