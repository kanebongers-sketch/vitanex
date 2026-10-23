'use client'

import { useState, useTransition, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { KLEDINGMAAT_KEUZES, type Kledingmaten } from '@/lib/lifeos/pt-dashboard/belangrijk'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { Keuzes } from './velden'
import { leesLeeg, ptApi } from './api'

// De PT'er geeft zijn kledingmaten door (of past ze aan): een maat voor shirts
// en hoodies, een voor shorts en broeken. Kane ziet ze bij Kleding en gebruikt
// ze bij het uitgeven. Na opslaan ververst het startscherm.

const OPTIES = KLEDINGMAAT_KEUZES.map((m) => ({ waarde: m, label: m }))

interface Props {
  code: string
  begin: Kledingmaten | null
  /** Na opslaan (bv. het formulier weer dichtklappen). */
  klaar?: () => void
}

export function KledingmatenFormulier({ code, begin, klaar }: Props) {
  const router = useRouter()
  const [boven, setBoven] = useState<string | null>(begin?.boven ?? null)
  const [onder, setOnder] = useState<string | null>(begin?.onder ?? null)
  const [bezig, setBezig] = useState(false)
  const [verversen, start] = useTransition()
  const [fout, setFout] = useState<string | null>(null)

  async function opslaan(e: FormEvent) {
    e.preventDefault()
    if (bezig || verversen) return
    if (!boven || !onder) return setFout('Kies beide maten.')
    setBezig(true)
    setFout(null)
    const uit = await ptApi(code, 'belangrijk', 'POST', { actie: 'kledingmaten', maten: { boven, onder } }, leesLeeg)
    setBezig(false)
    if (!uit.ok) return setFout(uit.fout)
    klaar?.()
    start(() => router.refresh())
  }

  return (
    <form className="ptd-belangrijk-maten" onSubmit={(e) => void opslaan(e)} noValidate>
      <Keuzes label="Shirts en hoodies" opties={OPTIES} waarde={boven} onKies={setBoven} />
      <Keuzes label="Shorts en broeken" opties={OPTIES} waarde={onder} onKies={setOnder} />
      <div className="ptd-acties">
        <button type="submit" className="ptd-knop ptd-knop--primair" disabled={bezig || verversen || !boven || !onder}>
          {bezig || verversen ? 'Opslaan…' : 'Maten opslaan'}
        </button>
        {klaar && begin ? (
          <button type="button" className="ptd-knop" onClick={klaar}>
            Annuleren
          </button>
        ) : null}
      </div>
      {fout ? <Foutmelding bericht={fout} /> : null}
    </form>
  )
}
