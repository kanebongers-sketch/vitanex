'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { CalendarClock, CalendarOff } from 'lucide-react'
import { haalJson } from '@/lib/lifeos/api/http'
import {
  leesAgendaDagen,
  type AfspraakJson,
  type AgendaDag,
  type AgendaDagen,
} from '@/lib/lifeos/agenda/agenda'
import { datumSleutel, leesDatumSleutel, tijdLabel } from '@/lib/lifeos/datum/datum'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'

// ─── CRM — week-strip ───────────────────────────────────────────────────────
// Een compacte vooruitblik: de komende 7 dagen (vandaag + 6) met de geplande
// afspraken uit de gekoppelde Google-agenda, zodat je je contact-week in één
// oogopslag ziet. Leest `/api/lifeos/agenda/dagen?aantal=7` — dezelfde bron als
// de agenda-weergave, hetzelfde `haalJson`-narrow-patroon.
//
// Drie staten die echt verschillen, plus laden:
//   fout           — er ging iets mis (fout ≠ leeg; nooit "je week is leeg" tonen).
//   niet gekoppeld — een rustige hint, geen harde fout: dit is een normale staat.
//   gekoppeld      — de strip. Een dag zónder afspraken is écht leeg ("—"), niet
//                    verzonnen. `laatsteSync` toont eerlijk hoe vers het is.
//
// Strikt twee-tonig (navy + cyan): de agenda-kleuren blijven bewust wég; hier
// draagt cyan alleen het accent voor vandaag en de dunne afspraak-lijn.

interface WeekStripProps {
  /** Kop boven de strip. Zelfstandig bruikbaar zonder verplichte props. */
  titel?: string
}

type Staat =
  | { fase: 'laden' }
  | { fase: 'fout'; bericht: string }
  | { fase: 'ok'; data: AgendaDagen }

/** Max afspraken per dagkolom; de rest telt als een eerlijk "+N meer". */
const MAX_TONEN = 4

export function WeekStrip({ titel = 'Deze week' }: WeekStripProps) {
  const [staat, setStaat] = useState<Staat>({ fase: 'laden' })

  // Generatieteller: een vlucht die bij unmount of na een retry nog loopt, zet
  // straks niets meer — anders wint de oudste die toevallig als laatste terugkomt.
  const generatie = useRef(0)

  const laad = useCallback((): Promise<void> => {
    const mijn = ++generatie.current
    return haalJson('/api/lifeos/agenda/dagen?aantal=7', leesAgendaDagen).then((uitkomst) => {
      if (mijn !== generatie.current) return // ingehaald of ontkoppeld
      setStaat(
        uitkomst.ok
          ? { fase: 'ok', data: uitkomst.waarde }
          : { fase: 'fout', bericht: uitkomst.fout },
      )
    })
  }, [])

  const verval = useCallback(() => {
    generatie.current++
  }, [])

  useEffect(() => {
    void laad()
    return verval
  }, [laad, verval])

  const opnieuw = useCallback(() => {
    setStaat({ fase: 'laden' })
    void laad()
  }, [laad])

  const laatsteSync = staat.fase === 'ok' && staat.data.gekoppeld ? staat.data.laatsteSync : null

  return (
    <section className="crm-week" aria-label={titel}>
      <style href="crm-week" precedence="medium">
        {CSS}
      </style>

      <WeekKop titel={titel} laatsteSync={laatsteSync} />

      {staat.fase === 'laden' ? <WeekSkelet /> : null}
      {staat.fase === 'fout' ? <Foutmelding bericht={staat.bericht} opnieuw={opnieuw} /> : null}
      {staat.fase === 'ok' && !staat.data.gekoppeld ? <NietGekoppeld /> : null}
      {staat.fase === 'ok' && staat.data.gekoppeld ? <WeekRij dagen={staat.data.dagen} /> : null}
    </section>
  )
}

/** Kop: titel + (subtiel) wanneer de agenda voor het laatst gesynct is. */
function WeekKop({ titel, laatsteSync }: { titel: string; laatsteSync: string | null }) {
  const sync = laatsteSync ? syncLabel(laatsteSync) : null
  return (
    <header className="crm-week__kop">
      <p className="crm-week__titel">
        <CalendarClock size={14} strokeWidth={2.2} aria-hidden="true" />
        {titel}
      </p>
      {sync ? <p className="crm-week__sync">{sync}</p> : null}
    </header>
  )
}

/** De horizontaal-scrollbare rij dagkolommen. Scrollt binnen zichzelf op smal. */
function WeekRij({ dagen }: { dagen: AgendaDag[] }) {
  if (dagen.length === 0) {
    return <p className="crm-week__leeg-week">Geen dagen om te tonen.</p>
  }

  const vandaag = datumSleutel(new Date())
  return (
    <div className="crm-week__scroll" role="group" aria-label="Zeven dagen vooruit" tabIndex={0}>
      <ul className="crm-week__rij">
        {dagen.map((dag) => (
          <WeekDag key={dag.dag} dag={dag} isVandaag={dag.dag === vandaag} />
        ))}
      </ul>
    </div>
  )
}

/** Eén dagkolom: weekdag + dagnummer, daaronder de afspraken of een rustige "—". */
function WeekDag({ dag, isVandaag }: { dag: AgendaDag; isVandaag: boolean }) {
  const kop = dagKop(dag.dag)
  const afspraken = gesorteerd(dag.afspraken)
  const tonen = afspraken.slice(0, MAX_TONEN)
  const meer = afspraken.length - tonen.length

  return (
    <li
      className={`crm-week__dag${isVandaag ? ' crm-week__dag--vandaag' : ''}`}
      aria-current={isVandaag ? 'date' : undefined}
    >
      <div className="crm-week__dagkop">
        <span className="crm-week__weekdag">{kop.weekdag}</span>
        <span className="crm-week__nummer">{kop.nummer}</span>
        {isVandaag ? <span className="crm-week__stip" aria-hidden="true" /> : null}
      </div>

      {tonen.length > 0 ? (
        <ul className="crm-week__lijst">
          {tonen.map((a) => (
            <AfspraakRegel key={a.id} afspraak={a} />
          ))}
          {meer > 0 ? <li className="crm-week__meer">+{meer} meer</li> : null}
        </ul>
      ) : (
        <p className="crm-week__leeg" aria-label="Geen afspraken">
          —
        </p>
      )}
    </li>
  )
}

/** Eén afspraak: begintijd (of "Hele dag") + titel. */
function AfspraakRegel({ afspraak }: { afspraak: AfspraakJson }) {
  const titel = afspraak.titel ?? 'Afspraak zonder titel'
  const tijd = afspraak.heleDag ? 'Hele dag' : tijdVan(afspraak.startOp)
  return (
    <li className="crm-week__afspraak">
      {tijd ? <span className="crm-week__tijd">{tijd}</span> : null}
      <span className="crm-week__afspraak-titel" title={titel}>
        {titel}
      </span>
    </li>
  )
}

/** Rustige hint — niet gekoppeld is een normale staat, geen fout. */
function NietGekoppeld() {
  return (
    <div className="crm-week__hint">
      <CalendarOff size={15} strokeWidth={2} aria-hidden="true" />
      <p>Koppel je Google-agenda om je week te zien.</p>
    </div>
  )
}

/** Rustige placeholder in navy. Geen spinner-spektakel. */
function WeekSkelet() {
  const dagen = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo']
  return (
    <div className="crm-week__scroll" aria-hidden="true">
      <ul className="crm-week__rij">
        {dagen.map((k) => (
          <li key={k} className="crm-week__dag">
            <span className="crm-week__skelet crm-week__skelet--kop" />
            <span className="crm-week__skelet crm-week__skelet--regel" />
            <span className="crm-week__skelet crm-week__skelet--kort" />
          </li>
        ))}
      </ul>
    </div>
  )
}

// ─── Pure helpers ────────────────────────────────────────────────────────────

/** Weekdag (kort, "ma") + dagnummer uit een dagsleutel. Faalt naar de ruwe sleutel. */
function dagKop(sleutel: string): { weekdag: string; nummer: string } {
  const d = leesDatumSleutel(sleutel)
  if (!d) return { weekdag: sleutel, nummer: '' }
  const weekdag = d.toLocaleDateString('nl-NL', { weekday: 'short' }).replace('.', '')
  return { weekdag, nummer: String(d.getDate()) }
}

/** Hele-dag-events eerst, daarna op begintijd. Muteert de invoer niet. */
function gesorteerd(afspraken: readonly AfspraakJson[]): AfspraakJson[] {
  return [...afspraken].sort((a, b) => {
    if (a.heleDag !== b.heleDag) return a.heleDag ? -1 : 1
    return a.startOp.localeCompare(b.startOp)
  })
}

/** De begintijd ('14:30'), of leeg bij een onleesbare datum. */
function tijdVan(iso: string): string {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : tijdLabel(d)
}

/** 'Bijgewerkt om 14:30' (vandaag) of 'Bijgewerkt 19 jul 14:30', of null. */
function syncLabel(iso: string): string | null {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  const tijd = tijdLabel(d)
  if (datumSleutel(d) === datumSleutel(new Date())) return `Bijgewerkt om ${tijd}`
  const datum = d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
  return `Bijgewerkt ${datum} ${tijd}`
}

const CSS = `
.crm-week {
  display: grid;
  gap: 12px;
  min-width: 0;
}
.crm-week__kop {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px 16px;
  flex-wrap: wrap;
}
.crm-week__titel {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.01em;
  color: var(--text-1);
}
.crm-week__titel svg {
  color: var(--brand);
  flex-shrink: 0;
}
.crm-week__sync {
  margin: 0;
  font-size: 11px;
  color: var(--text-4);
  font-variant-numeric: tabular-nums;
}

.crm-week__scroll {
  min-width: 0;
  max-width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--bg-app);
  scrollbar-width: thin;
}
.crm-week__scroll:focus-visible {
  outline: 2px solid var(--brand);
  outline-offset: 2px;
}
.crm-week__rij {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(140px, 1fr);
  margin: 0;
  padding: 0;
  list-style: none;
}

.crm-week__dag {
  display: grid;
  gap: 9px;
  align-content: start;
  min-height: 118px;
  padding: 12px 13px;
  border-right: 1px solid var(--line);
}
.crm-week__dag:last-child {
  border-right: none;
}
/* Vandaag: subtiel, niet luid — een dun cyan bandje boven + een zachte tint. */
.crm-week__dag--vandaag {
  background: var(--brand-soft);
  box-shadow: inset 0 2px 0 0 var(--brand);
}

.crm-week__dagkop {
  display: flex;
  align-items: center;
  gap: 6px;
}
.crm-week__weekdag {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-3);
}
.crm-week__nummer {
  font-size: 17px;
  font-weight: 600;
  line-height: 1;
  color: var(--text-2);
  font-variant-numeric: tabular-nums;
}
.crm-week__dag--vandaag .crm-week__weekdag {
  color: var(--brand);
}
.crm-week__dag--vandaag .crm-week__nummer {
  color: var(--text-1);
}
.crm-week__stip {
  width: 6px;
  height: 6px;
  margin-left: auto;
  border-radius: 999px;
  background: var(--brand);
  flex-shrink: 0;
}

.crm-week__lijst {
  display: grid;
  gap: 7px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.crm-week__afspraak {
  display: grid;
  gap: 1px;
  padding-left: 9px;
  border-left: 2px solid color-mix(in srgb, var(--brand) 55%, transparent);
}
.crm-week__tijd {
  font-size: 11px;
  color: var(--text-3);
  font-variant-numeric: tabular-nums;
}
.crm-week__afspraak-titel {
  font-size: 12px;
  font-weight: 500;
  line-height: 1.3;
  color: var(--text-1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.crm-week__meer {
  font-size: 11px;
  color: var(--text-3);
}
.crm-week__leeg {
  margin: 0;
  font-size: 14px;
  color: var(--text-4);
}

.crm-week__hint {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 14px 16px;
  border: 1px dashed var(--line-strong);
  border-radius: var(--radius-md);
  background: var(--bg-app);
}
.crm-week__hint p {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--text-3);
}
.crm-week__hint svg {
  color: var(--text-4);
  flex-shrink: 0;
}
.crm-week__leeg-week {
  margin: 0;
  font-size: 13px;
  color: var(--text-3);
}

.crm-week__skelet {
  display: block;
  border-radius: 6px;
  background: var(--bg-raised);
}
.crm-week__skelet--kop {
  height: 20px;
  width: 58%;
}
.crm-week__skelet--regel {
  height: 12px;
  width: 88%;
}
.crm-week__skelet--kort {
  height: 12px;
  width: 54%;
}
`
