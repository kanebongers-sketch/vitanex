'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Dumbbell,
  Rocket,
  Blocks,
  Leaf,
  Zap,
  TrendingUp,
  Brain,
  Landmark,
  Radio,
  Target,
  Lightbulb,
  ArrowRight,
  ChevronDown,
} from 'lucide-react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'


// ── Types ──────────────────────────────────────────────────

type Pijler = {
  id: string
  label: string
  Icon: LucideIcon
  kleur: string
  doelgroep: string
  problemen: string[]
  ideeen: string[]
  hooks: string[]
  ctas: string[]
}

// ── Data ───────────────────────────────────────────────────

const PIJLERS: Pijler[] = [
  {
    id: 'fitness',
    label: 'Fitness',
    Icon: Dumbbell,
    kleur: 'var(--mf-green)',
    doelgroep: 'Ambitieuze ondernemers 28-45 jaar die te weinig bewegen',
    problemen: ['Geen tijd voor sport', 'Onweet hoe te beginnen', 'Snel opbranden na drukke dag', 'Motivatiegebrek'],
    ideeen: [
      'De 20-minuten workout die ik doe tussen twee meetings door (met schema)',
      'Waarom ondernemers vaker ziek worden dan werknemers — en hoe je dat keert',
      'Van 0 naar 3x per week sporten als drukbezet ondernemer: mijn 90-dagen aanpak',
      'De 5 oefeningen die je staand achter je bureau kunt doen (video)',
    ],
    hooks: [
      '"Ik had geen tijd voor sport. Totdat ik besefte dat ik geen tijd had om NIET te sporten."',
      '"Elke ondernemer die ik ken zegt dat hij te druk is. Maar niemand is te druk om ziek te worden."',
      '"3 jaar lang deed ik niets aan sport. Wat er daarna gebeurde veranderde mijn business voorgoed."',
    ],
    ctas: [
      'Download mijn gratis 20-minuten businessman workout → [link]',
      'Boek een gratis intake en ontdek jouw persoonlijk trainingsplan → [link]',
    ],
  },
  {
    id: 'ondernemen',
    label: 'Ondernemen',
    Icon: Rocket,
    kleur: 'var(--mf-blue)',
    doelgroep: 'Ondernemers en freelancers die willen schalen',
    problemen: ['Stress door werkdruk', 'Gebrek aan systeem', 'Werk-privé onbalans', 'Plateau in groei'],
    ideeen: [
      'Hoe ik van €3k naar €10k per maand ging zonder meer uren te werken',
      'Het systeem waarmee ik mijn werkweek terugbracht van 60 naar 40 uur',
      'Waarom de meeste freelancers nooit schalen — en hoe je de valkuil vermijdt',
      'Mijn exacte weekstructuur als ondernemer die ook serieus sport (template)',
    ],
    hooks: [
      '"Je business schaalt niet als jij niet schaalt. Maar niemand vertelt je hoe."',
      '"Ik werkte 70 uur per week en verdiende minder dan mijn medewerkers. Dit veranderde alles."',
      '"De meeste ondernemers optimaliseren hun business. De slimste optimaliseren zichzelf."',
    ],
    ctas: [
      'Volg mijn gratis 5-daagse email challenge: Van druk naar productief → [link]',
      'Plan een strategiegesprek en ontdek waar jouw groei blokkeert → [link]',
    ],
  },
  {
    id: 'discipline',
    label: 'Discipline',
    Icon: Blocks,
    kleur: 'var(--bg-subtle)',
    doelgroep: 'Professionals die consistentie willen bouwen',
    problemen: ['Uitstellen en procrastineren', 'Geen vaste routine', 'Wilskrachtproblemen', 'Geen accountability'],
    ideeen: [
      'De ochtendprocedure die ik 847 dagen heb volgehouden (stap voor stap)',
      'Discipline is niet motivatie — het is dit systeem dat ik gebruik',
      'Waarom jij elke maandag opnieuw begint en hoe je dat doorbreekt',
      'Het verschil tussen mensen die doelen halen en mensen die dat niet doen (eerlijk verhaal)',
    ],
    hooks: [
      '"Motivatie is de reden waarom je begint. Discipline is de reden waarom je doorgaat."',
      '"Elke succesvolle persoon die ik ken heeft één ding gemeen. Niet talent. Niet geluk."',
      '"Ik ben niet gemotiveerd elke dag. Maar ik doe het toch. Hier is waarom."',
    ],
    ctas: [
      'Download mijn gratis Consistency Tracker template → [link]',
      'Word lid van de accountability groep voor ondernemers → [link]',
    ],
  },
  {
    id: 'leefstijl',
    label: 'Leefstijl',
    Icon: Leaf,
    kleur: 'var(--mf-purple)',
    doelgroep: 'Mensen die duurzaam gezond willen leven',
    problemen: ['Slechte slaapkwaliteit', 'Ongezonde voedingspatronen', 'Chronische vermoeidheid', 'Te weinig herstel'],
    ideeen: [
      'Mijn exacte avondroutine voor diepe slaap als ondernemer (wat ik eet, doe en NIET doe)',
      'Het maaltijdprep systeem dat mij 5 uur per week bespaart en gezonder maakt',
      'Hoe ik van chronisch moe naar energiek werd zonder supplementen of koffie',
      '10 kleine gewoonten die een groter effect hebben dan een dieet (met wetenschap)',
    ],
    hooks: [
      '"Ik sliep 6 uur en dacht dat ik het gewend was. Totdat ik begon met 8 uur slapen."',
      '"Gezond leven hoeft geen fulltime job te zijn. Hier is het 20/80 principe dat ik gebruik."',
      '"Je kunt de beste ondernemer van de wereld zijn. Maar zonder energie bereik je niks."',
    ],
    ctas: [
      'Gratis leefstijlscan: ontdek waar jij energie lekt → [link]',
      'Download mijn 7-daags herstelprotocol voor ondernemers → [link]',
    ],
  },
  {
    id: 'stressmanagement',
    label: 'Stressmanagement',
    Icon: Zap,
    kleur: 'var(--mf-red)',
    doelgroep: 'Ondernemers met hoge prestatiedruk',
    problemen: ['Chronische stress', 'Burn-out risico', 'Piekeren en slecht slapen', 'Lichamelijke stressklachten'],
    ideeen: [
      'De 5 vroege waarschuwingssignalen van burn-out die ik negeerde (tot het te laat was)',
      'Hoe ik mijn cortisolspiegel heb verlaagd met 3 kleine aanpassingen in mijn dag',
      'Adem je stress weg: de box breathing techniek die ik gebruik voor grote pitches',
      'Waarom sporten mijn grootste anti-stressmiddel is (met wetenschappelijke uitleg)',
    ],
    hooks: [
      '"Een jaar geleden kon ik niet slapen. Mijn lichaam zei stop. Mijn hoofd luisterde niet."',
      '"Stress is niet het probleem. Het is de reactie op stress die je kapotmaakt."',
      '"De meeste ondernemers wachten op vakantie om bij te tanken. Ik deed dat dagelijks."',
    ],
    ctas: [
      'Download de gratis stress-reset toolkit voor ondernemers → [link]',
      'Boek een intake en krijg een persoonlijk herstelplan → [link]',
    ],
  },
  {
    id: 'performance',
    label: 'Performance',
    Icon: TrendingUp,
    kleur: 'var(--mf-amber)',
    doelgroep: 'High performers die hun top willen bereiken',
    problemen: ['Energietekort na lunch', 'Focusproblemen', 'Suboptimale resultaten', 'Mentale vermoeidheid'],
    ideeen: [
      'Hoe ik mijn cognitieve prestaties met 40% verbeterde door één aanpassing in mijn training',
      'De biohacker stack die ik gebruik voor maximale focus (zonder dure supplementen)',
      'Mijn pre-meeting ritueel dat mij altijd scherp en gefocust maakt',
      'Deep work vs. gewoon werken: hoe ik 4 uur per dag gebruik als 8 gemiddelde uren',
    ],
    hooks: [
      '"Je concurrenten werken even hard als jij. Maar presteren ze ook even slim?"',
      '"De meeste mensen optimaliseren hun agenda. High performers optimaliseren hun brein."',
      '"Ik werkte 40 uur. Mijn concurrent ook. Het verschil zat niet in de uren."',
    ],
    ctas: [
      'Download het gratis High Performance Dagschema voor ondernemers → [link]',
      'Start met het 90-dagen performance traject → [link]',
    ],
  },
  {
    id: 'persoonlijke-groei',
    label: 'Persoonlijke Groei',
    Icon: Brain,
    kleur: 'var(--mf-green)',
    doelgroep: 'Professionals die zichzelf willen ontwikkelen',
    problemen: ['Vastlopen in patronen', 'Identiteits- en richtingvragen', 'Gebrek aan zelfinzicht', 'Niet weten wat je wilt'],
    ideeen: [
      'De identiteitsshift die mij van werknemer naar ondernemer maakte (en hoe jij dat ook kunt)',
      'Waarom de meeste mensen dezelfde fouten blijven maken — en hoe je uitbreekt',
      'De 3 vragen die ik mezelf elke zondag stel voor scherp zelfinzicht',
      'Hoe journaling mijn besluitvorming als ondernemer drastisch verbeterde (met voorbeelden)',
    ],
    hooks: [
      '"Twee jaar geleden wist ik niet wat ik wilde. Nu weet ik precies wie ik ben en waar ik heen ga."',
      '"Je bent niet vastgelopen. Je hebt alleen de verkeerde kaart."',
      '"De persoon die jij wilt worden bestaat al. Je hoeft hem alleen nog te vinden."',
    ],
    ctas: [
      'Download de gratis zelfreflectie gids voor ondernemers → [link]',
      'Volg de gratis Identity Reset workshop → [link]',
    ],
  },
]

// ── Component ──────────────────────────────────────────────

export default function ContentStrategiePage() {
  const [openPijlers, setOpenPijlers] = useState<Set<string>>(
    new Set(PIJLERS.map((p) => p.id))
  )

  function togglePijler(id: string) {
    setOpenPijlers((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <div className="mf-has-sidebar">
      <Navbar />
      <main
        style={{
          marginLeft: 240,
          maxWidth: 1100,
          padding: '32px 40px 80px',
          minHeight: '100vh',
          backgroundColor: 'var(--bg-app)',
        }}
      >
        {/* ── Nav Tabs ─────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            marginBottom: 36,
          }}
        >
          {[
            { href: '/content', label: 'Overzicht' },
            { href: '/content/strategie', label: 'Strategie' },
            { href: '/content/ideeen', label: 'Ideeën' },
            { href: '/content/kalender', label: 'Kalender' },
          ].map((tab) => {
            const isActive = tab.href === '/content/strategie'
            return (
              <Link
                key={tab.href}
                href={tab.href}
                style={{
                  padding: '8px 18px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: 'none',
                  background: isActive ? 'var(--mf-green)' : 'var(--bg-card)',
                  color: isActive ? 'var(--bg-app)' : 'var(--text-2)',
                  border: isActive ? 'none' : '1px solid var(--border)',
                  boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                  transition: 'all 0.18s var(--ease)',
                }}
              >
                {tab.label}
              </Link>
            )
          })}
        </div>

        {/* ── Intro ─────────────────────────────────────────── */}
        <div style={{ marginBottom: 40 }}>
          <h1
            style={{
              fontSize: 32,
              fontWeight: 800,
              color: 'var(--text-1)',
              margin: '0 0 6px',
              letterSpacing: '-0.5px',
              position: 'relative',
              display: 'inline-block',
            }}
          >
            <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 0, pointerEvents: 'none' }} aria-hidden="true">
              <div style={{ width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, color-mix(in srgb, var(--mentaforce-primary) 18%, transparent) 0%, transparent 70%)' }} />
            </span>
            <span style={{ position: 'relative', zIndex: 1 }}>Content Strategie</span>
          </h1>
          <p
            style={{
              fontSize: 17,
              color: 'var(--text-3)',
              margin: '0 0 24px',
            }}
          >
            7 pijlers. Eén krachtig personal brand.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[
              { label: '7 Pijlers', Icon: Landmark },
              { label: '4+ Platforms', Icon: Radio },
              { label: '100K+ Volgers doel', Icon: Target },
            ].map((chip) => (
              <div
                key={chip.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 100,
                  padding: '7px 16px',
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--text-2)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <chip.Icon size={15} strokeWidth={2.5} color="var(--mentaforce-primary)" aria-hidden="true" />
                {chip.label}
              </div>
            ))}
          </div>
        </div>

        {/* ── Pijler Grid ───────────────────────────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 24,
          }}
        >
          {PIJLERS.map((pijler) => {
            const isOpen = openPijlers.has(pijler.id)
            return (
              <PijlerKaart
                key={pijler.id}
                pijler={pijler}
                isOpen={isOpen}
                onToggle={() => togglePijler(pijler.id)}
              />
            )
          })}
        </div>
      </main>
    </div>
  )
}

// ── PijlerKaart ────────────────────────────────────────────

function PijlerKaart({
  pijler,
  isOpen,
  onToggle,
}: {
  pijler: Pijler
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden',
        transition: 'box-shadow 0.2s var(--ease)',
      }}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '20px 22px',
          background: 'none',
          border: 'none',
          borderBottom: isOpen ? '1px solid var(--border)' : 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        {/* Icon bubble */}
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: `color-mix(in srgb, ${pijler.kleur} 10%, transparent)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <pijler.Icon size={22} strokeWidth={2.25} color={pijler.kleur} aria-hidden="true" />
        </div>

        {/* Labels */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3 }}>
            <span
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: 'var(--text-1)',
              }}
            >
              {pijler.label}
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: pijler.kleur,
                background: `color-mix(in srgb, ${pijler.kleur} 10%, transparent)`,
                borderRadius: 100,
                padding: '2px 10px',
                letterSpacing: '0.3px',
                textTransform: 'uppercase',
              }}
            >
              Pijler
            </span>
          </div>
          <p
            style={{
              fontSize: 12,
              color: 'var(--text-3)',
              margin: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {pijler.doelgroep}
          </p>
        </div>

        {/* Chevron */}
        <div
          style={{
            display: 'flex',
            color: 'var(--text-4)',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.22s var(--ease)',
            flexShrink: 0,
          }}
        >
          <ChevronDown size={16} aria-hidden="true" />
        </div>
      </button>

      {/* Body */}
      {isOpen && (
        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 22 }}>
          {/* Problemen */}
          <section>
            <SectieLabel>Problemen</SectieLabel>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 8 }}>
              {pijler.problemen.map((p) => (
                <span
                  key={p}
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--mf-red)',
                    background: 'color-mix(in srgb, var(--mf-red) 9%, transparent)',
                    borderRadius: 100,
                    padding: '4px 12px',
                  }}
                >
                  {p}
                </span>
              ))}
            </div>
          </section>

          {/* Content ideeën */}
          <section>
            <SectieLabel>Content ideeën</SectieLabel>
            <ol style={{ margin: '8px 0 0', paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {pijler.ideeen.map((idee, i) => (
                <li
                  key={i}
                  style={{
                    fontSize: 13,
                    color: 'var(--text-2)',
                    lineHeight: 1.5,
                    paddingLeft: 4,
                  }}
                >
                  {idee}
                </li>
              ))}
            </ol>
          </section>

          {/* Hooks */}
          <section>
            <SectieLabel>Hooks</SectieLabel>
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {pijler.hooks.map((hook, i) => (
                <blockquote
                  key={i}
                  style={{
                    margin: 0,
                    padding: '10px 14px',
                    background: 'var(--bg-subtle)',
                    borderLeft: `3px solid ${pijler.kleur}`,
                    borderRadius: '0 8px 8px 0',
                    fontStyle: 'italic',
                    fontSize: 13,
                    color: 'var(--text-2)',
                    lineHeight: 1.55,
                  }}
                >
                  {hook}
                </blockquote>
              ))}
            </div>
          </section>

          {/* CTA's */}
          <section>
            <SectieLabel>CTA&apos;s</SectieLabel>
            <ul style={{ margin: '8px 0 0', paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 7 }}>
              {pijler.ctas.map((cta, i) => (
                <li
                  key={i}
                  style={{
                    fontSize: 13,
                    color: 'var(--text-2)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                    lineHeight: 1.5,
                  }}
                >
                  <ArrowRight size={15} strokeWidth={2.5} color={pijler.kleur} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
                  {cta}
                </li>
              ))}
            </ul>
          </section>

          {/* Knop */}
          <Link
            href={`/content/ideeen?pijler=${pijler.id}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '11px 20px',
              background: pijler.kleur,
              color: 'var(--bg-app)',
              borderRadius: 'var(--radius-md)',
              fontSize: 13,
              fontWeight: 700,
              textDecoration: 'none',
              transition: 'opacity 0.15s var(--ease)',
              alignSelf: 'flex-start',
            }}
          >
            <Lightbulb size={16} strokeWidth={2.5} aria-hidden="true" />
            Genereer ideeën
          </Link>
        </div>
      )}
    </div>
  )
}

// ── Helper ─────────────────────────────────────────────────

function SectieLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: 11,
        fontWeight: 800,
        color: 'var(--text-4)',
        textTransform: 'uppercase',
        letterSpacing: '0.8px',
        margin: 0,
      }}
    >
      {children}
    </p>
  )
}
