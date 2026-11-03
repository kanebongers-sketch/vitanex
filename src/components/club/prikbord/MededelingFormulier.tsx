'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import type { VestigingInfo } from '@/lib/club/kern/vestigingen'
import type { Rol } from '@/lib/club/rollen/typen'
import { GRENZEN } from '@/lib/club/prikbord/typen'
import { stuur } from '@/components/club/leden/stuur'
import { DoelgroepKiezer } from './DoelgroepKiezer'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { PRIKBORD } from '@/lib/aiyourgym/taal/woorden/club/prikbord'

// Een mededeling aan het team schrijven: titel, bericht, voor wie, en of hij
// gelezen en bevestigd moet worden. Na plaatsen ververst de pagina.

interface Props {
  vestigingen: readonly VestigingInfo[]
  onKlaar: () => void
}

export function MededelingFormulier({ vestigingen, onKlaar }: Props) {
  const t = useTekst(PRIKBORD).formulier
  const router = useRouter()
  const [titel, setTitel] = useState('')
  const [inhoud, setInhoud] = useState('')
  const [gekozenVestigingen, setVestigingen] = useState<string[]>([])
  const [rollen, setRollen] = useState<Rol[]>([])
  const [verplicht, setVerplicht] = useState(false)
  const [verlooptOp, setVerlooptOp] = useState('')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)

  async function plaats(e: FormEvent) {
    e.preventDefault()
    if (bezig) return
    setBezig(true)
    setFout(null)
    const uit = await stuur('/api/club/prikbord/mededelingen', 'POST', { titel, inhoud, vestigingen: gekozenVestigingen, rollen, verplicht, verlooptOp: verlooptOp || null })
    setBezig(false)
    if (!uit.ok) return setFout(uit.fout)
    onKlaar()
    router.refresh()
  }

  return (
    <form className="pb-formulier club-kaart club-kaart--vlak" onSubmit={(e) => void plaats(e)}>
      <label className="club-veld">
        <span>{t.titel}</span>
        <input className="club-invoer" value={titel} onChange={(e) => setTitel(e.target.value)} maxLength={GRENZEN.titel} required />
      </label>
      <label className="club-veld">
        <span>{t.inhoud}</span>
        <textarea className="club-invoer" value={inhoud} onChange={(e) => setInhoud(e.target.value)} maxLength={GRENZEN.inhoud} placeholder={t.inhoudPlaats} rows={4} />
      </label>
      <DoelgroepKiezer vestigingen={vestigingen} gekozenVestigingen={gekozenVestigingen} gekozenRollen={rollen} onVestigingen={setVestigingen} onRollen={setRollen} />
      <label className="pb-vink">
        <input type="checkbox" checked={verplicht} onChange={(e) => setVerplicht(e.target.checked)} />
        <span>
          <b>{t.verplicht}</b>
          <span className="club-hint">{t.verplichtUitleg}</span>
        </span>
      </label>
      <label className="club-veld pb-smal">
        <span>{t.verloopt}</span>
        <input className="club-invoer" type="date" value={verlooptOp} onChange={(e) => setVerlooptOp(e.target.value)} />
      </label>
      {fout ? (
        <p className="club-melding club-melding--fout" role="alert">
          {fout}
        </p>
      ) : null}
      <div className="pb-acties">
        <button type="submit" className="club-knop club-knop--primair" disabled={bezig || titel.trim() === ''}>
          {bezig ? t.bezig : t.plaatsen}
        </button>
        <button type="button" className="club-knop club-knop--stil" onClick={onKlaar}>
          {t.annuleren}
        </button>
      </div>
    </form>
  )
}
