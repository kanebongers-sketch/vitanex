'use client'

import { Plus } from 'lucide-react'
import { START_LIB } from '@/lib/aiyourgym/taal/woorden/club/start-lib'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { START } from '@/lib/aiyourgym/taal/woorden/club/start'
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

function typeNaam(typen: readonly TypeRij[], sleutel: string, anders: string): string {
  return typen.find((t) => t.sleutel === sleutel)?.naam.trim() || anders
}

interface LesKaartProps {
  l: LesRij
  typen: TypeRij[]
  zalen: Keuze[]
  instructeurs: Keuze[]
  onWijzig: WeekLessenProps['onWijzig']
}

function LesKaart({ l, typen, zalen, instructeurs, onWijzig }: LesKaartProps) {
  const taal = useTaal()
  const t = useTekst(START).week
  const naamloos = useTekst(START).lestypen.naamloos
  const dagen = START_LIB[taal].week.dagLang
  const naam = typeNaam(typen, l.typeSleutel, t.les)
  const zet = (w: Partial<LesRij>) => onWijzig(l.sleutel, w)
  return (
    <li className="club-start-leskaart" data-uit={!l.aan || undefined}>
      <label className="club-start-schakel">
        <input type="checkbox" role="switch" checked={l.aan} onChange={() => zet({ aan: !l.aan })} aria-label={t.schakel(naam, dagen[l.weekdag - 1] ?? '', l.starttijd)} />
        <span className="club-start-schakel-baan" aria-hidden />
      </label>
      <div className="club-start-leskaart-velden">
        <label className="club-veld club-start-leskaart-les">
          <span>{t.les}</span>
          <select className="club-invoer" value={l.typeSleutel} disabled={!l.aan} onChange={(e) => zet({ typeSleutel: e.target.value })}>
            {typen.filter((x) => x.aan).map((x) => (
              <option key={x.sleutel} value={x.sleutel}>{x.naam.trim() || naamloos}</option>
            ))}
          </select>
        </label>
        <label className="club-veld">
          <span>{t.dag}</span>
          <select className="club-invoer" value={l.weekdag} disabled={!l.aan} onChange={(e) => zet({ weekdag: Number(e.target.value) })}>
            {dagen.map((d, i) => (
              <option key={d} value={i + 1}>{d}</option>
            ))}
          </select>
        </label>
        <label className="club-veld">
          <span>{t.tijd}</span>
          <input className="club-invoer" type="time" step={300} value={l.starttijd} disabled={!l.aan} onChange={(e) => zet({ starttijd: e.target.value })} />
        </label>
        <label className="club-veld">
          <span>{t.duur}</span>
          <input className="club-invoer" type="number" inputMode="numeric" min={10} max={240} step={5} value={l.duurMin} disabled={!l.aan} onChange={(e) => zet({ duurMin: Number(e.target.value) })} />
        </label>
        <label className="club-veld">
          <span>{t.plekken}</span>
          <input className="club-invoer" type="number" inputMode="numeric" min={1} max={500} value={l.capaciteit} disabled={!l.aan} onChange={(e) => zet({ capaciteit: Number(e.target.value) })} />
        </label>
        <label className="club-veld">
          <span>{t.zaal}</span>
          <select className="club-invoer" value={l.zaalId ?? ''} disabled={!l.aan} onChange={(e) => zet({ zaalId: e.target.value || null })}>
            <option value="">{t.geenZaal}</option>
            {zalen.map((z) => (
              <option key={z.id} value={z.id}>{z.naam}</option>
            ))}
          </select>
        </label>
        <label className="club-veld">
          <span>{t.instructeur}</span>
          <select className="club-invoer" value={l.instructeurId ?? ''} disabled={!l.aan} onChange={(e) => zet({ instructeurId: e.target.value || null })}>
            <option value="">{t.wisselt}</option>
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
  const heeftTypen = typen.some((x) => x.aan)
  const t = useTekst(START).week
  return (
    <section className="club-start-blok" aria-labelledby="start-lessen-kop">
      <div className="club-start-blokkop">
        <h2 id="start-lessen-kop">{t.kop(vestigingNaam)}</h2>
        <span className="club-chip club-chip--merk">{t.perWeek(aan)}</span>
      </div>
      <p className="club-hint">{t.uitleg}</p>
      {lessen.length > 0 ? (
        <ul className="club-start-leskaarten" role="list">
          {lessen.map((l) => (
            <LesKaart key={l.sleutel} l={l} typen={typen} zalen={zalen} instructeurs={instructeurs} onWijzig={onWijzig} />
          ))}
        </ul>
      ) : (
        <p className="club-leeg">{heeftTypen ? t.geenLessen : t.eerstTypen}</p>
      )}
      {heeftTypen && (
        <button type="button" className="club-knop club-start-lesnieuw" onClick={onNieuw}>
          <Plus aria-hidden size={16} /> {t.lesToevoegen}
        </button>
      )}
      {heeftTypen && aan === 0 && (
        <label className="club-start-bevestig">
          <input type="checkbox" checked={geen} onChange={(e) => onGeen(e.target.checked)} />
          <span>
            <strong>{t.geen}</strong>
            <span className="club-zacht">{t.geenUitleg}</span>
          </span>
        </label>
      )}
    </section>
  )
}
