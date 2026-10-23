'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Power } from 'lucide-react'
import type { Module } from '@/lib/club/kern/organisatie'
import type { HuisstijlWaarden } from '@/components/club/huisstijl/HuisstijlPortaal'
import { bewaarOrganisatie } from './StapHuisstijl'

// Een stap voor een onderdeel dat uit staat (Groepslessen, Leden): zeg het
// gewoon, en zet het hier met een klik aan als je het toch gebruikt. Dan
// verschijnt de stap meteen, zonder eerst terug naar Onderdelen.

interface OnderdeelAanProps {
  organisatie: HuisstijlWaarden
  module: Module
  /** "Groepslessen staan uit." */
  tekst: string
  knop: string
}

export function OnderdeelAan({ organisatie, module, tekst, knop }: OnderdeelAanProps) {
  const router = useRouter()
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)

  async function zetAan() {
    setBezig(true)
    setFout(null)
    const melding = await bewaarOrganisatie({ ...organisatie, uit: organisatie.uit.filter((m) => m !== module) })
    setBezig(false)
    if (melding) return setFout(melding)
    router.refresh()
  }

  return (
    <section className="club-start-blok club-start-smal" aria-live="polite">
      <p>{tekst} Gebruik je ze niet? Ga dan gewoon verder.</p>
      <button type="button" className="club-knop" disabled={bezig} onClick={() => void zetAan()}>
        <Power aria-hidden size={16} /> {bezig ? 'Bezig...' : knop}
      </button>
      {fout && <p className="club-melding club-melding--fout" role="alert">{fout}</p>}
    </section>
  )
}
