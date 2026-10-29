'use client'

import { useMemo, useState, type FormEvent } from 'react'
import { Trash2 } from 'lucide-react'
import type { DagNotitie } from '@/lib/club/taken/typen'
import { dagKort, dagLang, dagNummer } from '@/lib/club/taken/weergave'
import { PERSOON_VELD_ID, useAfvinken } from './AfvinkContext'
import { alsNotitie, klok, vraag } from './vraag'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { TAKEN } from '@/lib/aiyourgym/taal/woorden/club/taken'

// "Noteer hier als je iets anders hebt gedaan!" Per dag een paar regels vrije
// tekst, met wie het schreef en hoe laat.

interface DagProps {
  datum: string
  begin: DagNotitie[]
  /** Op de tabletweergave staat de kop er al boven. */
  zonderKop?: boolean
}

export function DagNotities({ datum, begin, zonderKop }: DagProps) {
  const { persoon, vestiging, vandaag, meld } = useAfvinken()
  const [notities, setNotities] = useState(begin)
  const [vorige, setVorige] = useState(begin)
  const [tekst, setTekst] = useState('')
  const [bezig, setBezig] = useState(false)
  const taal = useTaal()
  const t = useTekst(TAKEN).notities
  if (begin !== vorige) {
    setVorige(begin)
    setNotities(begin)
  }
  const kanSchrijven = datum <= vandaag
  const veldId = `club-taken-notitie-${datum}`

  async function voegToe(e: FormEvent) {
    e.preventDefault()
    if (!tekst.trim()) return
    if (!persoon) {
      meld(t.kiesWie)
      document.getElementById(PERSOON_VELD_ID)?.focus()
      return
    }
    setBezig(true)
    const r = await vraag('/api/club/taken/notities', 'POST', { vestiging, datum, tekst, medewerkerId: persoon.medewerkerId, wie: persoon.wie }, taal)
    setBezig(false)
    const nieuw = r.ok ? alsNotitie(r.data) : null
    if (!nieuw) {
      meld(r.ok ? t.nietOpgeslagen : r.fout)
      return
    }
    setNotities((n) => [...n, nieuw])
    setTekst('')
  }

  async function verwijder(id: string) {
    const weg = notities.find((n) => n.id === id)
    setNotities((n) => n.filter((x) => x.id !== id))
    const r = await vraag(`/api/club/taken/notities/${id}`, 'DELETE', undefined, taal)
    if (!r.ok && weg) {
      setNotities((n) => [...n, weg])
      meld(r.fout)
    }
  }

  return (
    <div className="club-taken-notitiedag" data-vandaag={datum === vandaag ? '' : undefined}>
      {!zonderKop && (
        <h3 className="club-taken-notitiedag-kop">
          <span>{dagKort(datum, taal)}</span> {dagNummer(datum)}
        </h3>
      )}
      {notities.length > 0 && (
        <ul className="club-taken-notities">
          {notities.map((n) => (
            <li key={n.id}>
              <p>{n.tekst}</p>
              <span className="club-taken-notitie-wie">
                {n.wie ?? t.onbekend} · {klok(n.aangemaaktOp)}
              </span>
              <button type="button" className="club-knop club-knop--stil club-knop--klein club-taken-print-weg" onClick={() => void verwijder(n.id)} aria-label={t.verwijder(dagLang(datum, taal))}>
                <Trash2 size={14} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
      {kanSchrijven && (
        <form className="club-taken-notitieform club-taken-print-weg" onSubmit={voegToe}>
          <label htmlFor={veldId} className="club-sr">
            {t.ietsAnders(dagLang(datum, taal))}
          </label>
          <textarea id={veldId} className="club-invoer" rows={2} maxLength={1000} placeholder={t.plaats} value={tekst} onChange={(e) => setTekst(e.target.value)} />
          <button type="submit" className="club-knop club-knop--klein" disabled={bezig || !tekst.trim()}>
            {bezig ? t.bezig : t.noteer}
          </button>
        </form>
      )}
    </div>
  )
}

interface WeekProps {
  dagen: string[]
  notities: DagNotitie[]
}

const GEEN: DagNotitie[] = []

export function WeekNotities({ dagen, notities }: WeekProps) {
  const t = useTekst(TAKEN).notities
  const perDag = useMemo(() => {
    const m = new Map<string, DagNotitie[]>()
    for (const n of notities) m.set(n.datum, [...(m.get(n.datum) ?? []), n])
    return m
  }, [notities])
  return (
    <section className="club-taken-notitieweek" aria-labelledby="club-taken-notities-kop">
      <h2 id="club-taken-notities-kop" className="club-taken-lijstnaam">
        {t.titel}
      </h2>
      <div className="club-taken-notitieraster">
        {dagen.map((d) => (
          <DagNotities key={d} datum={d} begin={perDag.get(d) ?? GEEN} />
        ))}
      </div>
    </section>
  )
}
