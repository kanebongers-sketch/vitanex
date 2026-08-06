'use client'

import { useCallback, useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { haalJson, isObject, getalOfNull } from '@/lib/lifeos/api/http'
import { datumSleutel } from '@/lib/lifeos/datum/datum'

// De voortgangsbalk onder de trainingskaart: hoe ver ben je in het 4-weken blok.
// Lazy — pas bij openklappen wordt /overzicht opgehaald, zodat de kaart snel laadt.
// De data komt van de blok/overzicht-API; hier alleen tonen + narrowen.

interface SessieStatus {
  code: string
  titel: string
  soort: 'kracht' | 'cardio'
  gedaan: boolean
}
interface WeekOverzicht {
  week: number
  gedaan: number
  totaal: number
  sessies: SessieStatus[]
}
interface Overzicht {
  huidigeWeek: number | null
  totaalGedaan: number
  totaalGepland: number
  weken: WeekOverzicht[]
}

function leesOverzicht(ruw: unknown): Overzicht | null {
  if (!isObject(ruw) || !Array.isArray(ruw.weken)) return null
  const weken = ruw.weken.filter(isObject).map((w): WeekOverzicht => ({
    week: getalOfNull(w.week) ?? 0,
    gedaan: getalOfNull(w.gedaan) ?? 0,
    totaal: getalOfNull(w.totaal) ?? 0,
    sessies: Array.isArray(w.sessies)
      ? w.sessies.filter(isObject).map((s): SessieStatus => ({
          code: typeof s.code === 'string' ? s.code : '',
          titel: typeof s.titel === 'string' ? s.titel : '',
          soort: s.soort === 'cardio' ? 'cardio' : 'kracht',
          gedaan: s.gedaan === true,
        }))
      : [],
  }))
  return {
    huidigeWeek: getalOfNull(ruw.huidigeWeek),
    totaalGedaan: getalOfNull(ruw.totaalGedaan) ?? 0,
    totaalGepland: getalOfNull(ruw.totaalGepland) ?? 0,
    weken,
  }
}

export function BlokVoortgang() {
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<Overzicht | null>(null)
  const [fout, setFout] = useState(false)

  const laad = useCallback(async () => {
    const datum = datumSleutel(new Date())
    const uit = await haalJson(`/api/lifeos/blok/overzicht?datum=${datum}`, leesOverzicht)
    if (uit.ok) setData(uit.waarde)
    else setFout(true)
  }, [])

  const wissel = useCallback(() => {
    setOpen((v) => {
      const nieuw = !v
      if (nieuw && data === null && !fout) void laad()
      return nieuw
    })
  }, [data, fout, laad])

  return (
    <div style={{ borderTop: '1px solid var(--line)', paddingTop: 10 }}>
      <button type="button" onClick={wissel} aria-expanded={open} style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--text-2)', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}>
        <ChevronDown size={14} strokeWidth={2.2} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 180ms var(--ease)' }} aria-hidden />
        Blok-voortgang
        {data ? <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--brand)', fontWeight: 700 }}>{data.totaalGedaan}/{data.totaalGepland}</span> : null}
      </button>

      {open ? (
        <div style={{ marginTop: 10 }}>
          {fout ? (
            <p style={{ fontSize: 12.5, color: 'var(--status-aandacht)', margin: 0 }}>Kon je voortgang niet laden.</p>
          ) : data === null ? (
            <div aria-hidden style={{ height: 96, borderRadius: 10, background: 'var(--bg-raised)' }} />
          ) : (
            <div style={{ display: 'grid', gap: 6 }}>
              {data.weken.map((w) => (
                <WeekRij key={w.week} week={w} huidig={w.week === data.huidigeWeek} />
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}

function WeekRij({ week, huidig }: { week: WeekOverzicht; huidig: boolean }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 8, alignItems: 'center' }}>
      <span style={{ fontSize: 11.5, fontWeight: huidig ? 700 : 600, color: huidig ? 'var(--brand)' : 'var(--text-3)', width: 56 }}>
        Week {week.week}
      </span>
      <div style={{ display: 'flex', gap: 4 }}>
        {week.sessies.map((s) => (
          <span
            key={s.code}
            title={`${s.titel}${s.gedaan ? ' — gedaan' : ''}`}
            aria-label={`${s.titel}: ${s.gedaan ? 'gedaan' : 'nog niet'}`}
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
              border: `1px solid ${s.gedaan ? 'var(--brand)' : 'var(--line)'}`,
              background: s.gedaan ? 'var(--brand)' : 'transparent',
              color: s.gedaan ? 'var(--bg-app)' : 'var(--text-4)',
            }}
          >
            {s.gedaan ? <Check size={13} strokeWidth={3} aria-hidden /> : <span style={{ width: 4, height: 4, borderRadius: 999, background: 'var(--text-4)' }} />}
          </span>
        ))}
      </div>
      <span style={{ fontSize: 11.5, color: 'var(--text-4)', fontFamily: 'var(--font-mono)' }}>{week.gedaan}/{week.totaal}</span>
    </div>
  )
}
