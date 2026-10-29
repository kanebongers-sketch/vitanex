'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Check, Save } from 'lucide-react'
import { stuur } from '@/components/club/leden/stuur'
import { AANTAL_STAPPEN, buurStap, startPad, type StapSleutel } from '@/lib/club/start/stappen'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { START } from '@/lib/aiyourgym/taal/woorden/club/start'

// De voet van elke stap: terug, opslaan en stoppen, of klaar en door. Een stap
// overslaan kan niet: elke stap stelt zijn deel echt in (besluit Kane
// 23-10-2026). De voortgang gaat mee naar de server, zodat de eigenaar verder
// kan waar hij was. Een stap met eigen invoer geeft `voorVerder` mee: die slaat
// eerst op en houdt de stap vast als dat niet lukt; ook bij Opslaan en stoppen.
// Er zijn geen losse opslaanknoppen in een stap: deze twee knoppen bewaren alles.
// Verplichte velden (zoals het adres) controleert de stap alleen bij verder:
// stoppen mag altijd, wat er staat wordt dan bewaard.

export interface StartVoetProps {
  stap: number
  sleutel: StapSleutel
  vestiging: string | null
  /** Tekst op de hoofdknop; standaard "Klaar, verder". */
  primair?: string
  /** Eerst opslaan; false = blijven staan (de stap toont zelf de fout). */
  voorVerder?: VoorVerder
  /** Op de laatste stap: is de wizard al afgerond? */
  afgerond?: boolean
  /** Op de laatste stap: staan alle stappen ervoor? Anders kan afronden nog niet. */
  kanAfronden?: boolean
  /** Stappen van pakketten die niet zijn afgenomen: verder en terug slaan ze over. */
  sla?: readonly number[]
}

/** Opslaan voor verder of voor stoppen; bij stoppen slaat de stap op zonder verplichte velden te eisen. */
export type VoorVerder = (doel: 'verder' | 'stoppen') => Promise<boolean>

export type StartGangProps = Pick<StartVoetProps, 'stap' | 'sleutel' | 'vestiging' | 'sla'>

/** Naar een andere stap of terug naar Club, met de voortgang erbij. */
export function useStartGang({ stap, sleutel, vestiging, sla = [] }: StartGangProps) {
  const router = useRouter()
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const [gelukt, setGelukt] = useState(false)
  const [gestopt, setGestopt] = useState(false)
  const laatste = stap >= AANTAL_STAPPEN

  /**
   * Voortgang opslaan en door. `moetLukken`: alleen bij klaar en afronden blijft
   * een fout staan. Zonder adres blijf je op deze stap en ververst de pagina
   * (afronden: je ziet meteen wat er live staat).
   */
  async function naar(body: Record<string, unknown>, href: string | null, moetLukken: boolean) {
    setBezig(true)
    setFout(null)
    const uit = await stuur('/api/club/start', 'PATCH', body)
    if (!uit.ok && moetLukken) {
      setBezig(false)
      setFout(uit.fout)
      return
    }
    if (href) return router.push(href)
    setBezig(false)
    setGelukt(true)
    router.refresh()
    const zacht = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: zacht ? 'smooth' : 'auto' })
  }

  /** Deze stap is klaar: eerst opslaan (als dat moet), dan door naar de volgende. */
  async function verder(voorVerder?: VoorVerder) {
    if (voorVerder) {
      setBezig(true)
      setFout(null)
      const opgeslagen = await voorVerder('verder')
      setBezig(false)
      if (!opgeslagen) return
    }
    if (laatste) return naar({ afronden: true }, null, true)
    const volgende = buurStap(stap, 1, sla)
    await naar({ stap: volgende, klaar: sleutel }, startPad(volgende, vestiging), true)
  }

  const vorige = () => {
    const terug = buurStap(stap, -1, sla)
    return naar({ stap: terug }, startPad(terug, vestiging), false)
  }

  /** Wat er op het scherm staat opslaan, de plek onthouden en stoppen; je gaat later verder op deze stap. */
  async function stoppen(voorVerder?: VoorVerder) {
    setBezig(true)
    setFout(null)
    const opgeslagen = voorVerder ? await voorVerder('stoppen') : true
    if (!opgeslagen) return setBezig(false)
    const uit = await stuur('/api/club/start', 'PATCH', { stap })
    setBezig(false)
    if (!uit.ok) return setFout(uit.fout)
    setGestopt(true)
  }
  return { bezig, fout, gelukt, gestopt, laatste, verder, vorige, stoppen, naarClub: () => router.push('/club') }
}

export function StartVoet({ stap, sleutel, vestiging, primair, voorVerder, afgerond = false, kanAfronden = true, sla }: StartVoetProps) {
  const gang = useStartGang({ stap, sleutel, vestiging, sla })
  const { bezig, fout, laatste } = gang
  const t = useTekst(START).voet

  return (
    <div className="club-start-voet">
      <div className="club-start-voet-links">
        {stap > 1 && (
          <button type="button" className="club-knop club-knop--stil" disabled={bezig} onClick={() => void gang.vorige()}>
            <ArrowLeft aria-hidden size={16} /> {t.vorige}
          </button>
        )}
        {!(laatste && afgerond) && (
          <button type="button" className="club-knop club-knop--stil club-start-later" disabled={bezig} onClick={() => void gang.stoppen(voorVerder)}>
            <Save aria-hidden size={15} /> {t.opslaanStoppen}
          </button>
        )}
      </div>
      <div className="club-start-voet-rechts" aria-live="polite">
        {fout && <p className="club-fout" role="alert">{fout}</p>}
        {gang.gestopt && (
          <p className="club-start-gestopt" role="status">
            {t.gestopt}
          </p>
        )}
        {gang.gelukt && <span className="sr-only">{t.afgerondSr}</span>}
        {laatste && !afgerond && !kanAfronden && <p className="club-hint">{t.eerstOpen}</p>}
        {laatste && afgerond ? (
          <button type="button" className="club-knop club-knop--primair club-knop--groot" disabled={bezig} onClick={gang.naarClub}>
            {t.naarClub} <ArrowRight aria-hidden size={18} />
          </button>
        ) : (
          <button type="button" className="club-knop club-knop--primair club-knop--groot" disabled={bezig || (laatste && !kanAfronden)} onClick={() => void gang.verder(voorVerder)}>
            {laatste ? <Check aria-hidden size={18} /> : null}
            {bezig ? t.bezig : (primair ?? (laatste ? t.afronden : t.klaarVerder))}
            {!laatste && <ArrowRight aria-hidden size={18} />}
          </button>
        )}
      </div>
    </div>
  )
}
