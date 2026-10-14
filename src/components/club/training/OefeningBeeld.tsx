import type { CSSProperties, ReactNode } from 'react'
import { ImageOff } from 'lucide-react'
import { BEELD_BRON, isBeeldPad, type BeeldBronSoort, type OefeningBeelden } from '@/lib/club/training/beeld'
import { REPDB_BRON } from '@/lib/club/training/beelden-repdb'
import './oefening-beeld.css'

// De "gif" van een oefening: begin- en eindhouding wisselen elkaar rustig af
// (alleen opacity, zie oefening-beeld.css). Twee bronnen: RepDB-illustraties
// (webp, gewone afbeelding) en Everkinetic-lijntekeningen (kleurloze SVG's als
// CSS-masker, zodat de lijnkleur uit de tokens komt). Een enkele houding staat
// stil, zonder wissel en zonder labels.
// RepDB als gewone <img> (vaste webp's van 512 x 512 uit /public; de omhullende draagt de alt).
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
  // Het pad is al genarrowd tot een eigen beeldpad; dubbel gecontroleerd omdat het in CSS belandt.
  const url = isBeeldPad(pad) ? `url("${pad}")` : 'none'
  return { WebkitMaskImage: url, maskImage: url }
}

function toegankelijk(decoratief: boolean, label: string) {
  return decoratief ? { 'aria-hidden': true } : { role: 'img', 'aria-label': label }
}

function Houding({ beeld, houding, label }: { beeld: OefeningBeelden; houding: 'start' | 'eind'; label: string }) {
  const pad = houding === 'start' ? beeld.start : beeld.eind
  return (
    <span className={`club-training-beeld-houding club-training-beeld-houding--${houding}`} aria-hidden>
      {beeld.bron === 'repdb' ? (
        <img className="club-training-beeld-foto" src={pad} alt="" width={512} height={512} loading="lazy" decoding="async" />
      ) : (
        <span className="club-training-beeld-tekening" style={masker(pad)} />
      )}
      {!beeld.enkel && <span className="club-training-beeld-label">{label}</span>}
    </span>
  )
}

export function OefeningBeeld({ naam, beeld, formaat = 'middel', accent = false, decoratief = false }: OefeningBeeldProps) {
  const basis = `club-training-beeld club-training-beeld--${formaat}`
  if (!beeld) {
    return (
      <span className={`${basis} is-leeg`} {...toegankelijk(decoratief, `Nog geen tekening van ${naam}`)}>
        <ImageOff aria-hidden size={formaat === 'klein' ? 16 : 22} />
        {formaat !== 'klein' && <span className="club-training-beeld-leegtekst">Nog geen tekening</span>}
      </span>
    )
  }
  // De accentkleur kan alleen bij de kleurloze Everkinetic-lijnen; RepDB-illustraties hebben hun eigen kleuren.
  const klassen = [
    basis,
    `is-${beeld.bron}`,
    beeld.enkel ? 'is-enkel' : '',
    accent && beeld.bron === 'everkinetic' ? 'club-training-beeld--accent' : '',
  ].filter(Boolean).join(' ')
  const label = beeld.enkel ? `Uitvoering van ${naam}` : `Beginhouding en eindhouding van ${naam}`
  return (
    <span className={klassen} {...toegankelijk(decoratief, label)}>
      <Houding beeld={beeld} houding="start" label="Begin" />
      {!beeld.enkel && <Houding beeld={beeld} houding="eind" label="Eind" />}
    </span>
  )
}

/** Voor papier: begin en eind naast elkaar als gewone afbeelding (bij een enkele houding een beeld). */
export function OefeningBeeldPrint({ naam, beeld }: { naam: string; beeld: OefeningBeelden | null }) {
  if (!beeld || !isBeeldPad(beeld.start) || !isBeeldPad(beeld.eind)) return null
  return (
    <span className={`club-training-beeldprint is-${beeld.bron}`}>
      {beeld.enkel ? (
        <img src={beeld.start} alt={`Uitvoering van ${naam}`} width={64} height={64} />
      ) : (
        <>
          <img src={beeld.start} alt={`Beginhouding van ${naam}`} width={64} height={64} />
          <img src={beeld.eind} alt={`Eindhouding van ${naam}`} width={64} height={64} />
        </>
      )}
    </span>
  )
}

const BRON_LINKS: Record<BeeldBronSoort, ReactNode> = {
  repdb: (
    <>
      Illustraties: <a href={REPDB_BRON.bron} target="_blank" rel="noopener noreferrer">RepDB (repdb.co)</a>
    </>
  ),
  everkinetic: (
    <>
      Illustraties:{' '}
      <a href={BEELD_BRON.bron} target="_blank" rel="noopener noreferrer">Everkinetic</a>,{' '}
      <a href={BEELD_BRON.licentie} target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a>
    </>
  ),
}

/** De naamsvermelding per bron die de licenties vragen. Zonder bronnen: Everkinetic (zoals voorheen). */
export function BeeldBron({ className = '', bronnen = ['everkinetic'] }: { className?: string; bronnen?: readonly BeeldBronSoort[] }) {
  if (bronnen.length === 0) return null
  return (
    <p className={`club-training-beeldbron ${className}`}>
      {bronnen.map((b, i) => (
        <span key={b}>
          {i > 0 ? ' · ' : null}
          {BRON_LINKS[b]}
        </span>
      ))}
    </p>
  )
}

/** De exacte zin die de RepDB-licentie vraagt. Een keer per scherm (bibliotheek, ledenapp). */
export function RepdbVermelding({ className = '' }: { className?: string }) {
  return (
    <p className={`club-training-beeldbron club-training-repdb ${className}`}>
      <a href={REPDB_BRON.bron} target="_blank" rel="noopener noreferrer">{REPDB_BRON.vereist}</a>
    </p>
  )
}
