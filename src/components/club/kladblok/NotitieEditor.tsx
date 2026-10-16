'use client'

import { useEffect, useRef, useState } from 'react'
import { Archive, ArchiveRestore, ChevronLeft, Pin, PinOff, Trash2 } from 'lucide-react'
import { VESTIGING_LABEL, type Vestiging } from '@/lib/club/kern/vestiging'
import { MAPPEN, MAP_LABEL, MAX_INHOUD, MAX_TITEL, isMap, leesKladAntwoord, type KladNotitie, type KladWijziging } from '@/lib/club/kladblok/model'
import { stuur } from '@/components/club/leden/stuur'

// Eén notitie bewerken. Tekst en titel slaan vanzelf op zodra je even stopt met
// typen (zoals Evernote); map, vestiging, vastpinnen en archiveren meteen. Of het
// gelukt is, staat altijd in beeld. Verwijderen kan alleen vanuit het archief.

const WACHT_MS = 900
const TIJD = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam' })

type Stand = 'opgeslagen' | 'bezig' | 'wacht' | { fout: string }

interface Props {
  notitie: KladNotitie
  vestiging: Vestiging
  onWijziging: (n: KladNotitie) => void
  onWeg: (id: string) => void
  onSluit: () => void
}

export function NotitieEditor({ notitie, vestiging, onWijziging, onWeg, onSluit }: Props) {
  const [titel, setTitel] = useState(notitie.titel)
  const [inhoud, setInhoud] = useState(notitie.inhoud)
  const [stand, setStand] = useState<Stand>('opgeslagen')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const openstaand = useRef<KladWijziging>({})

  async function bewaar(w: KladWijziging) {
    setStand('bezig')
    const uit = await stuur(`/api/club/kladblok/${notitie.id}`, 'PATCH', w)
    const n = uit.ok ? leesKladAntwoord(uit.data) : null
    if (!n) return setStand({ fout: uit.ok ? 'Onverwacht antwoord van de server.' : uit.fout })
    setStand(Object.keys(openstaand.current).length > 0 ? 'wacht' : 'opgeslagen')
    onWijziging(n)
  }

  function spoel() {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
    const w = openstaand.current
    openstaand.current = {}
    if (Object.keys(w).length > 0) void bewaar(w)
  }

  function later(w: KladWijziging) {
    openstaand.current = { ...openstaand.current, ...w }
    setStand('wacht')
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(spoel, WACHT_MS)
  }

  // Bij wisselen of sluiten: wat nog openstaat meteen opslaan (via een ref, zodat
  // het opruimen bij unmount altijd de nieuwste versie van spoel aanroept).
  const spoelRef = useRef(spoel)
  useEffect(() => {
    spoelRef.current = spoel
  })
  useEffect(() => () => spoelRef.current(), [])

  async function meteen(w: KladWijziging) {
    spoel()
    await bewaar(w)
  }

  async function verwijder() {
    if (!window.confirm(`"${notitie.titel}" definitief verwijderen? Dit kan niet ongedaan worden.`)) return
    setStand('bezig')
    const uit = await stuur(`/api/club/kladblok/${notitie.id}`, 'DELETE')
    if (!uit.ok) return setStand({ fout: uit.fout })
    onWeg(notitie.id)
  }

  const standTekst =
    typeof stand === 'object' ? stand.fout
    : stand === 'bezig' ? 'Opslaan…'
    : stand === 'wacht' ? 'Nog niet opgeslagen'
    : `Opgeslagen · ${TIJD.format(new Date(notitie.bijgewerktOp))}`

  return (
    <article className="kb-notitie">
      <div className="kb-balk">
        <button type="button" className="club-knop club-knop--stil club-knop--klein kb-terug" onClick={() => { spoel(); onSluit() }}>
          <ChevronLeft size={16} aria-hidden /> Alle notities
        </button>
        <label className="club-veld kb-keuze">
          <span>Map</span>
          <select className="club-invoer" value={notitie.map} onChange={(e) => isMap(e.target.value) && void meteen({ map: e.target.value })}>
            {MAPPEN.map((m) => <option key={m} value={m}>{MAP_LABEL[m]}</option>)}
          </select>
        </label>
        <label className="club-veld kb-keuze">
          <span>Voor</span>
          <select className="club-invoer" value={notitie.vestiging ?? 'alle'} onChange={(e) => void meteen({ vestiging: e.target.value === 'alle' ? null : vestiging })}>
            <option value={vestiging}>{VESTIGING_LABEL[vestiging]}</option>
            <option value="alle">Alle vestigingen</option>
          </select>
        </label>
        <div className="club-acties kb-knoppen">
          <button type="button" className="club-knop club-knop--stil club-knop--klein" onClick={() => void meteen({ vastgepind: !notitie.vastgepind })}
            aria-pressed={notitie.vastgepind} title={notitie.vastgepind ? 'Losmaken' : 'Vastpinnen'}>
            {notitie.vastgepind ? <PinOff size={15} aria-hidden /> : <Pin size={15} aria-hidden />}
            <span>{notitie.vastgepind ? 'Losmaken' : 'Vastpinnen'}</span>
          </button>
          <button type="button" className="club-knop club-knop--stil club-knop--klein" onClick={() => void meteen({ gearchiveerd: !notitie.gearchiveerd })}>
            {notitie.gearchiveerd ? <ArchiveRestore size={15} aria-hidden /> : <Archive size={15} aria-hidden />}
            <span>{notitie.gearchiveerd ? 'Terugzetten' : 'Archiveren'}</span>
          </button>
          {notitie.gearchiveerd ? (
            <button type="button" className="club-knop club-knop--gevaar club-knop--klein" onClick={() => void verwijder()}>
              <Trash2 size={15} aria-hidden /> <span>Verwijderen</span>
            </button>
          ) : null}
        </div>
      </div>
      <label className="club-sr" htmlFor="kb-titel">Titel</label>
      <input
        id="kb-titel"
        className="kb-titel"
        value={titel}
        maxLength={MAX_TITEL}
        onChange={(e) => { setTitel(e.target.value); later({ titel: e.target.value }) }}
        onBlur={spoel}
        placeholder="Titel"
      />
      <label className="club-sr" htmlFor="kb-inhoud">Tekst</label>
      <textarea
        id="kb-inhoud"
        className="kb-inhoud"
        value={inhoud}
        maxLength={MAX_INHOUD}
        onChange={(e) => { setInhoud(e.target.value); later({ inhoud: e.target.value }) }}
        onBlur={spoel}
        placeholder="Schrijf hier…"
      />
      <p className={`kb-stand${typeof stand === 'object' ? ' kb-stand--fout' : ''}`} role="status" aria-live="polite">
        {standTekst}{notitie.auteur ? ` · aangemaakt door ${notitie.auteur}` : ''}
      </p>
    </article>
  )
}
