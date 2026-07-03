'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { ArrowRight, Brain, Mail, ShieldCheck } from 'lucide-react'
import { COLORS } from '../theme'
import HeroBrain from './HeroBrain'

const NAV_LINKS: readonly [string, string][] = [
  ['#pijlers', 'Pijlers'],
  ['#aanpak', 'Aanpak'],
  ['#platform', 'Platform'],
]

const SOCIALS: readonly { href: string; label: string; icon: typeof Brain }[] = [
  { href: '#pijlers', label: 'Naar de zes pijlers', icon: Brain },
  { href: '/contact', label: 'Neem contact op', icon: Mail },
  { href: '/voorwaarden#privacy', label: 'Privacy en voorwaarden', icon: ShieldCheck },
]

export default function LiquidHero() {
  const router = useRouter()
  const [email, setEmail] = useState('')

  const startRegistratie = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const adres = email.trim()
    router.push(adres ? `/register?email=${encodeURIComponent(adres)}` : '/register')
  }

  return (
    <section className="relative flex min-h-screen flex-col overflow-hidden">
      {/* 3D-brein als achtergrond (decoratief; tekstalternatief hieronder) */}
      <HeroBrain />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: `linear-gradient(180deg, ${COLORS.navyDeep}B3 0%, transparent 32%, transparent 62%, ${COLORS.navyDeep}CC 100%)` }}
      />
      <p className="sr-only">
        Een driedimensionaal brein in zes gekleurde vlakken: de pijlers Energie, Slaap,
        Stress, Stemming, Beweging en Voeding waarop MentaForce welzijn meet.
      </p>

      {/* Navbar */}
      <header className="relative z-20 px-6 py-6">
        <nav className="liquid-glass mx-auto flex max-w-5xl items-center justify-between rounded-full px-6 py-3">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2.5 rounded-full">
              <span
                aria-hidden
                className="h-2.5 w-2.5 rounded-sm"
                style={{ background: COLORS.cyan, boxShadow: `0 0 12px ${COLORS.cyanGlow}` }}
              />
              <span className="text-lg font-semibold tracking-[0.12em] text-white">MENTAFORCE</span>
            </Link>
            <div className="ml-8 hidden items-center gap-8 md:flex">
              {NAV_LINKS.map(([href, label]) => (
                <a key={href} href={href} className="text-sm font-medium text-white/80 transition-colors hover:text-white">
                  {label}
                </a>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hidden text-sm font-medium text-white sm:inline-block">
              Inloggen
            </Link>
            <Link href="/register" className="liquid-glass rounded-full px-6 py-2 text-sm font-medium text-white">
              Start gratis
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero-content */}
      <div className="relative z-10 flex flex-1 -translate-y-[20%] flex-col items-center justify-center px-6 py-12 text-center">
        <h1 className="whitespace-nowrap text-[clamp(2.75rem,13vw,4.5rem)] font-medium tracking-tight text-white md:text-8xl lg:text-9xl">
          Train je <em className="italic" style={{ color: COLORS.cyan }}>brein</em>.
        </h1>

        <form onSubmit={startRegistratie} className="liquid-glass mt-10 flex w-full max-w-xl items-center gap-3 rounded-full py-2 pl-6 pr-2">
          <label htmlFor="hero-email" className="sr-only">E-mailadres</label>
          <input
            id="hero-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Je e-mailadres"
            className="w-full bg-transparent text-white outline-none placeholder:text-white/40"
          />
          <button
            type="submit"
            aria-label="Start met je e-mailadres"
            className="rounded-full p-3 transition-transform hover:scale-105 active:scale-95"
            style={{ background: COLORS.cyan, color: COLORS.navyDeep }}
          >
            <ArrowRight size={20} aria-hidden />
          </button>
        </form>

        <p className="mt-6 px-4 text-sm leading-relaxed text-white">
          MentaForce meet mentaal welzijn over zes pijlers en helpt je team gericht
          trainen — anoniem, AVG-conform en EU-gehost.
        </p>

        <a href="#over" className="liquid-glass mt-8 rounded-full px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-white/5">
          Ons manifest
        </a>
      </div>

      {/* Snelkoppelingen onderin */}
      <div className="relative z-10 flex justify-center gap-4 pb-12">
        {SOCIALS.map(({ href, label, icon: Icon }) =>
          href.startsWith('#') ? (
            <a key={href} href={href} aria-label={label} className="liquid-glass rounded-full p-4 text-white/80 transition-all hover:bg-white/5 hover:text-white">
              <Icon size={20} aria-hidden />
            </a>
          ) : (
            <Link key={href} href={href} aria-label={label} className="liquid-glass rounded-full p-4 text-white/80 transition-all hover:bg-white/5 hover:text-white">
              <Icon size={20} aria-hidden />
            </Link>
          ),
        )}
      </div>
    </section>
  )
}
