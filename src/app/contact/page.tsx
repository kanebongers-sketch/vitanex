'use client'

import { useState } from 'react'
import Link from 'next/link'

function MarketingNav() {
  return (
    <nav className="sticky top-0 z-50 border-b"
      style={{ background: 'rgba(10,15,30,0.96)', borderColor: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--mf-green)' }}>
            <span className="text-white text-sm font-bold">M</span>
          </div>
          <span className="font-bold text-white text-lg tracking-tight">MentaForce</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/voorwaarden" className="text-sm transition" style={{ color: 'rgba(255,255,255,0.45)' }}>Voorwaarden</Link>
          <Link href="/login" className="text-sm font-bold text-white px-5 py-2.5 rounded-xl transition hover:opacity-90"
            style={{ background: 'var(--mf-green)' }}>
            Inloggen
          </Link>
        </div>
      </div>
    </nav>
  )
}

const ONDERWERPEN = [
  { id: 'demo', label: '🎯 Demo aanvragen', beschrijving: 'Ontdek hoe MentaForce werkt voor jouw team' },
  { id: 'pricing', label: '💰 Prijsinformatie', beschrijving: 'Maatwerk offerte voor jouw organisatie' },
  { id: 'technisch', label: '🔧 Technische vraag', beschrijving: 'Support, integraties en API' },
  { id: 'privacy', label: '🔒 Privacy & AVG', beschrijving: 'Vragen over gegevensverwerking' },
  { id: 'partnership', label: '🤝 Partnership', beschrijving: 'Samenwerking en reseller-programma' },
  { id: 'anders', label: '💬 Overig', beschrijving: 'Een andere vraag of opmerking' },
]

const FAQ = [
  {
    vraag: 'Hoe snel kan ik starten met MentaForce?',
    antwoord: 'Na het aanmaken van een account is MentaForce binnen één werkdag operationeel. Medewerkers ontvangen automatisch een uitnodigingsmail.',
  },
  {
    vraag: 'Is er een gratis proefperiode?',
    antwoord: 'Ja, we bieden een 30-daagse gratis proefperiode aan voor teams tot 50 medewerkers. Geen creditcard vereist.',
  },
  {
    vraag: 'Hoe worden de gegevens van medewerkers beschermd?',
    antwoord: 'MentaForce is volledig AVG-conform. HR ziet nooit individuele antwoorden, enkel geaggregeerde teamdata. Alle data wordt opgeslagen binnen de EU.',
  },
  {
    vraag: 'Kan MentaForce integreren met ons HR-systeem?',
    antwoord: 'Enterprise-klanten kunnen integreren met AFAS, Personio en andere HR-systemen. Neem contact op voor de mogelijkheden.',
  },
  {
    vraag: 'Wat zijn de minimale teamvereisten?',
    antwoord: 'Het Starter-plan vereist minimaal 10 medewerkers. Het Groei-plan vereist minimaal 25 medewerkers. Enterprise is beschikbaar vanaf 100 medewerkers.',
  },
  {
    vraag: 'Bieden jullie training of onboarding aan?',
    antwoord: 'Enterprise-klanten ontvangen persoonlijke onboarding begeleiding. Voor Starter en Groei is uitgebreide documentatie en videogidsen beschikbaar.',
  },
]

export default function Contact() {
  const [geselecteerd, setGeselecteerd] = useState<string | null>(null)
  const [naam, setNaam] = useState('')
  const [email, setEmail] = useState('')
  const [organisatie, setOrganisatie] = useState('')
  const [teamgrootte, setTeamgrootte] = useState('')
  const [bericht, setBericht] = useState('')
  const [verzonden, setVerzonden] = useState(false)
  const [bezig, setBezig] = useState(false)
  const [faqOpen, setFaqOpen] = useState<number | null>(null)

  async function verstuur(e: React.FormEvent) {
    e.preventDefault()
    if (!naam.trim() || !email.trim() || !bericht.trim()) return
    setBezig(true)
    // Simulate send delay
    await new Promise(r => setTimeout(r, 1200))
    setBezig(false)
    setVerzonden(true)
  }

  return (
    <div className="min-h-screen" style={{ background: '#0a0f1e', fontFamily: 'var(--font-geist-sans)' }}>
      <MarketingNav />

      {/* Hero */}
      <section className="relative overflow-hidden py-20 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 80% at 50% 0%, rgba(29,158,117,0.1) 0%, transparent 60%)' }} />
        <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6 text-xs font-semibold border"
            style={{ background: 'rgba(29,158,117,0.1)', borderColor: 'rgba(29,158,117,0.25)', color: 'var(--mf-green)' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--mf-green)' }} />
            We antwoorden binnen 24 uur
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold text-white mb-4 tracking-tight">
            Neem contact op
          </h1>
          <p className="text-lg leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Vraag een demo aan, bespreek pricing of stel een vraag. We staan klaar om te helpen.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-5 gap-16">

        {/* Left: form */}
        <div className="lg:col-span-3">

          {verzonden ? (
            <div className="rounded-3xl border p-14 text-center"
              style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(29,158,117,0.06)' }}>
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto mb-6"
                style={{ background: 'rgba(29,158,117,0.15)' }}>
                ✅
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Bericht verstuurd!</h2>
              <p className="mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
                We hebben je bericht ontvangen en nemen zo snel mogelijk contact op.
              </p>
              <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Verwacht een reactie op <span style={{ color: 'var(--mf-green)' }}>{email}</span> binnen 24 uur.
              </p>
              <button
                onClick={() => { setVerzonden(false); setNaam(''); setEmail(''); setOrganisatie(''); setBericht(''); setGeselecteerd(null) }}
                className="text-sm font-medium px-6 py-3 rounded-xl transition"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}
              >
                Nieuw bericht sturen
              </button>
            </div>
          ) : (
            <form onSubmit={verstuur}>
              <h2 className="text-xl font-bold text-white mb-6">Stuur ons een bericht</h2>

              {/* Subject select */}
              <div className="mb-6">
                <p className="text-sm font-medium mb-3" style={{ color: 'rgba(255,255,255,0.6)' }}>Onderwerp</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {ONDERWERPEN.map(o => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => setGeselecteerd(o.id)}
                      className="text-left p-3 rounded-xl border transition"
                      style={{
                        background: geselecteerd === o.id ? 'rgba(29,158,117,0.12)' : 'rgba(255,255,255,0.03)',
                        borderColor: geselecteerd === o.id ? 'rgba(29,158,117,0.5)' : 'rgba(255,255,255,0.08)',
                      }}
                    >
                      <p className="text-sm font-medium text-white mb-0.5">{o.label}</p>
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{o.beschrijving}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Name + email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs font-medium block mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    Naam *
                  </label>
                  <input
                    type="text"
                    value={naam}
                    onChange={e => setNaam(e.target.value)}
                    placeholder="Jan Janssen"
                    required
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none transition"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'white',
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'rgba(29,158,117,0.5)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    E-mailadres *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="jan@bedrijf.nl"
                    required
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none transition"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'white',
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'rgba(29,158,117,0.5)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
                  />
                </div>
              </div>

              {/* Organisation + team size */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs font-medium block mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    Organisatie
                  </label>
                  <input
                    type="text"
                    value={organisatie}
                    onChange={e => setOrganisatie(e.target.value)}
                    placeholder="Bedrijfsnaam"
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none transition"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'white',
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'rgba(29,158,117,0.5)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    Teamgrootte
                  </label>
                  <select
                    value={teamgrootte}
                    onChange={e => setTeamgrootte(e.target.value)}
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none transition appearance-none"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: teamgrootte ? 'white' : 'rgba(255,255,255,0.35)',
                    }}
                  >
                    <option value="" disabled>Selecteer grootte</option>
                    <option value="10-24">10 – 24 medewerkers</option>
                    <option value="25-49">25 – 49 medewerkers</option>
                    <option value="50-99">50 – 99 medewerkers</option>
                    <option value="100-249">100 – 249 medewerkers</option>
                    <option value="250+">250+ medewerkers</option>
                  </select>
                </div>
              </div>

              {/* Message */}
              <div className="mb-6">
                <label className="text-xs font-medium block mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Bericht *
                </label>
                <textarea
                  rows={5}
                  value={bericht}
                  onChange={e => setBericht(e.target.value)}
                  placeholder="Beschrijf je vraag of verzoek..."
                  required
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none transition resize-none"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'white',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(29,158,117,0.5)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
                />
              </div>

              <button
                type="submit"
                disabled={bezig || !naam.trim() || !email.trim() || !bericht.trim()}
                className="w-full py-4 rounded-xl text-white font-bold text-sm transition hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2"
                style={{ background: 'var(--mf-green)', boxShadow: '0 4px 24px rgba(29,158,117,0.35)' }}
              >
                {bezig ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Versturen...
                  </>
                ) : (
                  'Bericht versturen →'
                )}
              </button>

              <p className="text-xs text-center mt-4" style={{ color: 'rgba(255,255,255,0.2)' }}>
                Door te versturen ga je akkoord met onze{' '}
                <Link href="/voorwaarden" className="underline hover:opacity-70">Voorwaarden</Link>.
              </p>
            </form>
          )}
        </div>

        {/* Right: info */}
        <div className="lg:col-span-2 flex flex-col gap-8">

          {/* Direct contact */}
          <div className="rounded-2xl border p-6" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
            <p className="text-sm font-bold text-white mb-4">Direct bereikbaar</p>
            <div className="flex flex-col gap-4">
              <a href="mailto:info@mentaforce.nl" className="flex items-start gap-3 group">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(29,158,117,0.15)' }}>
                  <span className="text-base">✉️</span>
                </div>
                <div>
                  <p className="text-xs font-medium mb-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>E-mail</p>
                  <p className="text-sm font-medium text-white group-hover:underline">info@mentaforce.nl</p>
                </div>
              </a>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(55,138,221,0.15)' }}>
                  <span className="text-base">⏱️</span>
                </div>
                <div>
                  <p className="text-xs font-medium mb-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Reactietijd</p>
                  <p className="text-sm text-white">Binnen 24 uur op werkdagen</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(139,92,246,0.15)' }}>
                  <span className="text-base">🇳🇱</span>
                </div>
                <div>
                  <p className="text-xs font-medium mb-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Locatie</p>
                  <p className="text-sm text-white">Amsterdam, Nederland</p>
                </div>
              </div>
            </div>
          </div>

          {/* Demo CTA */}
          <div className="rounded-2xl border p-6 text-center"
            style={{ borderColor: 'rgba(29,158,117,0.2)', background: 'rgba(29,158,117,0.06)' }}>
            <div className="text-3xl mb-3">🎯</div>
            <p className="text-white font-semibold mb-2">Gratis demo van 30 min</p>
            <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.45)' }}>
              We tonen het platform live en beantwoorden al je vragen.
            </p>
            <button
              onClick={() => setGeselecteerd('demo')}
              className="w-full py-3 rounded-xl text-white text-sm font-bold transition hover:opacity-90"
              style={{ background: 'var(--mf-green)' }}
            >
              Demo aanvragen
            </button>
          </div>

          {/* Trust signals */}
          <div className="flex flex-col gap-2.5">
            {[
              { icon: '🔒', tekst: 'Volledig AVG-conform' },
              { icon: '🇳🇱', tekst: 'Data opgeslagen in de EU' },
              { icon: '⚡', tekst: 'Operationeel in 1 dag' },
              { icon: '🤝', tekst: 'Geen commitments vereist' },
            ].map(t => (
              <div key={t.tekst} className="flex items-center gap-2.5">
                <span className="text-base">{t.icon}</span>
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>{t.tekst}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ */}
      <section className="border-t py-20" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-white mb-3">Veelgestelde vragen</h2>
            <p className="text-base" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Vind je het antwoord niet? Stuur ons een bericht.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {FAQ.map((item, i) => (
              <div
                key={i}
                className="rounded-2xl border overflow-hidden"
                style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}
              >
                <button
                  onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left"
                >
                  <span className="text-sm font-medium text-white">{item.vraag}</span>
                  <span className="text-white/40 text-lg ml-4 flex-shrink-0 transition-transform"
                    style={{ transform: faqOpen === i ? 'rotate(45deg)' : 'rotate(0deg)' }}>
                    +
                  </span>
                </button>
                {faqOpen === i && (
                  <div className="px-6 pb-5 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {item.antwoord}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#060c18', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--mf-green)' }}>
              <span className="text-white text-xs font-bold">M</span>
            </div>
            <span className="font-bold text-white">MentaForce</span>
          </Link>
          <div className="flex items-center gap-6 text-xs flex-wrap justify-center" style={{ color: 'rgba(255,255,255,0.2)' }}>
            <Link href="/voorwaarden" className="transition hover:text-white/50">Voorwaarden</Link>
            <Link href="/contact" className="transition hover:text-white/50" style={{ color: 'var(--mf-green)' }}>Contact</Link>
            <Link href="/login" className="transition hover:text-white/50">Inloggen</Link>
          </div>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.18)' }}>© 2025 MentaForce · Gemaakt in Nederland 🇳🇱</p>
        </div>
      </footer>
    </div>
  )
}
