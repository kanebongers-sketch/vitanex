'use client'

// ─── Voortgang — jouw week, gewoontes en niveau ───────────────────────────────
// Volgorde is bewust: eerst het volwassen weekoverzicht (echte actieve dagen
// uit de al geladen XP-history), dan het gedempte niveau/XP-detail, dan
// mijlpalen en naslag. XP is de stille onderstroom, niet de hoofdattractie.

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import { laadXPData, berekenLevel, xpVoortgang, LEVEL_NAMEN, type XPData } from '@/lib/xp'
import { laadXPVanServer } from '@/lib/xp-sync'
import VitaVoortgangViering from '@/components/vita/VitaVoortgangViering'
import { berekenWeekOverzicht, laatsteWeken } from './voortgang'
import WeekOverzicht from './WeekOverzicht'
import NiveauDetail from './NiveauDetail'
import Mijlpalen from './Mijlpalen'
import XPDetails from './XPDetails'

function PaginaKader({ children }: { children: React.ReactNode }) {
  return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px 64px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
            Voortgang
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 3 }}>
            Je week, je gewoontes en je niveau — op basis van wat je echt deed.
          </p>
        </div>
        {children}
        <style>{paginaStijl}</style>
      </main>
    </div>
  )
}

/** Skeleton met dezelfde bloklayout als de geladen pagina — geen layout-shift. */
function LaadStaat() {
  const blokken = [
    { hoogte: 236, label: 'week' },
    { hoogte: 264, label: 'niveau' },
    { hoogte: 620, label: 'mijlpalen' },
  ]
  return (
    <div aria-busy="true">
      <p className="sr-only" role="status">Je voortgang wordt geladen.</p>
      {blokken.map(blok => (
        <div key={blok.label} className="nv-skelet" aria-hidden="true"
          style={{ height: blok.hoogte, marginBottom: 16 }} />
      ))}
    </div>
  )
}

export default function VoortgangPagina() {
  const [xpData, setXpData] = useState<XPData | null>(null)
  // Voortgangsvullingen (balken/ring) starten op 0 en vullen pas ná de eerste
  // paint — zo loopt alles zacht in (0.4s, alleen transform/stroke).
  const [animKlaar, setAnimKlaar] = useState(false)
  // Tijdstip per mount vastzetten zodat de render puur blijft
  const [nuTs] = useState(() => Date.now())

  useEffect(() => {
    Promise.resolve().then(async () => {
      // Lokaal eerst tonen — geen wachttijd
      const data = laadXPData()
      setXpData(data)

      // Server daarna laden (hogere XP wint — cross-device correctheid)
      const serverData = await laadXPVanServer()
      if (serverData && serverData.xp >= data.xp) {
        setXpData(serverData)
      }
    })
  }, [])

  useEffect(() => {
    if (!xpData || animKlaar) return
    // Dubbele rAF: eerst de 0-staat laten schilderen, dan pas vullen.
    let binnenste = 0
    const buitenste = requestAnimationFrame(() => {
      binnenste = requestAnimationFrame(() => setAnimKlaar(true))
    })
    return () => {
      cancelAnimationFrame(buitenste)
      cancelAnimationFrame(binnenste)
    }
  }, [xpData, animKlaar])

  if (!xpData) {
    return <PaginaKader><LaadStaat /></PaginaKader>
  }

  const level = berekenLevel(xpData.xp)
  const voortgang = xpVoortgang(xpData.xp, level)
  const nu = new Date(nuTs)
  const week = berekenWeekOverzicht(xpData.history, xpData.lastCheckinDatum, nu)
  const weken = laatsteWeken(xpData.history, nu)

  return (
    <PaginaKader>
      {/* 1. Deze week — kernvoortgang, direct zichtbaar zonder kliks */}
      <WeekOverzicht data={week} weken={weken} animKlaar={animKlaar} />

      {/* 2. Vita erkent je niveau — echte waarden uit deze pagina */}
      <div style={{ marginBottom: 16 }}>
        <VitaVoortgangViering
          variant="level"
          level={level}
          levelNaam={LEVEL_NAMEN[level]}
          volgendeNaam={level < 10 ? LEVEL_NAMEN[level + 1] : null}
          xpTotVolgende={level >= 10 ? 0 : voortgang.nodig}
          isMax={level >= 10}
        />
      </div>

      {/* 3. Niveau & XP — gedempt detail */}
      <NiveauDetail xpData={xpData} level={level} voortgang={voortgang} animKlaar={animKlaar} />

      {/* 4. Mijlpalen — rustige erkenning */}
      <Mijlpalen behaaldeIds={xpData.achievements ?? []} />

      {/* 5. Naslag: recente activiteit + spelregels */}
      <XPDetails history={xpData.history} />

      {/* Acties — zonder XP-geschreeuw; de beloning staat in de naslag */}
      <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
        <Link href="/checkin" className="nv-cta" style={{
          flex: 1, textAlign: 'center',
          background: 'var(--mentaforce-primary)',
          color: 'var(--bg-app)', borderRadius: 12, padding: '14px 20px',
          fontSize: 14, fontWeight: 700, textDecoration: 'none',
        }}>
          Check-in doen
        </Link>
        <Link href="/doelen" className="nv-cta" style={{
          flex: 1, textAlign: 'center',
          background: 'var(--bg-subtle)',
          color: 'var(--text-1)', borderRadius: 12, padding: '14px 20px',
          fontSize: 14, fontWeight: 700, textDecoration: 'none',
          border: '1px solid var(--border-strong)',
        }}>
          Doelen bekijken
        </Link>
      </div>
    </PaginaKader>
  )
}

const paginaStijl = `
.nv-cta {
  transition: transform 0.15s var(--ease), opacity 0.15s var(--ease);
}
.nv-cta:hover { transform: translateY(-1px); opacity: 0.9; }
.nv-cta:active { transform: translateY(0); opacity: 1; }
.nv-cta:focus-visible {
  outline: 2px solid var(--mentaforce-primary);
  outline-offset: 2px;
}
.nv-skelet {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  animation: nv-pols 1.8s var(--ease) infinite;
}
@keyframes nv-pols {
  0%, 100% { opacity: 0.55; }
  50% { opacity: 0.85; }
}
@media (prefers-reduced-motion: reduce) {
  .nv-skelet { animation: none; }
  .nv-cta { transition: none; }
}
`
