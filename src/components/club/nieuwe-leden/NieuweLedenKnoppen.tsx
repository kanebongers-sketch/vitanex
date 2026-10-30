'use client'

import { useRef, useState, type ReactNode, type RefObject } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { List, QrCode, UserPlus, X } from 'lucide-react'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { NIEUWE_LEDEN } from '@/lib/aiyourgym/taal/woorden/club/nieuwe-leden'
import { LidToevoegen } from './LidToevoegen'
import { AanmeldlinkMaken } from './AanmeldlinkMaken'
import './nieuwe-leden.css'

// De twee knoppen voor nieuwe leden, boven de ledenlijst en op Vandaag: een
// klik op "Lid toevoegen" of "Aanmeldlink" en het venster staat open. Een
// venster per actie (native <dialog>: focus, Escape en achtergrond gratis).

export interface VormKeuze {
  id: string
  naam: string
}

interface Props {
  vestiging: string
  vormen: VormKeuze[]
  sportschool: string
  /** Het adres van de sportschool, voor de aanmeldlink. */
  basis: string
  mailKlaar: boolean
  /** Pad naar de ledenkaart met __id__. */
  ledenkaart: string
  /** Pad naar alle aanmeldlinks van deze vestiging. */
  linksHref: string
  /** Op Vandaag ook de link naar alle aanmeldlinks. */
  metLijst?: boolean
}

function Venster({ venster, titel, uitleg, sluit, children }: { venster: RefObject<HTMLDialogElement | null>; titel: string; uitleg: string; sluit: string; children: ReactNode }) {
  return (
    <dialog ref={venster} className="club-nl-venster" aria-label={titel}>
      <header className="club-nl-kop">
        <div>
          <h2>{titel}</h2>
          <p>{uitleg}</p>
        </div>
        <button type="button" className="club-nl-sluit" onClick={() => venster.current?.close()} aria-label={sluit}><X size={18} aria-hidden /></button>
      </header>
      {children}
    </dialog>
  )
}

export function NieuweLedenKnoppen({ vestiging, vormen, sportschool, basis, mailKlaar, ledenkaart, linksHref, metLijst = false }: Props) {
  const t = useTekst(NIEUWE_LEDEN)
  const router = useRouter()
  const lidVenster = useRef<HTMLDialogElement>(null)
  const linkVenster = useRef<HTMLDialogElement>(null)
  // Een nieuwe sleutel bij elke keer openen: het formulier begint dan leeg.
  const [ronde, setRonde] = useState(0)

  function open(venster: RefObject<HTMLDialogElement | null>) {
    setRonde((r) => r + 1)
    venster.current?.showModal()
  }

  return (
    <div className="club-nl-knoppen">
      <button type="button" className="club-knop club-knop--primair" onClick={() => open(lidVenster)}>
        <UserPlus size={16} aria-hidden /> {t.knoppen.toevoegen}
      </button>
      <button type="button" className="club-knop" onClick={() => open(linkVenster)}>
        <QrCode size={16} aria-hidden /> {t.knoppen.link}
      </button>
      {metLijst && (
        <Link href={linksHref} className="club-knop club-knop--stil">
          <List size={16} aria-hidden /> {t.vandaag.alleLinks}
        </Link>
      )}
      <Venster venster={lidVenster} titel={t.toevoegen.kop} uitleg={t.toevoegen.uitleg} sluit={t.toevoegen.sluiten}>
        <LidToevoegen key={`lid-${ronde}`} vestiging={vestiging} vormen={vormen} sportschool={sportschool} ledenkaart={(id) => ledenkaart.replace('__id__', encodeURIComponent(id))} onToegevoegd={() => router.refresh()} />
      </Venster>
      <Venster venster={linkVenster} titel={t.link.kop} uitleg={t.link.uitleg} sluit={t.qr.sluit}>
        <AanmeldlinkMaken key={`link-${ronde}`} vestiging={vestiging} vormen={vormen} sportschool={sportschool} basis={basis} mailKlaar={mailKlaar} onGemaakt={() => router.refresh()} />
      </Venster>
    </div>
  )
}
