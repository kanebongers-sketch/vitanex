'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { stuur } from '@/components/club/leden/stuur'
import { AANTAL_STAPPEN, startPad, type StapSleutel } from '@/lib/club/start/stappen'

// De voet van elke stap: terug, overslaan, of klaar en door. De voortgang gaat
// mee naar de server, zodat de eigenaar later verder kan waar hij was. Een
// stap met eigen invoer geeft `voorVerder` mee: die slaat eerst op en houdt de
// stap vast als dat niet lukt. Dezelfde gang naar de volgende stap zit ook
// achter de knop Klopt (useStartGang), zodat beide precies hetzelfde doen.

export interface StartVoetProps {
  stap: number
  sleutel: StapSleutel
  vestiging: string | null
  /** Tekst op de hoofdknop; standaard "Klaar, verder". */
  primair?: string
  /** Eerst opslaan; false = blijven staan (de stap toont zelf de fout). */
  voorVerder?: () => Promise<boolean>
  /** Op de laatste stap: is de wizard al afgerond? */
  afgerond?: boolean
}

export type StartGangProps = Pick<StartVoetProps, 'stap' | 'sleutel' | 'vestiging'>

/** Naar een andere stap of terug naar Club, met de voortgang erbij. */
export function useStartGang({ stap, sleutel, vestiging }: StartGangProps) {
  const router = useRouter()
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const laatste = stap >= AANTAL_STAPPEN

  /** Voortgang opslaan en door. `moetLukken`: alleen bij klaar en afronden blijft een fout staan. */
  async function naar(body: Record<string, unknown>, href: string, moetLukken: boolean) {
    setBezig(true)
    setFout(null)
    const uit = await stuur('/api/club/start', 'PATCH', body)
    if (!uit.ok && moetLukken) {
      setBezig(false)
      setFout(uit.fout)
      return
    }
    router.push(href)
  }

  /** Deze stap is klaar: eerst opslaan (als dat moet), dan door naar de volgende. */
  async function verder(voorVerder?: () => Promise<boolean>) {
    if (voorVerder) {
      setBezig(true)
      const gelukt = await voorVerder()
      setBezig(false)
      if (!gelukt) return
    }
    if (laatste) return naar({ afronden: true }, '/club', true)
    await naar({ stap: stap + 1, klaar: sleutel }, startPad(stap + 1, vestiging), true)
  }

  const vorige = () => naar({ stap: stap - 1 }, startPad(stap - 1, vestiging), false)
  const overslaan = () => naar({ stap: stap + 1 }, startPad(stap + 1, vestiging), false)
  const later = () => naar({ stap }, '/club', false)
  return { bezig, fout, laatste, verder, vorige, overslaan, later, naarClub: () => router.push('/club') }
}

export function StartVoet({ stap, sleutel, vestiging, primair, voorVerder, afgerond = false }: StartVoetProps) {
  const gang = useStartGang({ stap, sleutel, vestiging })
  const { bezig, fout, laatste } = gang

  return (
    <div className="club-start-voet">
      <div className="club-start-voet-links">
        {stap > 1 && (
          <button type="button" className="club-knop club-knop--stil" disabled={bezig} onClick={() => void gang.vorige()}>
            <ArrowLeft aria-hidden size={16} /> Vorige
          </button>
        )}
        <button type="button" className="club-knop club-knop--stil club-start-later" disabled={bezig} onClick={() => void gang.later()}>
          Later verder
        </button>
      </div>
      <div className="club-start-voet-rechts" aria-live="polite">
        {fout && <p className="club-fout" role="alert">{fout}</p>}
        {!laatste && (
          <button type="button" className="club-knop" disabled={bezig} onClick={() => void gang.overslaan()}>
            Overslaan
          </button>
        )}
        {laatste && afgerond ? (
          <button type="button" className="club-knop club-knop--primair club-knop--groot" disabled={bezig} onClick={gang.naarClub}>
            Naar Club <ArrowRight aria-hidden size={18} />
          </button>
        ) : (
          <button type="button" className="club-knop club-knop--primair club-knop--groot" disabled={bezig} onClick={() => void gang.verder(voorVerder)}>
            {laatste ? <Check aria-hidden size={18} /> : null}
            {bezig ? 'Even geduld...' : (primair ?? (laatste ? 'Afronden' : 'Klaar, verder'))}
            {!laatste && <ArrowRight aria-hidden size={18} />}
          </button>
        )}
      </div>
    </div>
  )
}
