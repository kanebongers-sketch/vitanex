import Link from 'next/link'
import { ArrowRight, CalendarDays, Dumbbell, QrCode } from 'lucide-react'
import { AppLessen } from '@/components/aiyourgym/mockups/AppSchermen'
import { Toestel } from '@/components/aiyourgym/mockups/kaders'
import { aygPad } from '@/components/aiyourgym/site/paden'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { getSiteTaal } from '@/lib/aiyourgym/taal/server'
import { OOK_GEREGELD } from '@/lib/aiyourgym/taal/woorden/website/home'

// Twee korte vakken naast elkaar (besluit Kane 23-10-2026: ledenapp en
// overstappen horen op de voorpagina, maar kort): wat een lid met de app doet
// en hoe je overstapt, elk met een link naar de pagina met alles erover.
// Op de pc kijkt een telefoon met het lesrooster uit het vak van de ledenapp.
// Teksten in de taal van de pagina (woordenboek OOK_GEREGELD).

const APP_ICONEN = [CalendarDays, QrCode, Dumbbell] as const

interface VakProps {
  taal: Taal
  t: (typeof OOK_GEREGELD)['nl']
}

function AppVak({ taal, t }: VakProps) {
  const { app } = t
  return (
    <article className="ayg-duo-vak ayg-duo-vak--app" aria-labelledby="duo-app-titel">
      <div className="ayg-duo-tekst">
        <p className="ayg-label ayg-label--accent">{app.label}</p>
        <h2 className="ayg-duo-kop" id="duo-app-titel">
          {app.titel.voor}
          <mark className="ayg-markeer">{app.titel.accent}</mark>
        </h2>
        <p className="ayg-duo-zin">{app.zin}</p>
        <ul className="ayg-duo-punten">
          {app.punten.map((tekst, i) => {
            const Icoon = APP_ICONEN[i % APP_ICONEN.length]
            return (
              <li key={tekst}>
                <Icoon size={16} aria-hidden />
                {tekst}
              </li>
            )
          })}
        </ul>
        <Link href={aygPad('/ledenapp', taal)} className="ayg-pijllink">
          {app.link} <ArrowRight size={16} aria-hidden />
        </Link>
      </div>
      <div className="ayg-duo-beeld aygm" role="img" aria-label={app.beeldLabel}>
        <Toestel tab="Lessen" className="ayg-duo-toestel">
          <AppLessen />
        </Toestel>
      </div>
    </article>
  )
}

function OverstapVak({ taal, t }: VakProps) {
  const { overstap } = t
  return (
    <article className="ayg-duo-vak ayg-duo-vak--overstap" aria-labelledby="duo-overstap-titel">
      <p className="ayg-label ayg-label--accent">{overstap.label}</p>
      <h2 className="ayg-duo-kop" id="duo-overstap-titel">
        {overstap.titel.voor}
        <mark className="ayg-markeer">{overstap.titel.accent}</mark>
      </h2>
      <p className="ayg-duo-zin">{overstap.zin}</p>
      <ol className="ayg-duo-stappen">
        {overstap.stappen.map((titel, i) => (
          <li key={titel}>
            <span className="ayg-duo-nr" aria-hidden>
              {i + 1}
            </span>
            {titel}
          </li>
        ))}
      </ol>
      <Link href={aygPad('/overstappen', taal)} className="ayg-pijllink">
        {overstap.link} <ArrowRight size={16} aria-hidden />
      </Link>
    </article>
  )
}

export async function OokGeregeld() {
  const taal = await getSiteTaal()
  const t = OOK_GEREGELD[taal]
  return (
    <section className="ayg-sectie ayg-duo" aria-label={t.sectieLabel}>
      <div className="ayg-wrap ayg-duo-raster">
        <AppVak taal={taal} t={t} />
        <OverstapVak taal={taal} t={t} />
      </div>
    </section>
  )
}
