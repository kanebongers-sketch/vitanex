'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { ChevronDown, X } from 'lucide-react'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { MENU } from '@/lib/aiyourgym/taal/woorden/club/menu'
import { TaalKeuze } from '@/components/aiyourgym/taal/TaalKeuze'
import { initialen } from './kop-hulp'
import { UitlogKnop } from './UitlogKnop'
import { VestigingKeuze } from './VestigingKeuze'
import { useVestigingen } from './VestigingenContext'

// Je naam rechtsboven (ontwerp "Club in 10 minuten"): een knop met je
// initialen, en bij meer vestigingen de vestiging waar je nu werkt. Een tik
// opent een klein paneel met de vestiging, de taal en uitloggen. Het paneel
// staat buiten de kop (ClubBalk), want de kop heeft een blur en zou een vast
// paneel anders binnen zijn eigen hoogte houden. Voor het
// master account staan daar ook de links die vroeger in de voet stonden
// (platform, systeem, supportmeldingen, website, andere sportschool). Op de pc
// een paneel onder de knop, op de telefoon een paneel boven de onderbalk.
// Escape of een tik naast het paneel sluit.

/** Wat het master account onder zijn naam heeft. */
export interface KaneLinks {
  /** Er is meer dan een sportschool om naar te wisselen. */
  andereSportschool: boolean
}

/** Het id van het paneel, voor aria-controls. */
const PANEEL_ID = 'club-naammenu'

interface NaamKnopProps {
  naam: string
  vestiging: Vestiging | null
  open: boolean
  onOpen: (open: boolean) => void
}

export function NaamKnop({ naam, vestiging, open, onOpen }: NaamKnopProps) {
  const vestigingen = useVestigingen()
  const t = useTekst(MENU)
  const huidig = vestigingen.length > 1 ? vestigingen.find((v) => v.sleutel === vestiging)?.naam : undefined
  return (
    <span className="club-naam">
      <button type="button" className="club-naam-knop" aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? PANEEL_ID : undefined} onClick={() => onOpen(!open)} title={t.naamMenu.open(naam)}>
        <span className="club-naam-rond" aria-hidden>{initialen(naam)}</span>
        <span className="club-naam-tekst">
          <span className="club-naam-wie">{naam}</span>
          {huidig && <span className="club-naam-waar">{huidig}</span>}
        </span>
        <ChevronDown aria-hidden size={15} className="club-naam-pijl" />
        <span className="club-sr">{t.naamMenu.open(naam)}</span>
      </button>
    </span>
  )
}

interface MenuPaneelProps {
  naam: string
  vestiging: Vestiging | null
  /** Zet " (pilot)" achter de standaardvestiging (alleen bij Fit Factory). */
  pilot: boolean
  /** De naam van de sportschool. */
  sportschool: string
  demo: boolean
  testomgeving: boolean
  kane: KaneLinks | null
  onSluit: () => void
  onWissel: (v: string) => void
}

export function MenuPaneel({ naam, vestiging, pilot, sportschool, demo, testomgeving, kane, onSluit, onWissel }: MenuPaneelProps) {
  const t = useTekst(MENU)
  const vestigingen = useVestigingen()
  const paneel = useRef<HTMLDivElement>(null)
  useEffect(() => {
    paneel.current?.querySelector<HTMLElement>('select, a, button')?.focus()
    const opToets = (e: KeyboardEvent) => e.key === 'Escape' && onSluit()
    window.addEventListener('keydown', opToets)
    return () => window.removeEventListener('keydown', opToets)
  }, [onSluit])
  const onder = [sportschool, demo ? t.voet.demo : null, testomgeving ? t.kop.testomgeving : null].filter(Boolean).join(' · ')
  return (
    <div className="club-naammenu-scherm" onClick={(e) => e.target === e.currentTarget && onSluit()}>
      <div ref={paneel} id={PANEEL_ID} className="club-naammenu" role="dialog" aria-label={t.naamMenu.label}>
        <div className="club-naammenu-kop">
          <span className="club-naam-rond club-naam-rond--groot" aria-hidden>{initialen(naam)}</span>
          <span className="club-naammenu-wie">
            <strong>{naam}</strong>
            <span>{onder}</span>
          </span>
          <button type="button" className="club-knop club-knop--stil club-naammenu-sluit" aria-label={t.naamMenu.sluiten} onClick={onSluit}>
            <X aria-hidden size={18} />
          </button>
        </div>
        {vestigingen.length > 1 && (
          <div className="club-naammenu-rij">
            <VestigingKeuze vestiging={vestiging} pilot={pilot} onWissel={(v) => { onWissel(v); onSluit() }} />
          </div>
        )}
        <div className="club-naammenu-rij club-naammenu-taal">
          <span>{t.naamMenu.taal}</span>
          <TaalKeuze className="club-taalkeuze" />
        </div>
        {kane && (
          <nav className="club-naammenu-kane" aria-label={t.naamMenu.platform}>
            <p>{t.naamMenu.platform}</p>
            <ul>
              <li><Link href="/club/platform" onClick={onSluit}>{t.voet.platform}</Link></li>
              <li><Link href="/club/systeem" onClick={onSluit}>{t.voet.systeem}</Link></li>
              <li><Link href="/club/hulp/meldingen" onClick={onSluit}>{t.voet.supportmeldingen}</Link></li>
              {kane.andereSportschool && <li><Link href="/club/huisstijl#sportscholen-kop" onClick={onSluit}>{t.voet.andereSportschool}</Link></li>}
              {/* Eigen root layout: Next laadt de website dan als volledige pagina. */}
              <li><Link href="/" onClick={onSluit}>{t.voet.website}</Link></li>
            </ul>
          </nav>
        )}
        <div className="club-naammenu-uit">
          <UitlogKnop />
        </div>
      </div>
    </div>
  )
}
