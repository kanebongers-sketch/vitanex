'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { Mail, UserPlus } from 'lucide-react'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { NIEUWE_LEDEN } from '@/lib/aiyourgym/taal/woorden/club/nieuwe-leden'
import { QrPaneel } from './QrPaneel'
import type { VormKeuze } from './NieuweLedenKnoppen'

// Snel een lid toevoegen: voornaam, achternaam en e-mail, de rest optioneel.
// Na Toevoegen meteen de uitnodiging: de QR om aan de balie te scannen, en de
// mail gaat vanzelf (als de mails aan staan). Twee knoppen daarna: de
// ledenkaart openen, of meteen het volgende lid.

interface Props {
  vestiging: string
  vormen: VormKeuze[]
  sportschool: string
  ledenkaart: (id: string) => string
  onToegevoegd?: () => void
}

type Klaar = { id: string; voornaam: string; url: string | null; mail: boolean; appUit: boolean; uitnodigen: boolean }

const LEEG = { voornaam: '', achternaam: '', email: '', telefoon: '', vormId: '' }

function leesKlaar(data: unknown, voornaam: string, uitnodigen: boolean): Klaar | null {
  const d = typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : {}
  if (typeof d.id !== 'string') return null
  const u = typeof d.uitnodiging === 'object' && d.uitnodiging !== null ? (d.uitnodiging as Record<string, unknown>) : null
  return { id: d.id, voornaam, url: u && typeof u.url === 'string' ? u.url : null, mail: u?.mail === true, appUit: d.appUit === true, uitnodigen }
}

export function LidToevoegen({ vestiging, vormen, sportschool, ledenkaart, onToegevoegd }: Props) {
  const tekst = useTekst(NIEUWE_LEDEN)
  const w = tekst.toevoegen
  const f = tekst.fouten
  const [v, setV] = useState(LEEG)
  const [uitnodigen, setUitnodigen] = useState(true)
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<{ tekst: string; dubbel: string | null } | null>(null)
  const [klaar, setKlaar] = useState<Klaar | null>(null)
  const zet = (sleutel: keyof typeof LEEG) => (e: { target: { value: string } }) => setV({ ...v, [sleutel]: e.target.value })

  async function verstuur(e: FormEvent) {
    e.preventDefault()
    if (bezig) return
    setBezig(true)
    setFout(null)
    const res = await fetch('/api/club/leden', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...v, vormId: v.vormId || null, vestiging, uitnodigen }),
    }).catch(() => null)
    const data: unknown = res ? await res.json().catch(() => null) : null
    setBezig(false)
    const d = typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : {}
    if (res?.status === 409) {
      const dubbel = typeof d.dubbel === 'object' && d.dubbel !== null ? (d.dubbel as Record<string, unknown>).id : null
      return setFout({ tekst: w.dubbel, dubbel: typeof dubbel === 'string' ? dubbel : null })
    }
    if (!res?.ok) return setFout({ tekst: typeof d.fout === 'string' ? d.fout : f.opslaan, dubbel: null })
    const k = leesKlaar(data, v.voornaam.trim(), uitnodigen)
    if (k) {
      setKlaar(k)
      onToegevoegd?.()
    }
  }

  if (klaar) {
    return (
      <div className="club-nl-klaar" role="status">
        <p className="club-nl-klaar-kop"><UserPlus size={18} aria-hidden /> {w.klaarKop(klaar.voornaam)}</p>
        {!klaar.uitnodigen ? <p className="club-hint">{w.geenUitnodiging}</p> : klaar.appUit ? <p className="club-hint">{w.appUit}</p> : null}
        {klaar.url && (
          <>
            <p className="club-nl-klaar-mail">{klaar.mail ? <><Mail size={15} aria-hidden /> {w.mailGepland}</> : w.mailUit}</p>
            {klaar.mail && <p className="club-hint">{w.scan}</p>}
            <QrPaneel url={klaar.url} sportschool={sportschool} compact />
          </>
        )}
        <div className="club-nl-voet">
          <button type="button" className="club-knop club-knop--stil" onClick={() => { setKlaar(null); setV(LEEG) }}>{w.nogEen}</button>
          <Link href={ledenkaart(klaar.id)} className="club-knop club-knop--primair">{w.naarKaart}</Link>
        </div>
      </div>
    )
  }

  return (
    <form className="club-nl-form" onSubmit={(e) => void verstuur(e)} noValidate>
      <div className="club-nl-rij">
        <label className="club-veld"><span>{w.voornaam}</span><input className="club-invoer" required maxLength={60} autoComplete="off" autoFocus value={v.voornaam} onChange={zet('voornaam')} /></label>
        <label className="club-veld"><span>{w.achternaam}</span><input className="club-invoer" required maxLength={80} autoComplete="off" value={v.achternaam} onChange={zet('achternaam')} /></label>
      </div>
      <label className="club-veld"><span>{w.email}</span><input className="club-invoer" type="email" inputMode="email" required maxLength={120} autoComplete="off" value={v.email} onChange={zet('email')} /></label>
      <div className="club-nl-rij">
        <label className="club-veld"><span>{w.telefoon} <small>{w.optioneel}</small></span><input className="club-invoer" type="tel" inputMode="tel" maxLength={30} autoComplete="off" value={v.telefoon} onChange={zet('telefoon')} /></label>
        {vormen.length > 0 && (
          <label className="club-veld">
            <span>{w.vorm} <small>{w.optioneel}</small></span>
            <select className="club-invoer" value={v.vormId} onChange={zet('vormId')}>
              <option value="">{w.geenVorm}</option>
              {vormen.map((vorm) => <option key={vorm.id} value={vorm.id}>{vorm.naam}</option>)}
            </select>
          </label>
        )}
      </div>
      <label className="club-nl-schakel">
        <input type="checkbox" checked={uitnodigen} onChange={(e) => setUitnodigen(e.target.checked)} />
        <span>{w.uitnodigen}</span>
      </label>
      <div aria-live="assertive">
        {fout && (
          <p className="club-melding club-melding--fout" role="alert">
            {fout.tekst} {fout.dubbel && <Link href={ledenkaart(fout.dubbel)}>{w.dubbelOpen}</Link>}
          </p>
        )}
      </div>
      <div className="club-nl-voet">
        <button type="submit" className="club-knop club-knop--primair" disabled={bezig} aria-busy={bezig || undefined}>
          <UserPlus size={16} aria-hidden /> {bezig ? w.bezig : w.knop}
        </button>
      </div>
    </form>
  )
}
