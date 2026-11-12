'use client'

import { useState } from 'react'
import { CalendarCheck } from 'lucide-react'
import type { PatroonVoorstel } from '@/lib/lifeos/pt-coaching/coach-overzicht'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { planCoachgesprek } from '@/components/lifeos/pt/coach-plannen'
import { useCoachBeheer } from './CoachgesprekkenBeheer'

// "Volgens vast moment inplannen" (besluit Kane 12-11-2026): de app herkent per
// PT'er de vaste dag en tijd uit de laatste gesprekken en zet met een knop alle
// open weken (deze en volgende) daarop in de agenda. Kane ziet eerst de lijst,
// kan er iets uit halen en plant dan in een keer. Uitnodigingen gaan mee zoals
// bij gewoon inplannen.

const WEEK: Record<PatroonVoorstel['week'], string> = { deze: 'deze week', volgende: 'volgende week' }

function datumKort(datum: string): string {
  const [j, m, d] = datum.split('-').map(Number)
  return new Intl.DateTimeFormat('nl-NL', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
    .format(new Date(Date.UTC(j, m - 1, d)))
    .replace(/\./g, '')
}

const sleutel = (v: PatroonVoorstel) => `${v.ptId}|${v.week}`

export function PatroonInplannen({ voorstellen }: { voorstellen: readonly PatroonVoorstel[] }) {
  const beheer = useCoachBeheer()
  const [open, setOpen] = useState(false)
  const [uit, setUit] = useState<ReadonlySet<string>>(new Set())
  const [bezig, setBezig] = useState(false)
  const [fouten, setFouten] = useState<string[]>([])

  if (voorstellen.length === 0 || !beheer) return null
  const gekozen = voorstellen.filter((v) => !uit.has(sleutel(v)))
  // De mailadressen voor de uitnodigingen komen uit de beheergegevens; die laden even.
  const geladen = gekozen.every((v) => beheer.pt(v.ptId) !== null)

  function wissel(v: PatroonVoorstel) {
    const k = sleutel(v)
    setUit((was) => {
      const nieuw = new Set(was)
      if (nieuw.has(k)) nieuw.delete(k)
      else nieuw.add(k)
      return nieuw
    })
  }

  async function planAlles() {
    if (!beheer) return
    setBezig(true)
    setFouten([])
    const mis: string[] = []
    // Na elkaar, zodat de agenda niet tegelijk overspoeld wordt en elke fout bij een naam hoort.
    for (const v of gekozen) {
      const pt = beheer.pt(v.ptId)
      const u = pt ? await planCoachgesprek(pt, v.datum, v.tijd) : { ok: false as const, fout: 'PT-gegevens niet geladen.' }
      if (!u.ok) mis.push(`${v.naam} (${WEEK[v.week]}): ${u.fout}`)
    }
    setBezig(false)
    setFouten(mis)
    if (mis.length === 0) setOpen(false)
    await beheer.vernieuw()
  }

  return (
    <div className="ptd-patroon">
      {!open ? (
        <button type="button" className="ptd-knop ptd-knop--primair" onClick={() => setOpen(true)}>
          <CalendarCheck size={15} strokeWidth={2.2} aria-hidden /> Inplannen op vast moment ({voorstellen.length})
        </button>
      ) : (
        <div className="ptd-patroon-paneel">
          <p className="ptd-patroon-kop">Inplannen op het vaste moment van elke PT&apos;er</p>
          <ul className="ptd-patroon-lijst">
            {voorstellen.map((v) => (
              <li key={sleutel(v)}>
                <label>
                  <input type="checkbox" checked={!uit.has(sleutel(v))} onChange={() => wissel(v)} disabled={bezig} />
                  <span className="ptd-patroon-naam">{v.naam}</span>
                  <span className="ptd-patroon-wanneer">{datumKort(v.datum)} {v.tijd} · {WEEK[v.week]}</span>
                </label>
              </li>
            ))}
          </ul>
          <div className="ptd-patroon-knoppen">
            <button type="button" className="ptd-knop ptd-knop--primair" onClick={() => void planAlles()} disabled={bezig || !geladen || gekozen.length === 0}>
              {bezig ? 'Bezig met inplannen' : `Plan ${gekozen.length} ${gekozen.length === 1 ? 'gesprek' : 'gesprekken'} in`}
            </button>
            <button type="button" className="ptd-knop" onClick={() => setOpen(false)} disabled={bezig}>Annuleren</button>
          </div>
          {fouten.length > 0 ? <Foutmelding bericht={`Niet gelukt: ${fouten.join('; ')}`} /> : null}
        </div>
      )}
    </div>
  )
}
