'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'

type HrSectie = {
  icon: string
  titel: string
  beschrijving: string
  href: string
  kleur: string
  bg: string
}

const HR_SECTIES: HrSectie[] = [
  {
    icon: '🏠',
    titel: 'Portaal inrichten',
    beschrijving: 'Kies welke tegels zichtbaar zijn en in welke volgorde',
    href: '/hr/portaal',
    kleur: '#1D9E75',
    bg: '#E1F5EE',
  },
  {
    icon: '📋',
    titel: 'Protocollen beheren',
    beschrijving: 'Voeg beleid en procedures toe, bewerk of verberg ze',
    href: '/hr/protocollen',
    kleur: '#92400E',
    bg: '#FEF3C7',
  },
  {
    icon: '📰',
    titel: 'Nieuws plaatsen',
    beschrijving: 'Bedrijfsberichten en aankondigingen publiceren',
    href: '/nieuws',
    kleur: '#1D4ED8',
    bg: '#EFF6FF',
  },
  {
    icon: '🌴',
    titel: 'Verlof beheren',
    beschrijving: 'Verlofaanvragen van medewerkers goedkeuren of afwijzen',
    href: '/verlof',
    kleur: '#0F6E56',
    bg: '#D1FAE5',
  },
  {
    icon: '📈',
    titel: 'Team dashboard',
    beschrijving: 'Vitaliteitsoverzicht van het hele team',
    href: '/team',
    kleur: '#0369A1',
    bg: '#E0F2FE',
  },
  {
    icon: '💶',
    titel: 'Loonstroken uploaden',
    beschrijving: 'Salarisstroken beschikbaar stellen voor medewerkers',
    href: '/loonstroken',
    kleur: '#065F46',
    bg: '#ECFDF5',
  },
]

export default function HrHubPage() {
  const router = useRouter()
  const [naam, setNaam] = useState('')
  const [geladen, setGeladen] = useState(false)

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: profiel } = await supabase
        .from('profiles').select('naam, rol').eq('id', user.id).single()
      if (!profiel || !['hr', 'admin'].includes(profiel.rol ?? '')) {
        router.push('/home'); return
      }
      setNaam(profiel.naam ?? 'HR')
      setGeladen(true)
    }
    check()
  }, [router])

  if (!geladen) return (
    <div className="min-h-screen" style={{ background: 'var(--bg-app)' }}>
      <Navbar /><main className="flex justify-center mt-20"><div className="mf-spinner" /></main>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-app)' }}>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-6 mf-safe-bottom">

        {/* Header */}
        <div className="mb-6">
          <p className="text-sm mb-0.5" style={{ color: 'var(--text-3)' }}>Goedendag, {naam.split(' ')[0]}</p>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-1)', letterSpacing: '-0.03em' }}>
            HR Beheer
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>
            Richt het portaal in en beheer content voor je medewerkers.
          </p>
        </div>

        {/* Secties grid */}
        <div className="flex flex-col gap-3">
          {HR_SECTIES.map(s => (
            <Link
              key={s.href}
              href={s.href}
              className="flex items-center gap-4 rounded-2xl p-4 transition active:scale-[0.99]"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: s.bg }}>
                {s.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{s.titel}</p>
                <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--text-3)' }}>{s.beschrijving}</p>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="var(--text-4)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          ))}
        </div>

        {/* Terug naar portaal */}
        <div className="mt-6">
          <Link href="/home" className="flex items-center justify-center gap-2 text-sm"
            style={{ color: 'var(--text-4)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Terug naar hoofdpagina
          </Link>
        </div>
      </main>
    </div>
  )
}
