'use client'

import { useState, type FormEvent } from 'react'
import { MessageSquare, Plus, X } from 'lucide-react'
import { MAX_LEADNOTITIE, leesLeadNotitie, type LeadNotitie } from '@/lib/lifeos/leads/leads'
import { geleden } from '@/lib/lifeos/pt-dashboard/datum'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { leesLeeg, ptApi } from './api'

// Het logboek van een lead: de laatste notitie staat altijd op de kaart, zodat je
// in één oogopslag ziet hoe het ervoor staat. Met `code` (de PT'er zelf, of Kane)
// voeg je dagelijks een korte notitie toe en haal je een typfout weg; zonder is
// het alleen lezen (eigenaren, clubmanagers).

interface Props {
  leadId: string
  naam: string
  logboek: readonly LeadNotitie[]
  vandaag: string
  /** De link-code voor de API; weglaten = alleen lezen. */
  code?: string
}

function Regel({ n, vandaag }: { n: LeadNotitie; vandaag: string }) {
  return (
    <>
      <span className="ll-wanneer">{geleden(n.datum, vandaag)}{n.door ? ` · ${n.door}` : ''}</span>
      <span className="ll-tekst">{n.tekst}</span>
    </>
  )
}

export function LeadLogboek({ leadId, naam, logboek, vandaag, code }: Props) {
  const [notities, setNotities] = useState<readonly LeadNotitie[]>(logboek)
  const [bron, setBron] = useState(logboek)
  const [open, setOpen] = useState(false)
  const [tekst, setTekst] = useState('')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  // Nieuwe lead van de server (bv. na een statuswijziging): het logboek volgt.
  if (logboek !== bron) {
    setBron(logboek)
    setNotities(logboek)
  }
  const laatste = notities[0]
  const pad = `leads/${leadId}/notities`

  async function voegToe(e: FormEvent) {
    e.preventDefault()
    if (!code || bezig || !tekst.trim()) return
    setBezig(true)
    setFout(null)
    const uit = await ptApi(code, pad, 'POST', { tekst }, leesLeadNotitie)
    setBezig(false)
    if (!uit.ok) return setFout(uit.fout)
    setNotities((nu) => [uit.waarde, ...nu])
    setTekst('')
  }

  async function haalWeg(n: LeadNotitie) {
    if (!code || bezig) return
    setBezig(true)
    setFout(null)
    const uit = await ptApi(code, `${pad}/${n.id}`, 'DELETE', undefined, leesLeeg)
    setBezig(false)
    if (!uit.ok) return setFout(uit.fout)
    setNotities((nu) => nu.filter((x) => x.id !== n.id))
  }

  const panelId = `logboek-${leadId}`
  return (
    <div className="ll">
      <div className="ll-kop">
        {laatste ? (
          <p className="ll-laatste"><MessageSquare size={14} aria-hidden /><Regel n={laatste} vandaag={vandaag} /></p>
        ) : (
          <p className="ll-laatste ll-leeg"><MessageSquare size={14} aria-hidden />Nog geen notities</p>
        )}
        {code || notities.length > 1 ? (
          <button type="button" className="ptd-knop ptd-knop--klein" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((x) => !x)}>
            {code ? <><Plus size={14} aria-hidden /> Notitie</> : null}
            {notities.length > 0 ? ` (${notities.length})` : ''}
            <span className="sr-only"> bij {naam}</span>
          </button>
        ) : null}
      </div>
      {open ? (
        <div id={panelId} className="ll-paneel">
          {code ? (
            <form className="ll-form" onSubmit={(e) => void voegToe(e)}>
              <label className="sr-only" htmlFor={`ll-in-${leadId}`}>Notitie bij {naam}</label>
              <input
                id={`ll-in-${leadId}`}
                className="ptd-invoer"
                value={tekst}
                onChange={(e) => setTekst(e.target.value)}
                maxLength={MAX_LEADNOTITIE}
                placeholder="bv. gebeld, voicemail ingesproken"
                autoComplete="off"
                autoFocus
              />
              <button type="submit" className="ptd-knop ptd-knop--primair ptd-knop--klein" disabled={bezig || !tekst.trim()}>
                {bezig ? 'Bezig…' : 'Toevoegen'}
              </button>
            </form>
          ) : null}
          {fout ? <Foutmelding bericht={fout} /> : null}
          {notities.length > 0 ? (
            <ol className="ll-lijst">
              {notities.map((n) => (
                <li key={n.id}>
                  <Regel n={n} vandaag={vandaag} />
                  {code ? (
                    <button type="button" className="ll-weg" onClick={() => void haalWeg(n)} disabled={bezig} aria-label={`Notitie van ${geleden(n.datum, vandaag)} weghalen`}>
                      <X size={14} aria-hidden />
                    </button>
                  ) : null}
                </li>
              ))}
            </ol>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
