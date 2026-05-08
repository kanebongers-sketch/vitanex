'use client'

import { useState } from 'react'
import Link from 'next/link'

function MarketingNav() {
  const [open, setOpen] = useState(false)
  return (
    <nav className="sticky top-0 z-50 border-b"
      style={{ background: 'rgba(10,15,30,0.96)', borderColor: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-4 flex items-center justify-between">

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#1D9E75' }}>
            <span className="text-white text-sm font-bold">M</span>
          </div>
          <span className="font-bold text-white text-lg tracking-tight">MentaForce</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {[['#functies', 'Functies'], ['#hoe-werkt-het', 'Hoe werkt het'], ['#prijzen', 'Prijzen']].map(([h, l]) => (
            <a key={h} href={h} className="text-sm font-medium transition" style={{ color: 'rgba(255,255,255,0.5)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'white')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}>
              {l}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium transition px-4 py-2"
            style={{ color: 'rgba(255,255,255,0.45)' }}>
            Inloggen
          </Link>
          <Link href="/register"
            className="text-sm font-bold text-white px-5 py-2.5 rounded-xl transition hover:opacity-90 flex items-center gap-1.5"
            style={{ background: '#1D9E75', boxShadow: '0 0 20px rgba(29,158,117,0.35)' }}>
            Gratis starten
          </Link>
        </div>

        <button className="md:hidden p-2" style={{ color: 'rgba(255,255,255,0.5)' }}
          onClick={() => setOpen(o => !o)}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            {open
              ? <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              : <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            }
          </svg>
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t px-6 py-5 flex flex-col gap-4"
          style={{ borderColor: 'rgba(255,255,255,0.07)', background: '#0a0f1e' }}>
          {[['#functies', 'Functies'], ['#hoe-werkt-het', 'Hoe werkt het'], ['#prijzen', 'Prijzen']].map(([h, l]) => (
            <a key={h} href={h} onClick={() => setOpen(false)} className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{l}</a>
          ))}
          <Link href="/login" className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Inloggen</Link>
          <Link href="/register" onClick={() => setOpen(false)}
            className="text-sm font-bold text-white py-3 rounded-xl text-center"
            style={{ background: '#1D9E75' }}>
            Gratis starten
          </Link>
        </div>
      )}
    </nav>
  )
}

function MockDashboard() {
  return (
    <div className="w-full rounded-2xl overflow-hidden"
      style={{ maxWidth: 540, boxShadow: '0 40px 100px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)' }}>
      <div className="px-4 py-3 flex items-center gap-3" style={{ background: '#111827' }}>
        <div className="flex gap-1.5">
          {['#E24B4A', '#BA7517', '#1D9E75'].map(c => (
            <div key={c} className="w-3 h-3 rounded-full" style={{ background: c }} />
          ))}
        </div>
        <div className="flex-1 rounded-lg px-3 py-1.5 text-xs font-mono text-center"
          style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)' }}>
          MentaForce.app/dashboard
        </div>
      </div>

      <div className="p-5" style={{ background: 'var(--bg-app)' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-bold text-gray-900">HR-dashboard</p>
            <p className="text-xs text-gray-400">Vandaag, 09:41</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full"
            style={{ background: '#E1F5EE', color: '#0F6E56' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#1D9E75' }} />
            Live
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'Vitaliteitscore', value: '4.1/5', color: '#1D9E75', bg: '#E1F5EE' },
            { label: 'Participatie', value: '87%', color: '#378ADD', bg: '#E6F1FB' },
            { label: 'Risicosignalen', value: '2', color: '#E24B4A', bg: '#FCEBEB' },
          ].map(m => (
            <div key={m.label} className="rounded-xl p-3 text-center bg-white border border-gray-100">
              <p className="text-xl font-extrabold tracking-tight" style={{ color: m.color }}>{m.value}</p>
              <p className="text-xs text-gray-400 mt-0.5 leading-tight">{m.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl p-4 mb-3 border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-600">Vitaliteitstrend - 12 weken</p>
            <span className="text-xs font-bold" style={{ color: '#1D9E75' }}>+12%</span>
          </div>
          <div className="flex items-end gap-1" style={{ height: 56 }}>
            {[52, 56, 53, 64, 68, 63, 72, 70, 77, 75, 81, 88].map((h, i) => (
              <div key={i} className="flex-1 rounded-t-sm"
                style={{ height: `${h}%`, background: i >= 10 ? '#1D9E75' : i >= 6 ? '#6BCBA9' : '#D1F0E5' }} />
            ))}
          </div>
        </div>

        <div className="rounded-xl p-3.5 mb-3 border" style={{ background: '#1a1a2e', borderColor: 'rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(29,158,117,0.25)', color: '#4ECBA5' }}>AI</span>
            <p className="text-xs font-semibold text-white">Inzicht</p>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Werkdruk stijgt al 3 weken bij 2 teamleden. Overweeg een gesprek voor vrijdag.
          </p>
        </div>

        <div className="bg-white rounded-xl p-3 border border-gray-100">
          <p className="text-xs font-bold text-gray-400 mb-2 tracking-widest">TEAM DEZE WEEK</p>
          {[
            { naam: 'Sarah V.', score: 4.3, status: 'ok' },
            { naam: 'Thomas D.', score: 2.1, status: 'risico' },
            { naam: 'Emma B.', score: 3.8, status: 'ok' },
            { naam: 'Lore M.', score: null, status: 'open' },
          ].map(l => (
            <div key={l.naam} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{
                    background: l.status === 'risico' ? '#FCEBEB' : l.status === 'open' ? '#F3F4F6' : '#E1F5EE',
                    color: l.status === 'risico' ? '#E24B4A' : l.status === 'open' ? '#9ca3af' : '#1D9E75',
                  }}>
                  {l.naam[0]}
                </div>
                <span className="text-xs font-medium text-gray-700">{l.naam}</span>
                {l.status === 'risico' && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
                    style={{ background: '#FCEBEB', color: '#E24B4A' }}>Signaal</span>
                )}
              </div>
              <span className="text-xs font-bold"
                style={{ color: l.score === null ? '#d1d5db' : l.score >= 3.5 ? '#1D9E75' : l.score >= 2.5 ? '#BA7517' : '#E24B4A' }}>
                {l.score !== null ? `${l.score}/5` : '-'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'var(--font-geist-sans)' }}>
      <MarketingNav />

      {/* HERO */}
      <section className="relative overflow-hidden" style={{ background: '#0a0f1e' }}>
        <div className="absolute inset-0 pointer-events-none">
          <div style={{ position: 'absolute', top: '-15%', right: '-5%', width: '55%', height: '90%', background: 'radial-gradient(ellipse, rgba(29,158,117,0.13) 0%, transparent 60%)', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', bottom: '-20%', left: '-10%', width: '45%', height: '70%', background: 'radial-gradient(ellipse, rgba(55,138,221,0.07) 0%, transparent 65%)', borderRadius: '50%' }} />
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-28 pb-28 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8 text-xs font-semibold border"
              style={{ background: 'rgba(29,158,117,0.1)', borderColor: 'rgba(29,158,117,0.25)', color: '#4ECBA5' }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#4ECBA5' }} />
              Gebouwd voor Nederlandse werknemers en HR-teams
            </div>

            <h1 className="font-extrabold text-white leading-tight mb-6 tracking-tight"
              style={{ fontSize: 'clamp(2.8rem, 5vw, 4rem)' }}>
              Voorkom burn-out.<br />
              <span style={{ color: '#1D9E75' }}>Bescherm je team.</span>
            </h1>

            <p className="text-lg leading-relaxed mb-10" style={{ color: 'rgba(255,255,255,0.55)', maxWidth: 480 }}>
              MentaForce geeft jou en je HR-team realtime inzicht in welzijn op het werk.
              Herken risicos vroeg - anoniem, veilig en actiegericht.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-10">
              <Link href="/register"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl text-white font-bold text-sm transition hover:opacity-90"
                style={{ background: '#1D9E75', boxShadow: '0 4px 24px rgba(29,158,117,0.45)' }}>
                Gratis account aanmaken
              </Link>
              <a href="#hoe-werkt-het"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl font-semibold text-sm transition"
                style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.1)' }}>
                Hoe werkt het?
              </a>
            </div>

            <div className="flex items-center gap-6 flex-wrap">
              {['Volledig anoniem', 'AVG-conform', 'Actief in 1 dag', 'Gratis te starten'].map(t => (
                <span key={t} className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.25)' }}>+ {t}</span>
              ))}
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <MockDashboard />
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
            {[
              { stat: '1 op 3', label: 'werknemers heeft burn-out klachten', color: '#E24B4A' },
              { stat: '15.000', label: 'euro gemiddelde kost per ziekteverzuim', color: '#BA7517' },
              { stat: '68%', label: 'HR-managers mist vroegtijdig inzicht', color: '#378ADD' },
            ].map(s => (
              <div key={s.label} className="py-14 px-10 text-center">
                <p className="font-black mb-2 tracking-tight" style={{ fontSize: '3rem', color: s.color }}>{s.stat}</p>
                <p className="text-sm text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FUNCTIES */}
      <section id="functies" className="py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-20">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#1D9E75' }}>Functies</p>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-5 tracking-tight">
              Alles wat je nodig hebt
            </h2>
            <p className="text-xl text-gray-400 max-w-xl mx-auto">
              Van dagelijkse check-ins tot burn-out detectie. Voor werknemers en HR in een platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: 'HR', kleur: '#1D9E75', bg: '#E1F5EE',
                titel: 'HR-dashboard',
                tekst: 'Realtime overzicht van het welzijn van je team. Vitaliteitsscores, trends en vroege waarschuwingssignalen op een scherm.',
                items: ['Vitaliteitscore per team', 'Burn-out risico detectie', 'Anonieme feedback inbox', 'AI-inzichten'],
              },
              {
                icon: 'CI', kleur: '#378ADD', bg: '#E6F1FB',
                titel: 'Anonieme check-ins',
                tekst: 'Medewerkers geven eerlijke antwoorden omdat het anoniem is. HR ziet enkel groepsgemiddelden - nooit individuele scores.',
                items: ['5 kant-en-klare templates', 'Kleine-team bescherming', 'AVG-conform', 'Automatische follow-up'],
              },
              {
                icon: 'AI', kleur: '#8B5CF6', bg: '#EEEDFE',
                titel: 'AI-inzichten',
                tekst: 'Kunstmatige intelligentie analyseert je teamdata en geeft concrete adviezen in gewone taal. Geen technisch jargon.',
                items: ['Automatische samenvatting', 'Concrete HR-adviezen', 'Trendanalyse', 'Persoonlijke AI-coach'],
              },
            ].map(f => (
              <div key={f.titel} className="rounded-3xl border border-gray-100 p-8 hover:shadow-2xl transition-all duration-300">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-sm font-bold mb-6" style={{ background: f.bg, color: f.kleur }}>
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{f.titel}</h3>
                <p className="text-gray-500 mb-6 leading-relaxed">{f.tekst}</p>
                <ul className="space-y-3">
                  {f.items.map(item => (
                    <li key={item} className="flex items-center gap-3 text-sm text-gray-600">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0 font-bold"
                        style={{ background: f.kleur }}>v</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURE GRID */}
      <section style={{ background: 'var(--bg-app)' }} className="py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-5 tracking-tight">
              Een platform. Alle tools.
            </h2>
            <p className="text-xl text-gray-400">Voor werknemers en HR-managers samen.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
            {[
              { afk: 'CI', kleur: '#1D9E75', bg: '#E1F5EE', label: 'Wekelijkse check-in', sub: '1 minuut · 12 metrics' },
              { afk: 'AI', kleur: '#378ADD', bg: '#E6F1FB', label: 'Welzijnscoach', sub: '24/7 beschikbaar' },
              { afk: 'J',  kleur: '#8B5CF6', bg: '#EEEDFE', label: 'Persoonlijk journal', sub: 'Reflectie en inzicht' },
              { afk: 'F',  kleur: '#1D9E75', bg: '#E1F5EE', label: 'Focus en herstel', sub: 'Ademhaling en timers' },
              { afk: 'BO', kleur: '#E24B4A', bg: '#FCEBEB', label: 'Burn-out scan', sub: 'Vroeg detecteren' },
              { afk: 'CH', kleur: '#BA7517', bg: '#FAEEDA', label: 'Teamchat', sub: 'Direct communiceren' },
              { afk: 'HR', kleur: '#378ADD', bg: '#E6F1FB', label: 'HR-rapporten', sub: 'Trends en export' },
              { afk: 'GT', kleur: '#8B5CF6', bg: '#EEEDFE', label: 'Gewoontetracker', sub: 'Dagelijkse streaks' },
            ].map(f => (
              <div key={f.label} className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-all cursor-default">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold mb-4" style={{ background: f.bg, color: f.kleur }}>{f.afk}</div>
                <p className="text-sm font-bold text-gray-900">{f.label}</p>
                <p className="text-xs text-gray-400 mt-1">{f.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOE WERKT HET */}
      <section id="hoe-werkt-het" className="py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-20">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#1D9E75' }}>Hoe werkt het</p>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-5 tracking-tight">Klaar in 3 stappen</h2>
            <p className="text-xl text-gray-400">Van registratie tot inzicht in minder dan een dag.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { step: '01', titel: 'Account aanmaken', tekst: 'Registreer gratis en nodig je collega\'s uit via e-mail. Geen IT-afdeling nodig. Binnen een dag operationeel.', kleur: '#1D9E75' },
              { step: '02', titel: 'Medewerkers checken in', tekst: 'Elke week een anonieme check-in van 1 minuut. Medewerkers zien direct hun eigen trends en krijgen tips.', kleur: '#378ADD' },
              { step: '03', titel: 'HR handelt proactief', tekst: 'Het dashboard toont signalen, risicos en adviezen. Vroeg ingrijpen voor uitval plaatsvindt.', kleur: '#8B5CF6' },
            ].map(s => (
              <div key={s.step}>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl flex-shrink-0"
                    style={{ background: s.kleur + '15', color: s.kleur }}>
                    {s.step}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{s.titel}</h3>
                <p className="text-gray-500 leading-relaxed text-base">{s.tekst}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="prijzen" style={{ background: 'var(--bg-app)' }} className="py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-20">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#1D9E75' }}>Prijzen</p>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-5 tracking-tight">Transparant en schaalbaar</h2>
            <p className="text-xl text-gray-400">Geen verrassingen. Per medewerker per maand.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                naam: 'Starter', prijs: '4', per: 'per medewerker / maand', min: 'Min. 10 medewerkers',
                kleur: '#6b7280',
                features: ['Wekelijkse check-in', 'Persoonlijk portaal', 'AI Welzijnscoach', 'Teamchat', 'HR-dashboard'],
                missing: ['Pulse surveys', 'Burn-out detectie', 'AI HR-inzichten'],
                cta: 'Gratis starten', populair: false,
              },
              {
                naam: 'Groei', prijs: '7', per: 'per medewerker / maand', min: 'Min. 25 medewerkers',
                kleur: '#1D9E75',
                features: ['Alles in Starter', 'Pulse surveys en templates', 'Burn-out risico detectie', 'Anonieme feedback', 'AI HR-inzichten', 'Trends en rapporten', 'Early warning signalen'],
                missing: [],
                cta: 'Demo aanvragen', populair: true,
              },
              {
                naam: 'Enterprise', prijs: 'Op maat', per: '', min: '100+ medewerkers',
                kleur: '#1a1a2e',
                features: ['Alles in Groei', 'AFAS / Personio koppeling', 'SSO en SAML login', 'Eigen branding', 'SLA garantie', 'Dedicated support', 'Maatwerk rapportages', 'Onboarding begeleiding'],
                missing: [],
                cta: 'Contact opnemen', populair: false,
              },
            ].map(p => (
              <div key={p.naam} className="bg-white rounded-2xl p-8 relative"
                style={{
                  border: `2px solid ${p.populair ? p.kleur : '#e5e7eb'}`,
                  boxShadow: p.populair ? '0 24px 64px rgba(29,158,117,0.18)' : 'none',
                }}>
                {p.populair && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="text-xs font-bold px-5 py-2 rounded-full text-white whitespace-nowrap"
                      style={{ background: p.kleur }}>
                      Meest gekozen
                    </span>
                  </div>
                )}
                <p className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-widest">{p.naam}</p>
                <div className="flex items-baseline gap-1 mb-1">
                  {p.prijs !== 'Op maat' && <span className="text-xl font-bold text-gray-500">€</span>}
                  <p className="font-black text-gray-900 tracking-tight" style={{ fontSize: '3rem' }}>{p.prijs}</p>
                </div>
                {p.per && <p className="text-xs text-gray-400 mb-0.5">{p.per}</p>}
                <p className="text-xs text-gray-400 mb-8 pb-8 border-b border-gray-100">{p.min}</p>
                <Link href="/register" className="block w-full text-center py-3.5 rounded-xl text-sm font-bold transition mb-7"
                  style={{
                    background: p.populair ? p.kleur : 'transparent',
                    color: p.populair ? 'white' : p.kleur,
                    border: p.populair ? 'none' : `2px solid ${p.kleur}`,
                  }}>
                  {p.cta}
                </Link>
                <ul className="space-y-3">
                  {p.features.map(f => (
                    <li key={f} className="flex items-center gap-3 text-sm text-gray-600">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0 font-bold"
                        style={{ background: p.kleur }}>v</span>
                      {f}
                    </li>
                  ))}
                  {p.missing.map(f => (
                    <li key={f} className="flex items-center gap-3 text-sm text-gray-300">
                      <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-gray-300 text-xs flex-shrink-0">-</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-5 tracking-tight">Wat gebruikers zeggen</h2>
            <p className="text-xl text-gray-400">Vroege gebruikers over hun ervaring met MentaForce.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { quote: 'Eindelijk een tool die medewerkers echt gebruiken. De anonimiteit maakt het verschil. We krijgen nu eerlijke feedback in plaats van sociaal wenselijke antwoorden.', naam: 'Sarah Vandenberghe', rol: 'HR Manager - 120 medewerkers', initiaal: 'S', kleur: '#1D9E75' },
              { quote: 'De AI-samenvatting bespaart me uren per week. Ik open het dashboard maandagochtend en weet meteen wat er speelt. Onmisbaar geworden.', naam: 'Thomas Declercq', rol: 'People & Culture Lead - 85 medewerkers', initiaal: 'T', kleur: '#378ADD' },
              { quote: 'We hebben een dreigende burn-out kunnen voorkomen dankzij de vroege signaaldetectie. De ROI was bewezen na de eerste maand.', naam: 'Emma Baert', rol: 'HR Directeur - 340 medewerkers', initiaal: 'E', kleur: '#8B5CF6' },
            ].map(t => (
              <div key={t.naam} className="rounded-3xl border border-gray-100 p-8 hover:shadow-xl transition-all duration-300">
                <div className="flex gap-1 mb-6">
                  {[1, 2, 3, 4, 5].map(i => <span key={i} className="text-yellow-400 text-xl">?</span>)}
                </div>
                <p className="text-gray-600 leading-relaxed mb-8 text-base">{t.quote}</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                    style={{ background: t.kleur }}>
                    {t.initiaal}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{t.naam}</p>
                    <p className="text-xs text-gray-400">{t.rol}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="contact" className="py-28 relative overflow-hidden" style={{ background: '#0a0f1e' }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 90% at 50% 50%, rgba(29,158,117,0.13) 0%, transparent 65%)' }} />
        <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
          <p className="text-xs font-bold uppercase tracking-widest mb-6" style={{ color: '#4ECBA5' }}>Klaar om te starten?</p>
          <h2 className="font-extrabold text-white mb-6 tracking-tight leading-tight"
            style={{ fontSize: 'clamp(2.2rem, 4vw, 3.5rem)' }}>
            Bescherm je team.<br />Begin vandaag.
          </h2>
          <p className="text-lg leading-relaxed mb-12" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Maak gratis een account aan of vraag een persoonlijke demo aan. Geen creditcard nodig.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register"
              className="inline-flex items-center justify-center px-10 py-4 rounded-xl font-bold text-sm text-white transition hover:opacity-90"
              style={{ background: '#1D9E75', boxShadow: '0 4px 24px rgba(29,158,117,0.45)' }}>
              Gratis account aanmaken
            </Link>
            <Link href="/contact"
              className="inline-flex items-center justify-center px-10 py-4 rounded-xl font-semibold text-sm transition"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.1)' }}>
              Neem contact op
            </Link>
          </div>
          <p className="text-xs mt-8" style={{ color: 'rgba(255,255,255,0.18)' }}>
            Geen creditcard - Klaar in 1 dag - Altijd opzegbaar
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#060c18', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#1D9E75' }}>
              <span className="text-white text-xs font-bold">M</span>
            </div>
            <span className="font-bold text-white">MentaForce</span>
            <span className="mx-1" style={{ color: 'rgba(255,255,255,0.1)' }}>·</span>
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.18)' }}>Vitaliteit op de werkplek</span>
          </div>
          <div className="flex items-center gap-6 text-xs flex-wrap justify-center"
            style={{ color: 'rgba(255,255,255,0.2)' }}>
            <Link href="/voorwaarden" className="transition hover:text-white/50">Voorwaarden</Link>
            <Link href="/contact" className="transition hover:text-white/50">Contact</Link>
            <Link href="/register" className="transition hover:text-white/50">Registreren</Link>
            <Link href="/login" className="transition hover:text-white/50">Inloggen</Link>
          </div>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.18)' }}>© 2025 MentaForce · Gemaakt in Nederland ????</p>
        </div>
      </footer>
    </div>
  )
}
