'use client'

import { useRef, useState } from 'react'
import { Camera, Sparkles } from 'lucide-react'
import { naarPer100 } from '@/lib/club/voeding/dagboek/berekeningen'
import { leesAiRespons, type AiItem } from '@/lib/club/voeding/dagboek/ai/lezen'
import type { VoedingDagboekTekst } from '@/lib/aiyourgym/taal/woorden/club/voeding-dagboek'
import { vraagAi, voedingUrl, type AiFoutSoort } from './api'
import { AiVoorstel, type AiRegel } from './AiVoorstel'
import { verkleinFoto } from './verklein'

// Maaltijd schatten met AI (besluit Kane 29-10-2026: foto maken blijft, inspreken
// is eruit). Betaalde AI: dit paneel bestaat alleen als de server de functie
// aanzet (CLUB_VOEDING_AI_ACTIEF). Volgorde: eerst uitdrukkelijke toestemming
// (eenmalig, vastgelegd met tijd en tekstversie), dan een foto (in de browser
// verkleind) of een omschrijving, dan een voorstel dat het lid nakijkt en zelf
// bevestigt. De foto wordt nergens bewaard.

export type { AiRegel } from './AiVoorstel'
export type AiBron = 'foto' | 'schatting'

/** Hetzelfde getal als MAX_PER_DAG in lib/club/voeding/dagboek/ai/route-hulp.ts (alleen voor de tekst). */
const DAGLIMIET = 30

function naarRegel(item: AiItem): AiRegel {
  const gram = item.portieGram ?? 100
  return { naam: item.naam, gram, per100: naarPer100(item, gram), betrouwbaarheid: item.betrouwbaarheid }
}

type Fase = 'klaar' | 'verkleinen' | 'foto' | 'schatten' | 'voorstel'

interface Props {
  t: VoedingDagboekTekst
  voor: string | null
  bezig: boolean
  toestemmingOp: string | null
  onToestemming: (aan: boolean) => Promise<boolean>
  onOpslaan: (regels: AiRegel[], bron: AiBron) => void
}

export function AiPaneel({ t, voor, bezig, toestemmingOp, onToestemming, onOpslaan }: Props) {
  const ta = t.ai
  const [fase, setFase] = useState<Fase>('klaar')
  const [fout, setFout] = useState<string | null>(null)
  const [regels, setRegels] = useState<AiRegel[]>([])
  const [bron, setBron] = useState<AiBron>('foto')
  const [omschrijving, setOmschrijving] = useState('')
  const [toestemmingBezig, setToestemmingBezig] = useState(false)
  const bestand = useRef<HTMLInputElement>(null)

  const foutTekst = (soort: AiFoutSoort): string => {
    if (soort === 'daglimiet') return ta.fout.daglimiet(DAGLIMIET)
    if (soort === 'teVaak') return t.fout.teVaak
    if (soort === 'algemeen' || soort === 'invoer') return t.fout.ai
    return ta.fout[soort]
  }

  async function vraag(soort: AiBron, body: FormData | { omschrijving: string }) {
    setBron(soort)
    setFase(soort === 'foto' ? 'foto' : 'schatten')
    const r = await vraagAi(voedingUrl(soort === 'foto' ? '/ai/foto' : '/ai/schat', voor), body)
    if (!r.ok) {
      setFout(foutTekst(r.soort))
      return setFase('klaar')
    }
    const antwoord = leesAiRespons(r.data)
    if (!antwoord) {
      setFout(t.fout.ai)
      return setFase('klaar')
    }
    setRegels(antwoord.items.map(naarRegel))
    setFout(antwoord.items.length === 0 ? ta.fout.geenItems : null)
    setFase(antwoord.items.length === 0 ? 'klaar' : 'voorstel')
  }

  async function kiesFoto(f: File) {
    setFout(null)
    setFase('verkleinen')
    const klein = await verkleinFoto(f)
    if (!klein) {
      setFout(ta.fout.fotoOnleesbaar)
      return setFase('klaar')
    }
    const fd = new FormData()
    fd.append('foto', klein, 'maaltijd.jpg')
    await vraag('foto', fd)
  }

  async function geefToestemming(aan: boolean) {
    setToestemmingBezig(true)
    setFout(null)
    const ok = await onToestemming(aan)
    setToestemmingBezig(false)
    if (!ok) setFout(t.fout.opslaan)
  }

  if (!toestemmingOp) {
    return (
      <section className="club-vd-paneel club-vd-ai-toestemming" aria-labelledby="vd-ai-toestemming">
        <h4 id="vd-ai-toestemming" className="club-vd-ai-kop"><Sparkles size={18} aria-hidden /> {ta.toestemmingTitel}</h4>
        <p className="club-vd-ai-uitleg">{ta.toestemming}</p>
        <ul className="club-vd-ai-punten">
          {ta.toestemmingMeer.map((regel) => <li key={regel}>{regel}</li>)}
        </ul>
        <button type="button" className="club-vd-hoofdknop" disabled={toestemmingBezig} onClick={() => void geefToestemming(true)}>
          {toestemmingBezig ? ta.toestemmingBezig : ta.toestemmingKnop}
        </button>
        {fout && <p className="club-vd-fout" role="alert">{fout}</p>}
      </section>
    )
  }

  if (fase === 'voorstel') {
    return <AiVoorstel regels={regels} t={t} bezig={bezig} onWijzig={setRegels} onOpnieuw={() => { setRegels([]); setFase('klaar') }} onBevestig={() => onOpslaan(regels, bron)} />
  }

  const druk = fase !== 'klaar'
  const melding = fase === 'verkleinen' ? ta.verkleinen : fase === 'foto' ? ta.bekijkt : fase === 'schatten' ? ta.schat : null
  return (
    <div className="club-vd-paneel" aria-busy={druk}>
      <p className="club-vd-hint">{ta.fotoUitleg}</p>
      <input ref={bestand} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void kiesFoto(f) }} />
      <button type="button" className="club-vd-hoofdknop" disabled={druk} onClick={() => bestand.current?.click()}>
        <Camera size={20} aria-hidden /> {ta.fotoKnop}
      </button>
      <form className="club-vd-formulier" onSubmit={(e) => { e.preventDefault(); if (omschrijving.trim().length >= 2) { setFout(null); void vraag('schatting', { omschrijving }) } }}>
        <label className="club-vd-veld club-vd-veld--breed">
          <span>{ta.of}</span>
          <input value={omschrijving} maxLength={300} placeholder={ta.schatHint} onChange={(e) => setOmschrijving(e.target.value)} />
        </label>
        <button type="submit" className="club-lidapp-knop" disabled={druk || omschrijving.trim().length < 2}>{ta.schatKnop}</button>
      </form>
      {melding && <p className="club-vd-hint" role="status">{melding}</p>}
      {fout && <p className="club-vd-fout" role="alert">{fout}</p>}
      <button type="button" className="club-vd-ai-intrekken" disabled={druk || toestemmingBezig} onClick={() => void geefToestemming(false)}>{ta.toestemmingIntrekken}</button>
    </div>
  )
}
