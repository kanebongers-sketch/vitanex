'use client'

import { useState, type FormEvent } from 'react'
import { Check } from 'lucide-react'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import {
  CHECKIN_VRAGEN, ENERGIE_LABEL, ENERGIE_NIVEAUS, isLeeg, leesCheckin, momentLabel, weekLabel,
  type Checkin, type CheckinInvoer, type Energie,
} from '@/lib/lifeos/pt-dashboard/checkin'
import { Keuzes, Veld } from './velden'
import { ptApi } from './api'

// De weekcheck-in: energie (1–5) en vier korte vragen. Opslaan kan zo vaak je
// wilt; de server bewaart één check-in per week (de lopende week, NL-tijd).
// "Laatst opgeslagen" komt van de server, niet van de klok van dit toestel.

interface Props {
  code: string
  /** De check-in van deze week, of null als er nog niets is opgeslagen. */
  begin: Checkin | null
  /** De week waarvoor de pagina geladen is (maandag, YYYY-MM-DD). */
  week: string
}

const LEEG: CheckinInvoer = { energie: null, gewonnen: null, lastig: null, bespreken: null, focus: null }

const ENERGIE_OPTIES = ENERGIE_NIVEAUS.map((n) => ({ waarde: String(n) as `${Energie}`, label: `${n} · ${ENERGIE_LABEL[n]}` }))

function invoerVan(c: Checkin | null): CheckinInvoer {
  if (!c) return LEEG
  return { energie: c.energie, gewonnen: c.gewonnen, lastig: c.lastig, bespreken: c.bespreken, focus: c.focus }
}

function gelijk(a: CheckinInvoer, b: CheckinInvoer): boolean {
  return a.energie === b.energie && CHECKIN_VRAGEN.every((v) => (a[v.veld] ?? '').trim() === (b[v.veld] ?? '').trim())
}

export function CheckinFormulier({ code, begin, week }: Props) {
  const [v, setV] = useState<CheckinInvoer>(() => invoerVan(begin))
  const [opgeslagen, setOpgeslagen] = useState<Checkin | null>(begin)
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const gewijzigd = !gelijk(v, invoerVan(opgeslagen))
  const nieuweWeek = opgeslagen !== null && opgeslagen.week !== week

  async function opslaan(e: FormEvent) {
    e.preventDefault()
    if (bezig) return
    if (isLeeg(v)) return setFout('Vul minstens je energie of één vraag in.')
    setBezig(true)
    setFout(null)
    const uit = await ptApi(code, 'checkin', 'PUT', v, leesCheckin)
    setBezig(false)
    if (!uit.ok) return setFout(uit.uitgelogd ? `${uit.fout} Je tekst staat nog hier.` : uit.fout)
    setOpgeslagen(uit.waarde)
    setV(invoerVan(uit.waarde))
  }

  return (
    <form className="ptd-form" onSubmit={(e) => void opslaan(e)} aria-describedby="ptd-checkin-status" noValidate>
      <Keuzes
        label="Hoeveel energie had je deze week?"
        opties={ENERGIE_OPTIES}
        waarde={v.energie === null ? null : (String(v.energie) as `${Energie}`)}
        onKies={(w) => setV((x) => ({ ...x, energie: w === null ? null : (Number(w) as Energie) }))}
        leegToegestaan
      />
      {CHECKIN_VRAGEN.map((q) => {
        const id = `ptd-checkin-${q.veld}`
        const waarde = v[q.veld] ?? ''
        return (
          <Veld key={q.veld} label={q.label} id={id} hint={`${q.hint} · ${waarde.length}/${q.max}`}>
            <textarea
              id={id}
              className="ptd-invoer"
              rows={q.max > 300 ? 3 : 2}
              maxLength={q.max}
              value={waarde}
              onChange={(e) => {
                const tekst = e.target.value
                setV((x) => ({ ...x, [q.veld]: tekst === '' ? null : tekst }))
              }}
            />
          </Veld>
        )
      })}

      <div className="ptd-acties">
        <button type="submit" className="ptd-knop ptd-knop--primair" disabled={bezig || (!gewijzigd && opgeslagen !== null)}>
          {bezig ? 'Opslaan…' : opgeslagen ? 'Wijzigingen opslaan' : 'Check-in opslaan'}
        </button>
        <p id="ptd-checkin-status" className="ptd-hint" role="status" aria-live="polite">
          <StatusTekst opgeslagen={opgeslagen} gewijzigd={gewijzigd} />
        </p>
      </div>
      {nieuweWeek && opgeslagen ? (
        <p className="ptd-hint">
          Er is intussen een nieuwe week begonnen: dit is opgeslagen als check-in voor de {weekLabel(opgeslagen.week)}.
        </p>
      ) : null}
      {fout ? <Foutmelding bericht={fout} /> : null}
    </form>
  )
}

function StatusTekst({ opgeslagen, gewijzigd }: { opgeslagen: Checkin | null; gewijzigd: boolean }) {
  if (!opgeslagen) return <>Nog niet opgeslagen.</>
  if (gewijzigd) return <>Niet-opgeslagen wijzigingen · laatst opgeslagen {momentLabel(opgeslagen.bijgewerktOp)}</>
  return (
    <span className="ptd-vink">
      <Check size={15} aria-hidden /> Opgeslagen {momentLabel(opgeslagen.bijgewerktOp)}
    </span>
  )
}
