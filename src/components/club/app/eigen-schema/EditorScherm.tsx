'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { EIGEN_SCHEMA } from '@/lib/aiyourgym/taal/woorden/ledenapp/eigen-schema'

// Het volle scherm voor het eigen schema: bovenin sluiten en de naam, in het
// midden de inhoud (scrolt), onderin altijd de hoofdknop binnen bereik van de
// duim. Sluiten met wijzigingen vraagt eerst of ze weg mogen.

interface Props {
  /** Zonder naam (snelle start): een gewone titel. */
  naam?: string
  onNaam?: (naam: string) => void
  titel?: string
  gewijzigd: boolean
  onSluit: () => void
  voet?: ReactNode
  children: ReactNode
}

/** Escape in een blad erboven (de bibliotheek) sluit alleen dat blad. */
function inBlad(doel: EventTarget): boolean {
  return doel instanceof Element && doel.closest('.club-lidapp-blad-scherm') !== null
}

export function EditorScherm({ naam, onNaam, titel, gewijzigd, onSluit, voet, children }: Props) {
  const t = useTekst(EIGEN_SCHEMA).editor
  const [vraag, setVraag] = useState(false)
  const scherm = useRef<HTMLDivElement>(null)

  function sluit() {
    if (gewijzigd) setVraag(true)
    else onSluit()
  }

  useEffect(() => {
    const vorige = document.activeElement instanceof HTMLElement ? document.activeElement : null
    scherm.current?.focus()
    // De pagina eronder scrolt niet mee.
    const oud = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = oud
      vorige?.focus()
    }
  }, [])

  return (
    <div ref={scherm} className="club-es-scherm" role="dialog" aria-modal="true" aria-label={naam ?? titel} tabIndex={-1} onKeyDown={(e) => e.key === 'Escape' && !inBlad(e.target) && sluit()}>
      <header className="club-es-scherm-kop">
        <button type="button" className="club-lidapp-blad-sluit" onClick={sluit} aria-label={t.sluiten}>
          <X aria-hidden size={20} />
        </button>
        {onNaam && naam !== undefined ? (
          <label className="club-es-naam">
            <span className="club-sr">{t.naam}</span>
            <input value={naam} maxLength={80} placeholder={t.nieuweNaam} onChange={(e) => onNaam(e.target.value)} />
          </label>
        ) : (
          <h2 className="club-es-titel">{titel}</h2>
        )}
      </header>
      <div className="club-es-scherm-inhoud">{children}</div>
      {voet && <footer className="club-es-scherm-voet">{voet}</footer>}
      {vraag && (
        <div className="club-es-vraag" role="alertdialog" aria-modal="true" aria-label={t.wegGooien}>
          <div>
            <p>{t.wegGooien}</p>
            <button type="button" className="club-lidapp-knop club-lidapp-knop--primair" onClick={() => setVraag(false)} autoFocus>{t.doorgaan}</button>
            <button type="button" className="club-lidapp-knop" onClick={onSluit}>{t.jaWeg}</button>
          </div>
        </div>
      )}
    </div>
  )
}
