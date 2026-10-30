import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { AppHome } from '@/components/aiyourgym/mockups/AppSchermen'
import { HeldDashboard } from '@/components/aiyourgym/mockups/HeldDashboard'
import { Figuur, Toestel } from '@/components/aiyourgym/mockups/kaders'
import { getSiteTaal } from '@/lib/aiyourgym/taal/server'
import { VOORPAGINA } from '@/lib/aiyourgym/taal/woorden/website/voorpagina'
import { SITE_PADEN } from '../site/paden'

// Hoofdstuk 1 (basis): de held, op het kaliber van een productpagina van Apple
// (Kane 28-10-2026): een grote kop in het midden, een zin wat het is, twee knoppen,
// en daaronder groot het product zelf: het scherm Vandaag van Club met de ledenapp
// ervoor. Echte schermen met voorbeeldgegevens van Kernhal, en dat staat erbij.
// De kop komt regel voor regel achter zijn basislijn vandaan (alleen CSS).

export async function HeldMozaiek() {
  const t = VOORPAGINA[await getSiteTaal()].held
  return (
    <section className="vp-held" aria-labelledby="vp-held-titel">
      <div className="vp-held-kop">
        <h1 id="vp-held-titel" className="vp-held-titel">
          {t.titel.map((regel) => (
            <span key={regel} className="vp-regel">
              <span>{regel}</span>
            </span>
          ))}
        </h1>
        <p className="vp-held-lead">{t.lead}</p>
        <div className="vp-knoppen">
          <Link href={SITE_PADEN.AANMELDEN} className="vp-knop vp-knop-vol">
            {t.start} <ArrowRight size={18} aria-hidden />
          </Link>
          <Link href={SITE_PADEN.DEMO} className="vp-knop vp-knop-zacht">
            {t.demo}
          </Link>
        </div>
      </div>
      <Figuur label={t.beeldLabel} className="vp-held-beeld">
        <div className="vp-held-scene">
          <div className="vp-held-venster">
            <HeldDashboard />
          </div>
          <Toestel tab="Home" className="vp-held-toestel">
            <AppHome />
          </Toestel>
        </div>
      </Figuur>
    </section>
  )
}
