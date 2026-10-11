'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { ArrowRight, Brain, Mail, ShieldCheck } from 'lucide-react'
import { COLORS } from '../theme'
import Wordmark from '../Wordmark'
import { metNadruk } from '../metNadruk'
import { useVertaling } from '@/lib/i18n/TaalProvider'

const HeroField = dynamic(() => import('./HeroField'), { ssr: false, loading: () => null })

// Tweede waarde = vertaalsleutel van het label.
const NAV_LINKS: readonly [string, string][] = [
  ['#brein', 'site.nav.pijlers'],
  ['#aanpak', 'site.nav.aanpak'],
  ['#platform', 'site.nav.platform'],
]

const SOCIALS: readonly { href: string; labelSleutel: string; icon: typeof Brain }[] = [
  { href: '#brein', labelSleutel: 'site.hero.naarBrein', icon: Brain },
  { href: '/contact', labelSleutel: 'site.hero.contact', icon: Mail },
  { href: '/voorwaarden#privacy', labelSleutel: 'site.hero.privacy', icon: ShieldCheck },
]

export default function LiquidHero() {
  const router = useRouter()
  const { t } = useVertaling()
  const [email, setEmail] = useState('')

  const startRegistratie = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const adres = email.trim()
    router.push(adres ? `/register?email=${encodeURIComponent(adres)}` : '/register')
  }

  return (
    <section className="relative flex min-h-screen flex-col overflow-hidden">
      {/* Neuraal deeltjesveld als rustige achtergrond (decoratief) */}
      <HeroField />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `linear-gradient(180deg, ${COLORS.navyDeep}B3 0%, transparent 32%, transparent 62%, ${COLORS.navyDeep}CC 100%)`,
        }}
      />

      {/* Navbar */}
      <header className="relative z-20 px-6 py-6">
        <nav className="liquid-glass mx-auto flex max-w-5xl items-center justify-between rounded-full px-6 py-3">
          <div className="flex items-center">
            <Link href="/" className="flex items-center rounded-full" aria-label={t('site.nav.home')}>
              <Wordmark size={17} compact />
            </Link>
            <div className="ml-8 hidden items-center gap-8 md:flex">
              {NAV_LINKS.map(([href, sleutel]) => (
                <a key={href} href={href} className="text-sm font-medium text-white/80 transition-colors hover:text-white">
                  {t(sleutel)}
                </a>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-white">
              {t('site.nav.inloggen')}
            </Link>
            <Link href="/register" className="liquid-glass rounded-full px-6 py-2 text-sm font-medium text-white">
              {t('site.nav.startGratis')}
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero-content */}
      <div className="relative z-10 flex flex-1 -translate-y-[20%] flex-col items-center justify-center px-6 py-12 text-center">
        <h1 className="whitespace-nowrap text-[clamp(2rem,11vw,4.5rem)] font-medium tracking-tight text-white md:text-8xl lg:text-9xl">
          {metNadruk(t('site.hero.kop'), { className: 'italic', style: { color: COLORS.cyan } })}
        </h1>

        <form onSubmit={startRegistratie} className="liquid-glass mt-10 flex w-full max-w-xl items-center gap-3 rounded-full py-2 pl-6 pr-2">
          <label htmlFor="hero-email" className="sr-only">{t('site.hero.emailLabel')}</label>
          <input
            id="hero-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('site.hero.emailPlaceholder')}
            className="w-full bg-transparent text-white outline-none placeholder:text-white/60"
          />
          <button
            type="submit"
            aria-label={t('site.hero.startMetEmail')}
            className="rounded-full p-3 transition-transform hover:scale-105 active:scale-95"
            style={{ background: COLORS.cyan, color: COLORS.navyDeep }}
          >
            <ArrowRight size={20} aria-hidden />
          </button>
        </form>

        <p className="mt-6 px-4 text-sm leading-relaxed text-white">
          {t('site.hero.intro')}
        </p>

        <a href="#over" className="liquid-glass mt-8 rounded-full px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-white/5">
          {t('site.hero.waarWeVoorStaan')}
        </a>
      </div>

      {/* Snelkoppelingen onderin */}
      <div className="relative z-10 flex justify-center gap-4 pb-12">
        {SOCIALS.map(({ href, labelSleutel, icon: Icon }) =>
          href.startsWith('#') ? (
            <a key={href} href={href} aria-label={t(labelSleutel)} className="liquid-glass rounded-full p-4 text-white/80 transition-all hover:bg-white/5 hover:text-white">
              <Icon size={20} aria-hidden />
            </a>
          ) : (
            <Link key={href} href={href} aria-label={t(labelSleutel)} className="liquid-glass rounded-full p-4 text-white/80 transition-all hover:bg-white/5 hover:text-white">
              <Icon size={20} aria-hidden />
            </Link>
          ),
        )}
      </div>
    </section>
  )
}
