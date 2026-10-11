'use client' // Error boundaries moeten Client Components zijn (Next 16.2.4)

import Link from 'next/link'
import { TriangleAlert } from 'lucide-react'

// ─── De vangnet van LifeOS ──────────────────────────────────────────────────
// De cockpit is elf client-eilanden diep. Elk eiland vangt zijn eigen fetch-
// fouten al af, maar een render-throw (een null die niemand verwachtte, een
// kapotte narrowing) heeft niets boven zich: zonder deze boundary neemt een
// eiland de hele pagina mee en kijkt Kane naar een wit scherm.
//
// Next 16.2.4-conventie: error.tsx krijgt `{ error, unstable_retry }`, niet
// `reset` zoals in oudere Next-versies. Zie `src/app/error.tsx`, dezelfde vorm.
//
// We tonen bewust GEEN interne details (message, stack, digest): die horen in de
// server-logs, niet op het scherm. Wat er wel staat is een weg terug.
//
// Eigen `.lifeos-root`-wrapper, net als elke pagina. Dit vervangt `page.tsx` binnen
// de layout; de Fit Factory-tokens komen via `.lk-app .lifeos-root` (globals.css).

export default function LifeosFout({
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  return (
    <div className="lifeos-root">
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

          <h1 className="lk-titel">Je dashboard kon niet laden</h1>

          {/* Eerlijk over wat we wel weten: dat het aan ons ligt, en dat je data
              er nog gewoon is. Geen "onbekende fout" die je laat twijfelen of je
              zelf iets kwijt bent. */}
          <p style={{ margin: 0, fontSize: 15, color: 'var(--text-3)', lineHeight: 1.6 }}>
            Er ging iets mis bij het opbouwen van je cockpit. Dit ligt aan ons, niet aan jou: je
            taken, notities en logs staan gewoon nog opgeslagen.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 4 }}>
            <button type="button" onClick={() => unstable_retry()} style={PRIMAIR}>
              Opnieuw proberen
            </button>
            <Link href="/lifeoskane" style={STIL}>
              Naar je dashboard
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
  minHeight: 40,
  padding: '8px 16px',
  borderRadius: 10,
  fontFamily: 'var(--ff-kop)',
  fontSize: 15,
  fontWeight: 600,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  textDecoration: 'none',
  cursor: 'pointer',
} as const

// Zoals .ptd-knop--primair in de Fit Factory PT-app: een vol amber vlak met
// grafiet tekst (ongeveer 8,7:1).
const PRIMAIR = {
  ...BASIS,
  border: '1px solid var(--brand)',
  background: 'var(--brand)',
  color: 'var(--bg-app)',
} as const

const STIL = {
  ...BASIS,
  border: '1px solid var(--line-strong)',
  background: 'transparent',
  color: 'var(--text-1)',
} as const
