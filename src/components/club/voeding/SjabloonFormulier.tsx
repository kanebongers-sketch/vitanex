'use client'

import { useId, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { stuur } from '@/components/club/leden/stuur'
import { MAX_OMSCHRIJVING, MAX_SJABLOON_NAAM, type Maaltijd, type VoedingSjabloon } from '@/lib/club/voeding/model'
import { DOELEN, GRENZEN, type VoedingDoel } from '@/lib/club/voeding/rekenhulp'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { VOEDING } from '@/lib/aiyourgym/taal/woorden/club/voeding'
import { AdviezenVeld } from './AdviezenVeld'
import { DoelenVelden, type DoelTekst } from './DoelenVelden'
import { MaaltijdenVeld } from './MaaltijdenVeld'

// Een voedingssjabloon maken, wijzigen of verwijderen. Na opslaan opent het sjabloon.

export interface SjabloonFormulierProps {
  begin?: VoedingSjabloon
  /** De pagina zonder formulier; altijd met ?v=..., dus &s=<id> kan erachter. */
  terugHref: string
}

const tekst = (n: number | null | undefined) => (n === null || n === undefined ? '' : String(n))

export function SjabloonFormulier({ begin, terugHref }: SjabloonFormulierProps) {
  const router = useRouter()
  const id = useId()
  const [naam, setNaam] = useState(begin?.naam ?? '')
  const [omschrijving, setOmschrijving] = useState(begin?.omschrijving ?? '')
  const [doel, setDoel] = useState<VoedingDoel | null>(begin?.doel ?? null)
  const [eiwitPerKg, setEiwitPerKg] = useState(tekst(begin?.eiwitPerKg))
  const [doelen, setDoelen] = useState<DoelTekst>({ kcal: tekst(begin?.kcal), eiwitG: tekst(begin?.eiwitG), koolhydratenG: tekst(begin?.koolhydratenG), vetG: tekst(begin?.vetG) })
  const [adviezen, setAdviezen] = useState<string[]>(begin?.adviezen ?? [])
  const [maaltijden, setMaaltijden] = useState<Maaltijd[]>(begin?.maaltijden ?? [])
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const [vraagWeg, setVraagWeg] = useState(false)
  const tv = useTekst(VOEDING)
  const t = tv.sjabloonFormulier

  async function bewaar(e: FormEvent) {
    e.preventDefault()
    setBezig(true)
    setFout(null)
    const body = { naam, omschrijving: omschrijving.trim() || null, doel, eiwitPerKg: eiwitPerKg.trim() || null, ...doelen, adviezen, maaltijden }
    const uit = begin ? await stuur(`/api/club/voeding/sjablonen/${begin.id}`, 'PATCH', body) : await stuur('/api/club/voeding/sjablonen', 'POST', body)
    setBezig(false)
    if (!uit.ok) return setFout(uit.fout)
    const nieuwId = typeof uit.data === 'object' && uit.data !== null && 'id' in uit.data ? String(uit.data.id) : begin?.id
    router.push(nieuwId ? `${terugHref}&s=${encodeURIComponent(nieuwId)}` : terugHref, { scroll: false })
    router.refresh()
  }

  async function verwijder() {
    if (!begin) return
    setBezig(true)
    const uit = await stuur(`/api/club/voeding/sjablonen/${begin.id}`, 'DELETE')
    setBezig(false)
    if (!uit.ok) return setFout(uit.fout)
    router.push(terugHref, { scroll: false })
    router.refresh()
  }

  return (
    <form className="club-kaart club-voeding club-voeding-blok" onSubmit={(e) => void bewaar(e)} aria-labelledby={`${id}-kop`}>
      <h2 id={`${id}-kop`} className="club-voeding-groepkop">{begin ? t.wijzigen : t.nieuw}</h2>
      <label className="club-veld">
        <span>{t.naam}</span>
        <input className="club-invoer" required maxLength={MAX_SJABLOON_NAAM} value={naam} placeholder={t.naamVoorbeeld} onChange={(e) => setNaam(e.target.value)} />
      </label>
      <label className="club-veld">
        <span>{t.omschrijving}</span>
        <textarea className="club-invoer" rows={2} maxLength={MAX_OMSCHRIJVING} value={omschrijving} onChange={(e) => setOmschrijving(e.target.value)} />
      </label>
      <fieldset className="club-voeding-keuzes">
        <legend className="club-label">{t.doel}</legend>
        {DOELEN.map((d) => (
          <label key={d}>
            <input type="radio" name={`${id}-doel`} checked={doel === d} onChange={() => setDoel(d)} />
            <span>{tv.doel[d].label}</span>
          </label>
        ))}
      </fieldset>
      <label className="club-veld">
        <span>{t.eiwit}</span>
        <span className="club-voeding-eenheid">
          <input className="club-invoer" type="number" inputMode="decimal" min={GRENZEN.eiwitPerKg.min} max={GRENZEN.eiwitPerKg.max} step="0.1" value={eiwitPerKg} onChange={(e) => setEiwitPerKg(e.target.value)} />
          <em aria-hidden>g/kg</em>
        </span>
      </label>
      <h3 className="club-voeding-subkop">{t.vast}</h3>
      <DoelenVelden waarde={doelen} onWijzig={setDoelen} optioneel />
      <h3 className="club-voeding-subkop">{t.adviezen}</h3>
      <AdviezenVeld adviezen={adviezen} onWijzig={setAdviezen} />
      <h3 className="club-voeding-subkop">{t.dagindeling}</h3>
      <MaaltijdenVeld maaltijden={maaltijden} onWijzig={setMaaltijden} />

      <div className="club-voeding-acties">
        <button type="submit" className="club-knop club-knop--primair" disabled={bezig}>
          {bezig ? t.bezig : begin ? t.opslaan : t.maken}
        </button>
        <Link href={terugHref} scroll={false} className="club-knop club-knop--stil">
          {t.annuleren}
        </Link>
        {begin && !vraagWeg && (
          <button type="button" className="club-knop club-knop--stil" onClick={() => setVraagWeg(true)}>
            {t.verwijderen}
          </button>
        )}
        {begin && vraagWeg && (
          <>
            <span className="club-voeding-hint">{t.gevolg}</span>
            <button type="button" className="club-knop club-knop--gevaar club-knop--klein" disabled={bezig} onClick={() => void verwijder()}>
              {t.ja}
            </button>
            <button type="button" className="club-knop club-knop--stil club-knop--klein" onClick={() => setVraagWeg(false)}>
              {t.nee}
            </button>
          </>
        )}
      </div>
      <div className="club-voeding-melding" role="alert" aria-live="assertive">
        {fout && <p className="club-melding club-melding--fout">{fout}</p>}
      </div>
    </form>
  )
}
