'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Power } from 'lucide-react'
import type { Module } from '@/lib/club/kern/organisatie'
import type { HuisstijlWaarden } from '@/components/club/huisstijl/HuisstijlPortaal'
import { bewaarOrganisatie } from './StapHuisstijl'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { START } from '@/lib/aiyourgym/taal/woorden/club/start'

// Een stap voor een onderdeel dat uit staat (Groepslessen, Leden): zeg het
// gewoon, en zet het hier met een klik aan als je het toch gebruikt. Dan
// verschijnt de stap meteen, zonder eerst terug naar Onderdelen.

interface OnderdeelAanProps {
  organisatie: HuisstijlWaarden
  /** Groepslessen of Leden: de tekst en de knop komen uit het woordenboek. */
  module: 'rooster' | 'leden'
}

export function OnderdeelAan({ organisatie, module }: OnderdeelAanProps) {
  const router = useRouter()
  const t = useTekst(START).onderdeelAan
  const tekst = module === 'rooster' ? t.lessenUit : t.ledenUit
  const knop = module === 'rooster' ? t.lessenAan : t.ledenAan
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)

  async function zetAan() {
    setBezig(true)
    setFout(null)
    const melding = await bewaarOrganisatie({ ...organisatie, uit: organisatie.uit.filter((m: Module) => m !== module) })
    setBezig(false)
    if (melding) return setFout(melding)
    router.refresh()
  }

  return (
    <section className="club-start-blok club-start-smal" aria-live="polite">
      <p>{tekst} {t.nietGebruikt}</p>
      <button type="button" className="club-knop" disabled={bezig} onClick={() => void zetAan()}>
        <Power aria-hidden size={16} /> {bezig ? t.bezig : knop}
      </button>
      {fout && <p className="club-melding club-melding--fout" role="alert">{fout}</p>}
    </section>
  )
}
