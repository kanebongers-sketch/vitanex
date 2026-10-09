'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search } from 'lucide-react'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { OPEN_STATUSSEN, leesLead, moetOpvolgen, type Lead, type LeadStatus } from '@/lib/lifeos/leads/leads'
import type { Club } from '@/lib/lifeos/pt-dashboard/clubs'
import { LeadFormulier } from './LeadFormulier'
import { LeadKaart } from './LeadKaart'
import { ptApi } from './api'

// Container: de leads van één PT'er. Zoeken, filteren, toevoegen, bijwerken.
// Lokale state voor directe feedback; `router.refresh()` houdt het overzicht
// (en de tellers op /<naam>) in de pas.

type Filter = 'open' | 'opvolgen' | 'klant' | 'geen_interesse' | 'alles'

interface Props {
  code: string
  vandaag: string
  begin: Lead[]
  standaardClub: Club | null
  /** Leads waarvoor al een klant/abonnement bestaat. */
  gekoppeld: string[]
  /** Uit de URL: meteen het formulier open (?nieuw=1) of een lead openen (?open=<id>). */
  startNieuw: boolean
  startOpen: string | null
}

const FILTERS: { sleutel: Filter; label: string }[] = [
  { sleutel: 'open', label: 'Open' },
  { sleutel: 'opvolgen', label: 'Nu opvolgen' },
  { sleutel: 'klant', label: 'Klant geworden' },
  { sleutel: 'geen_interesse', label: 'Geen interesse' },
  { sleutel: 'alles', label: 'Alles' },
]

function past(l: Lead, f: Filter, vandaag: string): boolean {
  if (f === 'open') return OPEN_STATUSSEN.includes(l.status)
  if (f === 'opvolgen') return moetOpvolgen(l, vandaag)
  if (f === 'klant') return l.status === 'klant'
  if (f === 'geen_interesse') return l.status === 'geen_interesse'
  return true
}

export function LeadsBeheer({ code, vandaag, begin, standaardClub, gekoppeld, startNieuw, startOpen }: Props) {
  const router = useRouter()
  // Leads waarvan de status nu opgeslagen wordt: die kaart is even niet te wijzigen.
  const [opslaan, setOpslaan] = useState<ReadonlySet<string>>(new Set())
  const [leads, setLeads] = useState<Lead[]>(begin)
  const [filter, setFilter] = useState<Filter>(startOpen ? 'alles' : 'open')
  const [zoek, setZoek] = useState('')
  const [nieuw, setNieuw] = useState(startNieuw)
  const [bewerk, setBewerk] = useState<string | null>(startOpen)
  const [fout, setFout] = useState<string | null>(null)
  const metKlant = useMemo(() => new Set(gekoppeld), [gekoppeld])

  const tellers = useMemo(
    () => Object.fromEntries(FILTERS.map((f) => [f.sleutel, leads.filter((l) => past(l, f.sleutel, vandaag)).length])) as Record<Filter, number>,
    [leads, vandaag],
  )
  const zichtbaar = useMemo(() => {
    const q = zoek.trim().toLowerCase()
    return leads.filter((l) => past(l, filter, vandaag)).filter((l) => !q || `${l.naam} ${l.contact ?? ''} ${l.notitie ?? ''}`.toLowerCase().includes(q))
  }, [leads, filter, zoek, vandaag])

  function vervang(l: Lead) {
    setLeads((ls) => (ls.some((x) => x.id === l.id) ? ls.map((x) => (x.id === l.id ? l : x)) : [l, ...ls]))
    router.refresh()
  }

  async function zetStatus(l: Lead, status: LeadStatus) {
    if (opslaan.has(l.id)) return
    setFout(null)
    setOpslaan((s) => new Set(s).add(l.id))
    const nieuweLead = { ...l, status }
    setLeads((ls) => ls.map((x) => (x.id === l.id ? nieuweLead : x)))
    const uit = await ptApi(code, `leads/${l.id}`, 'PUT', nieuweLead, leesLead)
    setOpslaan((s) => {
      const n = new Set(s)
      n.delete(l.id)
      return n
    })
    if (!uit.ok) {
      // Alleen déze lead terug: andere wijzigingen intussen zijn wél opgeslagen.
      setLeads((ls) => ls.map((x) => (x.id === l.id ? l : x)))
      setFout(uit.fout)
      return
    }
    router.refresh()
  }

  return (
    <section className="ptd-sectie" aria-labelledby="leads-kop">
      <div className="ptd-sectiekop">
        <h2 id="leads-kop">Leads</h2>
        <span>{leads.length} totaal</span>
      </div>

      {nieuw ? (
        <LeadFormulier
          code={code}
          vandaag={vandaag}
          standaardClub={standaardClub}
          onOpgeslagen={(l) => {
            vervang(l)
            setNieuw(false)
            setFilter(OPEN_STATUSSEN.includes(l.status) ? 'open' : 'alles')
          }}
          onAnnuleer={() => setNieuw(false)}
        />
      ) : (
        <button type="button" className="ptd-knop ptd-knop--primair" onClick={() => setNieuw(true)}>
          <Plus size={18} aria-hidden /> Nieuwe lead
        </button>
      )}

      <div className="ptd-veld">
        <label htmlFor="lead-zoek" className="sr-only">Zoek in je leads</label>
        <div className="ptd-zoek">
          <Search size={16} aria-hidden className="ptd-zoek-icoon" />
          <input id="lead-zoek" type="search" className="ptd-invoer ptd-invoer--zoek" placeholder="Zoek op naam, nummer of notitie" value={zoek} onChange={(e) => setZoek(e.target.value)} />
        </div>
      </div>
      <div className="ptd-filters" role="group" aria-label="Filter leads">
        {FILTERS.map((f) => (
          <button key={f.sleutel} type="button" className="ptd-chip" aria-pressed={filter === f.sleutel} onClick={() => setFilter(f.sleutel)}>
            {f.label} <small>{tellers[f.sleutel]}</small>
          </button>
        ))}
      </div>

      {fout ? <Foutmelding bericht={fout} /> : null}

      {zichtbaar.length === 0 ? (
        <p className="ptd-leeg">
          {leads.length === 0
            ? 'Nog geen leads. Sprak je vandaag iemand op de vloer, bij een intake of aan de telefoon? Zet het erin — dan bespreken we het in het coachgesprek.'
            : zoek
              ? 'Niets gevonden voor deze zoekopdracht.'
              : 'Niets in deze lijst.'}
        </p>
      ) : (
        <ul className="ptd-lijst">
          {zichtbaar.map((l) =>
            bewerk === l.id ? (
              <li key={l.id} id={`lead-${l.id}`}>
                <LeadFormulier
                  code={code}
                  vandaag={vandaag}
                  standaardClub={standaardClub}
                  lead={l}
                  onOpgeslagen={(x) => {
                    vervang(x)
                    setBewerk(null)
                  }}
                  onVerwijderd={(id) => {
                    setLeads((ls) => ls.filter((x) => x.id !== id))
                    setBewerk(null)
                    router.refresh()
                  }}
                  onAnnuleer={() => setBewerk(null)}
                />
              </li>
            ) : (
              <LeadKaart
                key={l.id}
                lead={l}
                vandaag={vandaag}
                onBewerk={() => setBewerk(l.id)}
                onStatus={(s) => void zetStatus(l, s)}
                bezig={opslaan.has(l.id)}
                klantHref={metKlant.has(l.id) ? undefined : `/${code}/klanten?vanLead=${l.id}`}
              />
            ),
          )}
        </ul>
      )}
    </section>
  )
}
