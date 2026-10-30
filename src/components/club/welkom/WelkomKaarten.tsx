'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, X } from 'lucide-react'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { WELKOM } from '@/lib/aiyourgym/taal/woorden/club/welkom'
import './welkom.css'

// De eerste-keer-uitleg: hoogstens drie kaarten, een tegelijk, wegklikbaar.
// Wegklikken (kruisje of Begrepen) onthoudt het account (migratie 476, via
// `opslaan`), zodat hij op geen enkel apparaat terugkomt; de browser onthoudt
// het ook, voor het master account zonder profiel en als opslaan niet lukt.
// Pas na het lezen van de browseropslag zichtbaar, zodat er niets knippert.

export interface WelkomKaart {
  kop: string
  tekst: string
  knop: string
  /** Waar de knop heen gaat; null = geen knop (de kaart gaat over dit scherm). */
  href: string | null
}

interface Props {
  sleutel: string
  kaarten: readonly WelkomKaart[]
  /** Waar het wegklikken per account wordt bewaard, met de code ("trainer:v1"). */
  opslaan?: { url: string; code: string } | null
}

/** Per account bewaren; mislukt het, dan geldt de browseropslag (al gezet). */
function bewaarBijAccount(opslaan: { url: string; code: string }): void {
  void fetch(opslaan.url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code: opslaan.code }) }).catch(() => {
    // Geen verbinding: de browser onthoudt het al; het account de volgende keer.
  })
}

function leesWeg(sleutel: string): boolean {
  try {
    return window.localStorage.getItem(sleutel) === 'weg'
  } catch {
    return false
  }
}

function bewaarWeg(sleutel: string): void {
  try {
    window.localStorage.setItem(sleutel, 'weg')
  } catch {
    // Opslag geblokkeerd: dan is de uitleg alleen deze keer weg.
  }
}

export function WelkomKaarten({ sleutel, kaarten, opslaan = null }: Props) {
  const teksten = useTekst(WELKOM)
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState(0)

  useEffect(() => {
    setOpen(!leesWeg(sleutel))
  }, [sleutel])

  if (!open || kaarten.length === 0) return null
  const kaart = kaarten[Math.min(index, kaarten.length - 1)]
  const laatste = index >= kaarten.length - 1

  function sluit() {
    bewaarWeg(sleutel)
    if (opslaan) bewaarBijAccount(opslaan)
    setOpen(false)
  }

  return (
    <section className="club-welkom" aria-label={teksten.label} aria-live="polite">
      <div className="club-welkom-boven">
        <p className="club-welkom-label">
          {teksten.label} <span>{teksten.stap(index + 1, kaarten.length)}</span>
        </p>
        <button type="button" className="club-welkom-sluit" onClick={sluit} aria-label={teksten.sluiten}>
          <X aria-hidden size={18} />
        </button>
      </div>
      <div className="club-welkom-kaart" key={index}>
        <h2 className="club-welkom-kop">{kaart.kop}</h2>
        <p className="club-welkom-tekst">{kaart.tekst}</p>
      </div>
      <div className="club-welkom-voet">
        <ol className="club-welkom-punten" aria-hidden>
          {kaarten.map((k, i) => (
            <li key={k.kop} data-hier={i === index || undefined} data-gezien={i < index || undefined} />
          ))}
        </ol>
        <div className="club-welkom-acties">
          {kaart.href && (
            <Link href={kaart.href} className="club-knop club-knop--stil club-knop--klein" onClick={laatste ? sluit : undefined}>
              {kaart.knop}
            </Link>
          )}
          {laatste ? (
            <button type="button" className="club-knop club-knop--primair club-knop--klein" onClick={sluit}>
              {teksten.klaar}
            </button>
          ) : (
            <button type="button" className="club-knop club-knop--primair club-knop--klein" onClick={() => setIndex(index + 1)}>
              {teksten.volgende} <ArrowRight aria-hidden size={16} />
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
