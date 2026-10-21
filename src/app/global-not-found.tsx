import type { CSSProperties } from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'

// De 404 voor een adres zonder pagina, voor de hele app. Nodig omdat er twee root
// layouts zijn (src/app/(hoofd) en src/app/(aiyourgym)); aan te zetten met
// experimental.globalNotFound in next.config.ts. Dit bestand slaat elke layout
// over, dus het is een volledig HTML-document met eigen stijl.
//
// Bewust neutraal: het verschijnt op elk domein (fitfactorypt.nl, releasev.nl,
// aiyourgym.com), dus zonder merknaam, logo of stijlbestand van een van de merken.
// notFound() binnen een pagina valt hier niet onder: daarvoor zijn er
// src/app/(hoofd)/not-found.tsx en src/app/(aiyourgym)/(website)/not-found.tsx.

export const metadata: Metadata = {
  title: 'Pagina niet gevonden',
  robots: { index: false, follow: false },
}

const PAGINA: CSSProperties = {
  margin: 0,
  minHeight: '100dvh',
  display: 'grid',
  placeItems: 'center',
  padding: '48px 20px',
  colorScheme: 'light dark',
  background: 'Canvas',
  color: 'CanvasText',
  fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  textAlign: 'center',
}

const INHOUD: CSSProperties = { display: 'grid', justifyItems: 'center', gap: 12, maxWidth: 420 }

const KOP: CSSProperties = { margin: 0, fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: 700, letterSpacing: '-0.02em' }

const TEKST: CSSProperties = { margin: 0, fontSize: '1rem', lineHeight: 1.55, opacity: 0.72 }

const KNOP: CSSProperties = {
  marginTop: 10,
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: 44,
  padding: '0 22px',
  borderRadius: 999,
  border: '1.5px solid currentColor',
  color: 'inherit',
  fontWeight: 600,
  textDecoration: 'none',
}

export default function GlobaleNietGevonden() {
  return (
    <html lang="nl">
      <body style={PAGINA}>
        <main style={INHOUD}>
          <h1 style={KOP}>Pagina niet gevonden</h1>
          <p style={TEKST}>Deze pagina bestaat niet.</p>
          {/* Valt de startpagina onder een andere root layout, dan laadt Next de pagina gewoon opnieuw. */}
          <Link href="/" style={KNOP}>
            Naar de startpagina
          </Link>
        </main>
      </body>
    </html>
  )
}
