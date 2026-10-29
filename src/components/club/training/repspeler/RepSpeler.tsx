'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Pause, Play, RotateCcw, Timer, Volume2, VolumeX } from 'lucide-react'
import { herstart, nieuweKlok, pauzeer, start, tijdVan, type Klok } from '@/lib/club/training/repspeler/klok'
import { planVoor, schemaTempoUitleg } from '@/lib/club/training/repspeler/plan'
import { opPiek, standOp } from '@/lib/club/training/repspeler/tijdlijn'
import type { Stand } from '@/lib/club/training/repspeler/typen'
import { kiesMaat, type RepMaat, type RepRender } from './render-bron'
import { RepBeeld } from './RepBeeld'
import { RepNaSet } from './RepNaSet'
import { RepTeller, type Weergave } from './RepTeller'
import { useFrames, useMinderBeweging } from './useFrames'
import { useTik } from './useTik'
import { useTaal } from '@/lib/aiyourgym/taal/client'
import { REPSPELER, faseWoord } from '@/lib/aiyourgym/taal/woorden/ledenapp/repspeler'
import './repspeler.css'

// De rep-speler (besluit Kane 24-10-2026): de Blender-render speelt en telt
// elke herhaling mee. Besluit Kane 29-10-2026: het beeld speelt altijd op 1
// seconde heen en 1 seconde terug (anders rekken de beelden uit en hapert het),
// dus 15 herhalingen duren 30 seconden. Het schematempo staat eronder als tekst. Na de set: "Set klaar", de rust uit het schema en een knop om de
// set vast te leggen in de bestaande training. De rekensom zit puur en getest
// in src/lib/club/training/repspeler; hier alleen tekenen en bedienen.
// Het tekenen gebeurt per frame met requestAnimationFrame op een canvas, zonder
// React-state per frame: alleen bij een nieuwe herhaling of fase rendert React.

export interface RepSpelerProps {
  render: RepRender
  naam: string
  herhalingen?: string | null
  tijdSec?: number | null
  tempo?: string | null
  rustSec?: number | null
  sets?: number | null
  /** De set die aan de beurt is (training). */
  setNr?: number | null
  /** Set vastleggen in de bestaande training; krijgt het moment (ms) waarop de set klaar was, voor de rust. */
  onSetKlaar?: (klaarOp: number) => void
}

type Status = 'wacht' | 'loopt' | 'pauze' | 'klaar'

function weergaveVan(s: Stand): Weergave {
  return { rep: s.rep, gedaan: s.gedaan, label: s.label, segment: s.segment, segmentIndex: s.segmentIndex, overSec: Math.ceil(s.over), piek: opPiek(s) }
}

function zelfde(a: Weergave, b: Weergave): boolean {
  return a.rep === b.rep && a.gedaan === b.gedaan && a.segmentIndex === b.segmentIndex && a.overSec === b.overSec && a.piek === b.piek && a.label === b.label
}

/** Breedte van het beeld in css-px, gemeten; de maat van de frames volgt daaruit (en uit de pixeldichtheid). */
function useMaat(render: RepRender): [(el: HTMLDivElement | null) => void, RepMaat | null] {
  const [maat, setMaat] = useState<RepMaat | null>(null)
  const meet = useCallback(
    (el: HTMLDivElement | null) => {
      if (!el) return
      const bepaal = () => {
        const gekozen = kiesMaat(render.maten, el.getBoundingClientRect().width, window.devicePixelRatio)
        // Alleen ooit groter kiezen: nooit opnieuw laden voor een kleinere maat.
        setMaat((was) => (gekozen && (!was || gekozen.breedte > was.breedte) ? gekozen : was))
      }
      bepaal()
      const kijker = new ResizeObserver(bepaal)
      kijker.observe(el)
      return () => kijker.disconnect()
    },
    [render.maten],
  )
  return [meet, maat]
}

export function RepSpeler(p: RepSpelerProps) {
  const { render } = p
  const plan = useMemo(() => planVoor(render, { herhalingen: p.herhalingen, tijdSec: p.tijdSec, tempo: p.tempo }), [render, p.herhalingen, p.tijdSec, p.tempo])
  const minder = useMinderBeweging()
  const [meet, maat] = useMaat(render)
  const frames = useFrames(render, maat, !minder)
  const tik = useTik()
  const [status, setStatus] = useState<Status>('wacht')
  const [klaarOp, setKlaarOp] = useState<number | null>(null)
  const [weergave, setWeergave] = useState<Weergave>(() => ({ ...weergaveVan(standOp(plan, 0)), rep: 0 }))
  const klok = useRef<Klok>(nieuweKlok())
  const canvas = useRef<HTMLCanvasElement>(null)
  const ring = useRef<SVGCircleElement>(null)
  const laatsteFrame = useRef(-1)
  const vorige = useRef<Weergave>(weergave)
  const tikRef = useRef(tik.tik)
  const kanStarten = minder || frames.klaar
  const t = REPSPELER[useTaal()]

  useEffect(() => {
    tikRef.current = tik.tik
  }, [tik.tik])

  const teken = useCallback(
    (s: Stand) => {
      const doek = canvas.current
      const img = frames.beelden[s.frame]
      if (doek && img && s.frame !== laatsteFrame.current) {
        const ctx = doek.getContext('2d')
        if (doek.width !== img.naturalWidth) {
          doek.width = img.naturalWidth
          doek.height = img.naturalHeight
        }
        ctx?.clearRect(0, 0, doek.width, doek.height)
        ctx?.drawImage(img, 0, 0, doek.width, doek.height)
        laatsteFrame.current = s.frame
      }
      ring.current?.setAttribute('stroke-dashoffset', String(100 * (1 - s.voortgang)))
      const w = weergaveVan(s)
      if (!zelfde(w, vorige.current)) {
        if (w.segmentIndex !== vorige.current.segmentIndex || w.rep !== vorige.current.rep) tikRef.current(w.segment)
        vorige.current = w
        setWeergave(w)
      }
    },
    [frames.beelden],
  )

  useEffect(() => {
    if (status !== 'loopt') return
    let id = 0
    const stap = () => {
      const s = standOp(plan, tijdVan(klok.current, performance.now()))
      teken(s)
      if (s.klaar) {
        klok.current = pauzeer(klok.current, performance.now())
        setKlaarOp(Date.now())
        setStatus('klaar')
        return
      }
      id = requestAnimationFrame(stap)
    }
    id = requestAnimationFrame(stap)
    const wegGeweest = () => {
      if (document.visibilityState !== 'hidden') return
      klok.current = pauzeer(klok.current, performance.now())
      setStatus('pauze')
    }
    document.addEventListener('visibilitychange', wegGeweest)
    return () => {
      cancelAnimationFrame(id)
      document.removeEventListener('visibilitychange', wegGeweest)
    }
  }, [status, plan, teken])

  function speel() {
    if (!kanStarten) return
    if (status === 'klaar') opnieuw()
    const nu = performance.now()
    klok.current = start(klok.current, nu)
    // Meteen het eerste beeld op het doek, zodat poster en canvas nooit samen of allebei leeg in beeld staan.
    teken(standOp(plan, tijdVan(klok.current, nu)))
    setStatus('loopt')
  }

  function pauze() {
    klok.current = pauzeer(klok.current, performance.now())
    setStatus('pauze')
  }

  function opnieuw() {
    klok.current = herstart(klok.current)
    laatsteFrame.current = -1
    const begin = { ...weergaveVan(standOp(plan, 0)), rep: 0 }
    vorige.current = begin
    setWeergave(begin)
    setKlaarOp(null)
    ring.current?.setAttribute('stroke-dashoffset', '100')
    setStatus('wacht')
  }

  function leggenVast() {
    if (klaarOp === null || !p.onSetKlaar) return
    p.onSetKlaar(klaarOp)
    opnieuw()
  }

  const speelt = status === 'loopt'
  const hoofdLabel = speelt ? t.pauze : status === 'pauze' ? t.verder : status === 'klaar' ? t.nogEenKeer : kanStarten ? t.start : t.laden
  return (
    <figure className="club-rep" data-status={status} aria-label={t.figuur(p.naam)}>
      <div className="club-rep-podium">
        <RepBeeld
          meet={meet} canvas={canvas} render={render} naam={p.naam} minder={minder}
          zichtbaar={!minder && frames.klaar && status !== 'wacht'} piek={minder && status !== 'wacht' && weergave.piek}
          laadDeel={frames.klaar || minder ? 1 : frames.deel}
        />
        <RepTeller plan={plan} weergave={weergave} status={status} ring={ring} setNr={p.setNr ?? null} sets={p.sets ?? null} />
      </div>

      {status === 'klaar' && klaarOp !== null ? (
        <RepNaSet klaarOp={klaarOp} rustSec={p.rustSec ?? null} setNr={p.setNr ?? null} onVastleggen={p.onSetKlaar ? leggenVast : undefined} />
      ) : null}

      <div className="club-rep-bediening" role="group" aria-label={t.bediening}>
        <button type="button" className="club-rep-hoofdknop" onClick={speelt ? pauze : speel} disabled={!kanStarten && !speelt} aria-busy={!kanStarten || undefined}>
          {speelt ? <Pause aria-hidden size={20} /> : <Play aria-hidden size={20} />}
          {hoofdLabel}
        </button>
        <button type="button" className="club-rep-knop" onClick={opnieuw} disabled={status === 'wacht'} aria-label={t.opnieuw}>
          <RotateCcw aria-hidden size={18} />
        </button>
        {tik.kan && (
          <button type="button" className="club-rep-knop" onClick={tik.wissel} aria-pressed={tik.aan} aria-label={tik.aan ? t.tikUit : t.tikAan}>
            {tik.aan ? <Volume2 aria-hidden size={18} /> : <VolumeX aria-hidden size={18} />}
          </button>
        )}
      </div>

      <figcaption className="club-rep-tempo">
        <Timer aria-hidden size={15} />
        <span>
          <span className="club-sr">{t.tempoSr}</span>
          {schemaTempoUitleg(render, { herhalingen: p.herhalingen, tijdSec: p.tijdSec, tempo: p.tempo }, (w) => faseWoord(w, t.fase))}
        </span>
      </figcaption>
    </figure>
  )
}
