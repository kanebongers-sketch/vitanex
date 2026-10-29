'use client'

import { useState, type FormEvent } from 'react'
import { stuur } from '@/components/club/leden/stuur'
import { GRENS, type Gezin, type Korting } from '@/lib/club/betalen/plannen/model'
import { kortingWaardeTekst } from '@/lib/club/betalen/plannen/tekst'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { BETALEN } from '@/lib/aiyourgym/taal/woorden/club/betalen'

// De gezinskorting: per gezin vanaf het hoeveelste lid welke korting geldt.
// Alleen de instelling: leden aan een gezin koppelen en de korting op de
// factuur zetten komt in een volgende stap. Dat staat er eerlijk bij.

interface Props {
  gezinnen: readonly Gezin[]
  kortingen: readonly Korting[]
  onKlaar: (tekst: string, ok?: boolean) => void
}

interface Staat {
  naam: string
  vanaf: string
  kortingId: string
}

const VANAF = Array.from({ length: GRENS.gezinVanafMax - GRENS.gezinVanafMin + 1 }, (_, i) => i + GRENS.gezinVanafMin)

function GezinForm({ begin, kortingen, onKlaar, onAnnuleer }: { begin?: Gezin; kortingen: readonly Korting[]; onKlaar: (t: string, ok?: boolean) => void; onAnnuleer?: () => void }) {
  const [s, setS] = useState<Staat>({ naam: begin?.naam ?? '', vanaf: String(begin?.vanaf ?? 2), kortingId: begin?.kortingId ?? '' })
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const taal = useTaal()
  const t = useTekst(BETALEN).gezin

  async function bewaar(e: FormEvent) {
    e.preventDefault()
    setBezig(true)
    setFout(null)
    const body = { naam: s.naam, vanaf: s.vanaf, kortingId: s.kortingId === '' ? null : s.kortingId }
    const uit = begin ? await stuur(`/api/club/betalen/kortingen/gezinnen/${begin.id}`, 'PATCH', body) : await stuur('/api/club/betalen/kortingen/gezinnen', 'POST', body)
    setBezig(false)
    if (!uit.ok) return setFout(uit.fout)
    if (!begin) setS({ naam: '', vanaf: '2', kortingId: '' })
    onKlaar(begin ? t.aangepast : t.toegevoegd)
  }

  return (
    <form className="club-korting-form" onSubmit={(e) => void bewaar(e)}>
      <div className="club-formrij club-plan-rij3">
        <label className="club-veld">
          <span>{t.naam}</span>
          <input className="club-invoer" maxLength={GRENS.gezinNaamMax} value={s.naam} onChange={(e) => setS({ ...s, naam: e.target.value })} placeholder={t.naamVoorbeeld} />
        </label>
        <label className="club-veld">
          <span>{t.vanaf}</span>
          <select className="club-invoer" value={s.vanaf} onChange={(e) => setS({ ...s, vanaf: e.target.value })}>
            {VANAF.map((n) => <option key={n} value={n}>{t.hetLid(n)}</option>)}
          </select>
        </label>
        <label className="club-veld">
          <span>{t.welke}</span>
          <select className="club-invoer" value={s.kortingId} onChange={(e) => setS({ ...s, kortingId: e.target.value })}>
            <option value="">{t.nogGeen}</option>
            {kortingen.map((k) => <option key={k.id} value={k.id}>{k.naam}, {kortingWaardeTekst(k, taal)}</option>)}
          </select>
        </label>
      </div>
      <div role="alert">{fout && <p className="club-melding club-melding--fout">{fout}</p>}</div>
      <div className="club-lidm-formacties">
        <button type="submit" className="club-knop club-knop--primair" disabled={bezig}>{bezig ? t.bezig : begin ? t.opslaan : t.toevoegen}</button>
        {onAnnuleer && <button type="button" className="club-knop club-knop--stil" onClick={onAnnuleer}>{t.annuleren}</button>}
      </div>
    </form>
  )
}

function GezinRegel({ gezin: g, kortingen, onKlaar }: { gezin: Gezin; kortingen: readonly Korting[]; onKlaar: (t: string, ok?: boolean) => void }) {
  const [bewerken, setBewerken] = useState(false)
  const korting = kortingen.find((k) => k.id === g.kortingId)
  const taal = useTaal()
  const t = useTekst(BETALEN).gezin

  async function verwijder() {
    const uit = await stuur(`/api/club/betalen/kortingen/gezinnen/${g.id}`, 'DELETE')
    onKlaar(uit.ok ? t.verwijderd : uit.fout, uit.ok)
  }

  if (bewerken) {
    return (
      <li className="club-lidm-regel is-bewerken">
        <GezinForm begin={g} kortingen={kortingen} onAnnuleer={() => setBewerken(false)} onKlaar={(t, ok) => { setBewerken(false); onKlaar(t, ok) }} />
      </li>
    )
  }
  return (
    <li className="club-lidm-regel" data-kleur="blauw">
      <div className="club-lidm-inhoud">
        <h3 className="club-lidm-naam">{g.naam ?? t.zonderNaam}</h3>
        <ul className="club-lidm-regels">
          <li>{t.vanafLid(g.vanaf)}</li>
          <li>{korting ? `${korting.naam}, ${kortingWaardeTekst(korting, taal)}` : t.geenKorting}</li>
        </ul>
      </div>
      <div className="club-lidm-knoppen">
        <button type="button" className="club-knop club-knop--klein club-knop--stil" onClick={() => setBewerken(true)}>{t.wijzigen}</button>
        <button type="button" className="club-knop club-knop--klein club-knop--stil" onClick={() => void verwijder()}>{t.verwijderen}</button>
      </div>
    </li>
  )
}

export function GezinnenBeheer({ gezinnen, kortingen, onKlaar }: Props) {
  const t = useTekst(BETALEN).gezin
  return (
    <section className="club-lidm-hoofd" aria-labelledby="kortingen-gezin">
      <h2 id="kortingen-gezin" className="club-lidm-kop">{t.titel}</h2>
      <p className="club-hint">{t.uitleg}</p>
      {gezinnen.length === 0 ? (
        <p className="club-lidm-leeg">{t.leeg}</p>
      ) : (
        <ul className="club-lidm-lijst">
          {gezinnen.map((g) => <GezinRegel key={g.id} gezin={g} kortingen={kortingen} onKlaar={onKlaar} />)}
        </ul>
      )}
      <div className="club-kaart">
        <h3 className="club-plannen-kop">{t.nieuw}</h3>
        <GezinForm kortingen={kortingen} onKlaar={onKlaar} />
      </div>
    </section>
  )
}
