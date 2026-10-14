'use client'

import { useState, type FormEvent } from 'react'
import { ArrowDown, ArrowUp, Pencil, Plus } from 'lucide-react'
import { MOMENT_LABEL, frequentieTekst, type Taak, type Takenlijst } from '@/lib/club/taken/typen'
import { TaakFormulier, alsBody, type TaakWaarden } from './TaakFormulier'
import { useBeheer } from './useBeheer'

// Beheer van een lijst: hernoemen, verplaatsen, aan/uit, en per taak hetzelfde
// plus frequentie en moment. Taken worden uitgezet, nooit verwijderd, zodat
// de geschiedenis in het overzicht blijft kloppen.

interface RijProps {
  taak: Taak
  groepen: string[]
  eerste: boolean
  laatste: boolean
}

function TaakRij({ taak, groepen, eerste, laatste }: RijProps) {
  const { bezig, fout, stuur } = useBeheer()
  const [wijzig, setWijzig] = useState(false)
  const url = `/api/club/taken/taak/${taak.id}`

  async function opslaan(w: TaakWaarden) {
    const r = await stuur(url, 'PATCH', alsBody(w))
    if (r.ok) setWijzig(false)
    return r.ok
  }

  return (
    <li className="club-taken-beheerrij" data-uit={taak.actief ? undefined : ''}>
      {wijzig ? (
        <TaakFormulier id={`taak-${taak.id}`} start={taak} groepen={groepen} knop="Opslaan" bezig={bezig} onOpslaan={opslaan} onAnnuleer={() => setWijzig(false)} />
      ) : (
        <div className="club-taken-beheerrij-lijn">
          <span className="club-rij-hoofd">
            <span className="club-rij-titel">{taak.naam}</span>
            <span className="club-rij-sub">
              {[taak.groep, frequentieTekst(taak), MOMENT_LABEL[taak.moment]].filter(Boolean).join(' · ')}
              {!taak.actief && ' · uitgezet'}
            </span>
          </span>
          <span className="club-taken-beheerknoppen">
            <button type="button" className="club-knop club-knop--klein" aria-label={`${taak.naam} omhoog`} disabled={bezig || eerste} onClick={() => void stuur(url, 'PATCH', { verplaats: 'omhoog' })}>
              <ArrowUp size={15} aria-hidden />
            </button>
            <button type="button" className="club-knop club-knop--klein" aria-label={`${taak.naam} omlaag`} disabled={bezig || laatste} onClick={() => void stuur(url, 'PATCH', { verplaats: 'omlaag' })}>
              <ArrowDown size={15} aria-hidden />
            </button>
            <button type="button" className="club-knop club-knop--klein" aria-label={`${taak.naam} wijzigen`} onClick={() => setWijzig(true)}>
              <Pencil size={15} aria-hidden />
            </button>
            <button type="button" className="club-knop club-knop--klein" aria-pressed={taak.actief} disabled={bezig} onClick={() => void stuur(url, 'PATCH', { actief: !taak.actief })}>
              {taak.actief ? 'Zet uit' : 'Zet aan'}
            </button>
          </span>
        </div>
      )}
      {fout && (
        <p className="club-fout" role="alert">
          {fout}
        </p>
      )}
    </li>
  )
}

function LijstKop({ lijst, eerste, laatste }: { lijst: Takenlijst; eerste: boolean; laatste: boolean }) {
  const { bezig, fout, stuur } = useBeheer()
  const [naam, setNaam] = useState(lijst.naam)
  const url = `/api/club/taken/lijst/${lijst.id}`

  function hernoem(e: FormEvent) {
    e.preventDefault()
    if (naam.trim() && naam.trim() !== lijst.naam) void stuur(url, 'PATCH', { naam })
  }

  return (
    <header className="club-taken-beheerkop">
      <form onSubmit={hernoem} className="club-taken-beheernaam">
        <label className="club-sr" htmlFor={`lijst-${lijst.id}`}>
          Naam van de lijst
        </label>
        <input id={`lijst-${lijst.id}`} className="club-invoer" value={naam} onChange={(e) => setNaam(e.target.value)} maxLength={60} />
        {naam.trim() !== lijst.naam && (
          <button type="submit" className="club-knop club-knop--klein club-knop--primair" disabled={bezig}>
            Hernoem
          </button>
        )}
      </form>
      <span className="club-taken-beheerknoppen">
        {!lijst.actief && <span className="club-chip club-chip--uit">Uitgezet</span>}
        <button type="button" className="club-knop club-knop--klein" aria-label={`Lijst ${lijst.naam} omhoog`} disabled={bezig || eerste} onClick={() => void stuur(url, 'PATCH', { verplaats: 'omhoog' })}>
          <ArrowUp size={15} aria-hidden />
        </button>
        <button type="button" className="club-knop club-knop--klein" aria-label={`Lijst ${lijst.naam} omlaag`} disabled={bezig || laatste} onClick={() => void stuur(url, 'PATCH', { verplaats: 'omlaag' })}>
          <ArrowDown size={15} aria-hidden />
        </button>
        <button type="button" className="club-knop club-knop--klein" aria-pressed={lijst.actief} disabled={bezig} onClick={() => void stuur(url, 'PATCH', { actief: !lijst.actief })}>
          {lijst.actief ? 'Zet lijst uit' : 'Zet lijst aan'}
        </button>
      </span>
      {fout && (
        <p className="club-fout" role="alert">
          {fout}
        </p>
      )}
    </header>
  )
}

interface LijstProps {
  lijst: Takenlijst
  taken: Taak[]
  eerste: boolean
  laatste: boolean
}

export function BeheerLijst({ lijst, taken, eerste, laatste }: LijstProps) {
  const { bezig, fout, stuur } = useBeheer()
  const [nieuw, setNieuw] = useState(false)
  const groepen = [...new Set(taken.map((t) => t.groep).filter((g): g is string => g !== null))]

  async function voegToe(w: TaakWaarden) {
    const r = await stuur('/api/club/taken/taak', 'POST', { lijstId: lijst.id, ...alsBody(w) })
    return r.ok
  }

  return (
    <section className="club-kaart club-taken-beheer" aria-label={`Lijst ${lijst.naam}`} data-uit={lijst.actief ? undefined : ''}>
      <LijstKop key={lijst.naam} lijst={lijst} eerste={eerste} laatste={laatste} />
      {taken.length === 0 ? (
        <p className="club-hint">Nog geen taken in deze lijst.</p>
      ) : (
        <ol className="club-taken-beheerlijst">
          {taken.map((t, i) => (
            <TaakRij key={t.id} taak={t} groepen={groepen} eerste={i === 0} laatste={i === taken.length - 1} />
          ))}
        </ol>
      )}
      {nieuw ? (
        <div className="club-taken-nieuw">
          <TaakFormulier id={`nieuw-${lijst.id}`} groepen={groepen} knop="Toevoegen" bezig={bezig} onOpslaan={voegToe} onAnnuleer={() => setNieuw(false)} />
          {fout && (
            <p className="club-fout" role="alert">
              {fout}
            </p>
          )}
        </div>
      ) : (
        <button type="button" className="club-knop club-knop--stil club-taken-nieuwknop" onClick={() => setNieuw(true)}>
          <Plus size={16} aria-hidden />
          Taak toevoegen
        </button>
      )}
    </section>
  )
}
