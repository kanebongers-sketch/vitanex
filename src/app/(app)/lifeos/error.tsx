'use client' // Error boundaries moeten Client Components zijn (Next 16.2.4)

import Link from 'next/link'
import { TriangleAlert } from 'lucide-react'

// ─── De vangnet van LifeOS ──────────────────────────────────────────────────
// De cockpit is elf client-eilanden diep. Elk eiland vangt zijn eigen fetch-
// fouten al af, maar een render-throw (een null die niemand verwachtte, een
// kapotte narrowing) heeft niets boven zich: zonder deze boundary neemt één
// eiland de hele pagina mee en kijkt Kane naar een wit scherm.
//
// Next 16.2.4-conventie: error.tsx krijgt `{ error, unstable_retry }` — niet
// `reset` zoals in oudere Next-versies. Zie `src/app/error.tsx`, dezelfde vorm.
//
// We tonen bewust GEEN interne details (message, stack, digest): die horen in de
// server-logs, niet op het scherm. Wat er wél staat is een weg terug.
//
// Eigen `.lifeos-root`-wrapper: dit vervangt `page.tsx` binnen de layout, dus de
// LifeOS-tokens komen hier niet vanzelf mee.

export default function LifeosFout({
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  return (
    <div className="lifeos-root">
      <div className="os-sfeer" aria-hidden="true" />
      <main className="os-schil os-schil--breed">
        <section
          role="alert"
          style={{ display: 'grid', gap: 18, justifyItems: 'start', maxWidth: '52ch', paddingTop: 24 }}
        >
          <TriangleAlert
            size={26}
            strokeWidth={2}
            aria-hidden="true"
            style={{ color: 'var(--status-laag)' }}
          />

          <h1
            style={{
              fontSize: 'clamp(26px, 5vw, 38px)',
              fontWeight: 700,
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              margin: 0,
            }}
          >
            LifeOS kon niet laden
          </h1>

          {/* Eerlijk over wat we wél weten: dat het aan ons ligt, en dat je data
              er nog gewoon is. Geen "onbekende fout" die je laat twijfelen of je
              zelf iets kwijt bent. */}
          <p style={{ margin: 0, fontSize: 15, color: 'var(--text-3)', lineHeight: 1.6 }}>
            Er ging iets mis bij het opbouwen van je cockpit. Dit ligt aan ons, niet aan jou — je
            taken, notities en logs staan gewoon nog opgeslagen.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 4 }}>
            <button type="button" onClick={() => unstable_retry()} style={PRIMAIR}>
              Opnieuw proberen
            </button>
            <Link href="/home" style={STIL}>
              Naar MentaForce
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}

// Inline en niet de `Knop`-primitive: die zit in de cockpit-boom die hier net is
// omgevallen. Een vangnet dat afhangt van de code die kapot kan zijn, is geen
// vangnet. Twee knoppen kopiëren is die zekerheid waard.
const BASIS = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '11px 20px',
  borderRadius: 999,
  fontFamily: 'inherit',
  fontSize: 14,
  fontWeight: 600,
  textDecoration: 'none',
  cursor: 'pointer',
} as const

const PRIMAIR = {
  ...BASIS,
  border: '1px solid var(--brand)',
  background: 'var(--brand-soft)',
  color: 'var(--brand)',
} as const

const STIL = {
  ...BASIS,
  border: '1px solid var(--line-strong)',
  background: 'transparent',
  color: 'var(--text-2)',
} as const
