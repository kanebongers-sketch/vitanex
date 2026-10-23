import Link from 'next/link'
import { ArrowRight, CalendarDays, Dumbbell, QrCode } from 'lucide-react'
import { OVERSTAP_STAPPEN } from '@/components/aiyourgym/inhoud/vertrouwen'
import { AppLessen } from '@/components/aiyourgym/mockups/AppSchermen'
import { Toestel } from '@/components/aiyourgym/mockups/kaders'
import { aygPad, OVERSTAPPEN } from '@/components/aiyourgym/site/paden'

// Twee korte vakken naast elkaar (besluit Kane 23-10-2026: ledenapp en
// overstappen horen op de voorpagina, maar kort): wat een lid met de app doet
// en hoe je overstapt, elk met een link naar de pagina met alles erover.
// Op de pc kijkt een telefoon met het lesrooster uit het vak van de ledenapp.

const APP_PUNTEN = [
  { Icoon: CalendarDays, tekst: 'Reserveren met wachtlijst' },
  { Icoon: QrCode, tekst: 'Inchecken met QR' },
  { Icoon: Dumbbell, tekst: 'Eigen schema met coaching' },
] as const

function AppVak() {
  return (
    <article className="ayg-duo-vak ayg-duo-vak--app" aria-labelledby="duo-app-titel">
      <div className="ayg-duo-tekst">
        <p className="ayg-label ayg-label--accent">Ledenapp</p>
        <h2 className="ayg-duo-kop" id="duo-app-titel">
          Reserveren, inchecken, trainen. <mark className="ayg-markeer">Een app.</mark>
        </h2>
        <p className="ayg-duo-zin">In de naam en kleuren van je sportschool. Leden zetten hem met een tik op hun beginscherm, zonder app store.</p>
        <ul className="ayg-duo-punten">
          {APP_PUNTEN.map(({ Icoon, tekst }) => (
            <li key={tekst}>
              <Icoon size={16} aria-hidden />
              {tekst}
            </li>
          ))}
        </ul>
        <Link href={aygPad('/ledenapp')} className="ayg-pijllink">
          Alles over de ledenapp <ArrowRight size={16} aria-hidden />
        </Link>
      </div>
      <div
        className="ayg-duo-beeld aygm"
        role="img"
        aria-label="De ledenapp op een telefoon: het lesrooster van vandaag met vrije plekken, reserveren en een wachtlijst"
      >
        <Toestel tab="Lessen" className="ayg-duo-toestel">
          <AppLessen />
        </Toestel>
      </div>
    </article>
  )
}

function OverstapVak() {
  return (
    <article className="ayg-duo-vak ayg-duo-vak--overstap" aria-labelledby="duo-overstap-titel">
      <p className="ayg-label ayg-label--accent">Overstappen</p>
      <h2 className="ayg-duo-kop" id="duo-overstap-titel">
        Overstappen <mark className="ayg-markeer">zonder gedoe.</mark>
      </h2>
      <p className="ayg-duo-zin">Je ledenadministratie en incasso blijven waar ze zijn. In drie stappen staat je club erin.</p>
      <ol className="ayg-duo-stappen">
        {OVERSTAP_STAPPEN.map((s, i) => (
          <li key={s.titel}>
            <span className="ayg-duo-nr" aria-hidden>
              {i + 1}
            </span>
            {s.titel}
          </li>
        ))}
      </ol>
      <Link href={OVERSTAPPEN} className="ayg-pijllink">
        Zo stap je over <ArrowRight size={16} aria-hidden />
      </Link>
    </article>
  )
}

export function OokGeregeld() {
  return (
    <section className="ayg-sectie ayg-duo" aria-label="Ledenapp en overstappen">
      <div className="ayg-wrap ayg-duo-raster">
        <AppVak />
        <OverstapVak />
      </div>
    </section>
  )
}
