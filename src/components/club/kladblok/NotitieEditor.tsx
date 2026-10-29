'use client'

import { useEffect, useRef, useState } from 'react'
import { Archive, ArchiveRestore, Check, ChevronLeft, ListChecks, Pencil, Pin, PinOff, Trash2 } from 'lucide-react'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import { useVestigingNaam } from '@/components/club/shell/VestigingenContext'
import { MAPPEN, MAX_INHOUD, MAX_TITEL, isMap, leesKladAntwoord, type KladNotitie, type KladWijziging } from '@/lib/club/kladblok/model'
import { stuur } from '@/components/club/leden/stuur'
import { vinkStand, voegVinkToe, wisselVinkje } from '@/lib/club/kladblok/opmaak'
import { Leesweergave } from './Leesweergave'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { formatDatum, formatTijd } from '@/lib/aiyourgym/taal/formaat'
import { NOTITIES } from '@/lib/aiyourgym/taal/woorden/club/notities'

// Eén notitie bewerken. Tekst en titel slaan vanzelf op zodra je even stopt met
// typen (zoals Evernote); map, vestiging, vastpinnen en archiveren meteen. Of het
// gelukt is, staat altijd in beeld. Verwijderen kan alleen vanuit het archief.

const WACHT_MS = 900

type Stand = 'opgeslagen' | 'bezig' | 'wacht' | { fout: string }

interface Props {
  notitie: KladNotitie
  vestiging: Vestiging
  onWijziging: (n: KladNotitie) => void
  onWeg: (id: string) => void
  onSluit: () => void
}

export function NotitieEditor({ notitie, vestiging, onWijziging, onWeg, onSluit }: Props) {
  const vestigingNaam = useVestigingNaam(vestiging)
  const taal = useTaal()
  const tekst = useTekst(NOTITIES)
  const t = tekst.editor
  const [titel, setTitel] = useState(notitie.titel)
  const [inhoud, setInhoud] = useState(notitie.inhoud)
  const [stand, setStand] = useState<Stand>('opgeslagen')
  // Een notitie met inhoud opent om te lezen (vinkjes aanklikbaar); een lege om te schrijven.
  const [bewerken, setBewerken] = useState(notitie.inhoud.trim() === '')
  const tekstVeld = useRef<HTMLTextAreaElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const openstaand = useRef<KladWijziging>({})

  async function bewaar(w: KladWijziging) {
    setStand('bezig')
    const uit = await stuur(`/api/club/kladblok/${notitie.id}`, 'PATCH', w)
    const n = uit.ok ? leesKladAntwoord(uit.data) : null
    if (!n) return setStand({ fout: uit.ok ? t.onverwacht : uit.fout })
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

  /** Nu opslaan, samen met wat nog openstond (een verzoek, dus geen oude tekst die later binnenkomt). */
  async function meteen(w: KladWijziging) {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
    const samen = { ...openstaand.current, ...w }
    openstaand.current = {}
    await bewaar(samen)
  }

  const vinken = vinkStand(inhoud)

  /** Een vakje aan- of uitvinken in de leesweergave: meteen opslaan. */
  function vink(index: number) {
    const nieuw = wisselVinkje(inhoud, index)
    setInhoud(nieuw)
    void meteen({ inhoud: nieuw })
  }

  /** Een afvinkpunt achteraan en meteen erin typen. */
  function vinkErbij() {
    const nieuw = voegVinkToe(inhoud)
    setInhoud(nieuw)
    later({ inhoud: nieuw })
    setBewerken(true)
    requestAnimationFrame(() => {
      const veld = tekstVeld.current
      if (!veld) return
      veld.focus()
      veld.setSelectionRange(nieuw.length, nieuw.length)
    })
  }

  async function verwijder() {
    if (!window.confirm(t.bevestigVerwijderen(notitie.titel))) return
    setStand('bezig')
    const uit = await stuur(`/api/club/kladblok/${notitie.id}`, 'DELETE')
    if (!uit.ok) return setStand({ fout: uit.fout })
    onWeg(notitie.id)
  }

  const standTekst =
    typeof stand === 'object' ? stand.fout
    : stand === 'bezig' ? t.opslaan
    : stand === 'wacht' ? t.nietOpgeslagen
    : t.opgeslagen(`${formatDatum(notitie.bijgewerktOp, taal, 'dagMaandLang')} ${formatTijd(notitie.bijgewerktOp, taal)}`)

  return (
    <article className="kb-notitie">
      <div className="kb-balk">
        <button type="button" className="club-knop club-knop--stil club-knop--klein kb-terug" onClick={() => { spoel(); onSluit() }}>
          <ChevronLeft size={16} aria-hidden /> {t.alleNotities}
        </button>
        <label className="club-veld kb-keuze">
          <span>{t.map}</span>
          <select className="club-invoer" value={notitie.map} onChange={(e) => isMap(e.target.value) && void meteen({ map: e.target.value })}>
            {MAPPEN.map((m) => <option key={m} value={m}>{tekst.map[m]}</option>)}
          </select>
        </label>
        <label className="club-veld kb-keuze">
          <span>{t.voor}</span>
          <select className="club-invoer" value={notitie.vestiging ?? 'alle'} onChange={(e) => void meteen({ vestiging: e.target.value === 'alle' ? null : vestiging })}>
            <option value={vestiging}>{vestigingNaam}</option>
            <option value="alle">{t.alleVestigingen}</option>
          </select>
        </label>
        <div className="club-acties kb-knoppen">
          <button type="button" className="club-knop club-knop--stil club-knop--klein" onClick={() => void meteen({ vastgepind: !notitie.vastgepind })}
            aria-pressed={notitie.vastgepind} title={notitie.vastgepind ? t.losmaken : t.vastpinnen}>
            {notitie.vastgepind ? <PinOff size={15} aria-hidden /> : <Pin size={15} aria-hidden />}
            <span>{notitie.vastgepind ? t.losmaken : t.vastpinnen}</span>
          </button>
          <button type="button" className="club-knop club-knop--stil club-knop--klein" onClick={() => void meteen({ gearchiveerd: !notitie.gearchiveerd })}>
            {notitie.gearchiveerd ? <ArchiveRestore size={15} aria-hidden /> : <Archive size={15} aria-hidden />}
            <span>{notitie.gearchiveerd ? t.terugzetten : t.archiveren}</span>
          </button>
          {notitie.gearchiveerd ? (
            <button type="button" className="club-knop club-knop--gevaar club-knop--klein" onClick={() => void verwijder()}>
              <Trash2 size={15} aria-hidden /> <span>{t.verwijderen}</span>
            </button>
          ) : null}
        </div>
      </div>
      <label className="club-sr" htmlFor="kb-titel">{t.titel}</label>
      <input
        id="kb-titel"
        className="kb-titel"
        value={titel}
        maxLength={MAX_TITEL}
        onChange={(e) => { setTitel(e.target.value); later({ titel: e.target.value }) }}
        onBlur={spoel}
        placeholder={t.titel}
      />
      <div className="kb-werkbalk">
        <button type="button" className="club-knop club-knop--klein" onClick={() => { spoel(); setBewerken((x) => !x) }}>
          {bewerken ? <><Check size={15} aria-hidden /> {t.klaar}</> : <><Pencil size={15} aria-hidden /> {t.bewerken}</>}
        </button>
        <button type="button" className="club-knop club-knop--stil club-knop--klein" onClick={vinkErbij}>
          <ListChecks size={15} aria-hidden /> {t.afvinkpunt}
        </button>
        {vinken.totaal > 0 ? <span className="club-hint">{t.vanAfgevinkt(vinken.klaar, vinken.totaal)}</span> : null}
        {bewerken ? <span className="club-hint kb-uitleg">{t.opmaak}</span> : null}
      </div>
      {bewerken ? (
        <>
          <label className="club-sr" htmlFor="kb-inhoud">{t.tekst}</label>
          <textarea
            id="kb-inhoud"
            ref={tekstVeld}
            className="kb-inhoud"
            value={inhoud}
            maxLength={MAX_INHOUD}
            onChange={(e) => { setInhoud(e.target.value); later({ inhoud: e.target.value }) }}
            onBlur={spoel}
            placeholder={t.schrijf}
          />
        </>
      ) : (
        <Leesweergave inhoud={inhoud} onVink={vink} />
      )}
      <p className={`kb-stand${typeof stand === 'object' ? ' kb-stand--fout' : ''}`} role="status" aria-live="polite">
        {standTekst}{notitie.auteur ? ` · ${t.aangemaaktDoor(notitie.auteur)}` : ''}
      </p>
    </article>
  )
}
