'use client'

import { Plus } from 'lucide-react'
import { WEEKDAG_LABEL } from '@/lib/club/rooster/openingstijden'
import type { LesRij, TypeRij } from '@/lib/club/start/lessen-plan'

// De vaste week in stap Lessen. Het voorstel staat al aan; met de schakelaar
// haal je een les eruit. Per les meteen dag, tijd, duur, plekken, zaal en
// instructeur. Op een breed scherm staat elke les op een regel, op de
// telefoon is het een kaartje met de velden in twee kolommen. Geef je geen
// vaste lessen (alleen afspraken of vrij trainen), dan vink je dat hier aan.

export interface Keuze {
  id: string
  naam: string
}

interface WeekLessenProps {
  vestigingNaam: string
  lessen: LesRij[]
  typen: TypeRij[]
  zalen: Keuze[]
  instructeurs: Keuze[]
  onWijzig: (sleutel: string, w: Partial<LesRij>) => void
  onNieuw: () => void
  /** Bevestigd: geen vaste lessen. */
  geen: boolean
  onGeen: (geen: boolean) => void
}

function typeNaam(typen: readonly TypeRij[], sleutel: string): string {
  return typen.find((t) => t.sleutel === sleutel)?.naam.trim() || 'Les'
}

interface LesKaartProps {
  l: LesRij
  typen: TypeRij[]
  zalen: Keuze[]
  instructeurs: Keuze[]
  onWijzig: WeekLessenProps['onWijzig']
}

function LesKaart({ l, typen, zalen, instructeurs, onWijzig }: LesKaartProps) {
  const naam = typeNaam(typen, l.typeSleutel)
  const zet = (w: Partial<LesRij>) => onWijzig(l.sleutel, w)
  return (
    <li className="club-start-leskaart" data-uit={!l.aan || undefined}>
      <label className="club-start-schakel">
        <input type="checkbox" role="switch" checked={l.aan} onChange={() => zet({ aan: !l.aan })} aria-label={`${naam} op ${WEEKDAG_LABEL[l.weekdag - 1] ?? ''} ${l.starttijd} in je week`} />
        <span className="club-start-schakel-baan" aria-hidden />
      </label>
      <div className="club-start-leskaart-velden">
        <label className="club-veld club-start-leskaart-les">
          <span>Les</span>
          <select className="club-invoer" value={l.typeSleutel} disabled={!l.aan} onChange={(e) => zet({ typeSleutel: e.target.value })}>
            {typen.filter((t) => t.aan).map((t) => (
              <option key={t.sleutel} value={t.sleutel}>{t.naam.trim() || 'Naamloos'}</option>
            ))}
          </select>
        </label>
        <label className="club-veld">
          <span>Dag</span>
          <select className="club-invoer" value={l.weekdag} disabled={!l.aan} onChange={(e) => zet({ weekdag: Number(e.target.value) })}>
            {WEEKDAG_LABEL.map((d, i) => (
              <option key={d} value={i + 1}>{d}</option>
            ))}
          </select>
        </label>
        <label className="club-veld">
          <span>Tijd</span>
          <input className="club-invoer" type="time" step={300} value={l.starttijd} disabled={!l.aan} onChange={(e) => zet({ starttijd: e.target.value })} />
        </label>
        <label className="club-veld">
          <span>Duur (min)</span>
          <input className="club-invoer" type="number" inputMode="numeric" min={10} max={240} step={5} value={l.duurMin} disabled={!l.aan} onChange={(e) => zet({ duurMin: Number(e.target.value) })} />
        </label>
        <label className="club-veld">
          <span>Plekken</span>
          <input className="club-invoer" type="number" inputMode="numeric" min={1} max={500} value={l.capaciteit} disabled={!l.aan} onChange={(e) => zet({ capaciteit: Number(e.target.value) })} />
        </label>
        <label className="club-veld">
          <span>Zaal</span>
          <select className="club-invoer" value={l.zaalId ?? ''} disabled={!l.aan} onChange={(e) => zet({ zaalId: e.target.value || null })}>
            <option value="">Geen vaste zaal</option>
            {zalen.map((z) => (
              <option key={z.id} value={z.id}>{z.naam}</option>
            ))}
          </select>
        </label>
        <label className="club-veld">
          <span>Instructeur</span>
          <select className="club-invoer" value={l.instructeurId ?? ''} disabled={!l.aan} onChange={(e) => zet({ instructeurId: e.target.value || null })}>
            <option value="">Wisselt per week</option>
            {instructeurs.map((m) => (
              <option key={m.id} value={m.id}>{m.naam}</option>
            ))}
          </select>
        </label>
      </div>
    </li>
  )
}

export function WeekLessen({ vestigingNaam, lessen, typen, zalen, instructeurs, onWijzig, onNieuw, geen, onGeen }: WeekLessenProps) {
  const aan = lessen.filter((l) => l.aan).length
  const heeftTypen = typen.some((t) => t.aan)
  return (
    <section className="club-start-blok" aria-labelledby="start-lessen-kop">
      <div className="club-start-blokkop">
        <h2 id="start-lessen-kop">Je week in {vestigingNaam}</h2>
        <span className="club-chip club-chip--merk">{aan} {aan === 1 ? 'les' : 'lessen'} per week</span>
      </div>
      <p className="club-hint">Elke les komt elke week terug en staat na opslaan meteen in het rooster, zodat leden kunnen reserveren. Zet een les uit die je niet geeft.</p>
      {lessen.length > 0 ? (
        <ul className="club-start-leskaarten" role="list">
          {lessen.map((l) => (
            <LesKaart key={l.sleutel} l={l} typen={typen} zalen={zalen} instructeurs={instructeurs} onWijzig={onWijzig} />
          ))}
        </ul>
      ) : (
        <p className="club-leeg">{heeftTypen ? 'Nog geen vaste lessen. Voeg hieronder je eerste les toe.' : 'Kies eerst welke lessen je geeft.'}</p>
      )}
      {heeftTypen && (
        <button type="button" className="club-knop club-start-lesnieuw" onClick={onNieuw}>
          <Plus aria-hidden size={16} /> Les toevoegen
        </button>
      )}
      {heeftTypen && aan === 0 && (
        <label className="club-start-bevestig">
          <input type="checkbox" checked={geen} onChange={(e) => onGeen(e.target.checked)} />
          <span>
            <strong>Ik heb geen vaste lessen</strong>
            <span className="club-zacht">Bijvoorbeeld alleen afspraken of vrij trainen.</span>
          </span>
        </label>
      )}
    </section>
  )
}
