'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import { getPageGuide } from '@/lib/vita/page-guide'
import type { CategorieDef } from '@/lib/categorie-nav'

function Laden() {
  return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh' }}>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
        <div className="mf-spinner" />
      </div>
    </div>
  )
}

export default function CategoriePagina({ categorie }: { categorie: CategorieDef }) {
  const router = useRouter()
  const [klaar, setKlaar] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace('/login'); return }
      setKlaar(true)
    })
  }, [router])

  if (!klaar) return <Laden />

  return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh' }}>
      <Navbar />
      <main style={{ padding: '36px 20px 88px', maxWidth: 900, margin: '0 auto' }}>

        <header style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{
            width: 10, height: 36, borderRadius: 6, background: categorie.kleur, flexShrink: 0,
          }} />
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', margin: 0 }}>
              {categorie.titel}
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-3)', marginTop: 3 }}>{categorie.intro}</p>
          </div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
          {categorie.items.map((item) => {
            const guide = getPageGuide(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  padding: '16px 16px 14px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 16,
                  textDecoration: 'none',
                  position: 'relative',
                  transition: 'border-color 0.15s ease, transform 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLAnchorElement
                  el.style.borderColor = categorie.kleur
                  el.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLAnchorElement
                  el.style.borderColor = 'var(--border)'
                  el.style.transform = 'translateY(0)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>{item.label}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={categorie.kleur} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
                {guide?.uitleg && (
                  <span style={{ fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.5 }}>
                    {guide.uitleg}
                  </span>
                )}
              </Link>
            )
          })}
        </div>

      </main>
    </div>
  )
}
