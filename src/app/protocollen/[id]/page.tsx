'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'

type Protocol = {
  id: string
  titel: string
  beschrijving: string | null
  inhoud: string
  categorie: string
  icoon: string
  kleur: string
  gepubliceerd: boolean
  aangemaakt_op: string
  bijgewerkt_op: string
}

const CAT_LABELS: Record<string, string> = {
  algemeen: 'Algemeen', arbo: 'Arbo & Veiligheid', verzuim: 'Verzuim',
  it: 'IT & Systemen', hr: 'HR & Onboarding', veiligheid: 'Veiligheid', overig: 'Overig',
}

// Simple markdown-to-HTML renderer (headings, bold, bullets, paragraphs)
function renderMarkdown(md: string): string {
  return md
    .split('\n')
    .map(line => {
      if (line.startsWith('# '))  return `<h1 class="mf-md-h1">${line.slice(2)}</h1>`
      if (line.startsWith('## ')) return `<h2 class="mf-md-h2">${line.slice(3)}</h2>`
      if (line.startsWith('### '))return `<h3 class="mf-md-h3">${line.slice(4)}</h3>`
      if (line.startsWith('- '))  return `<li class="mf-md-li">${line.slice(2).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}</li>`
      if (line.startsWith('1. ') || /^\d+\. /.test(line)) {
        return `<li class="mf-md-li mf-md-ol">${line.replace(/^\d+\. /, '').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}</li>`
      }
      if (line.trim() === '') return '<br />'
      return `<p class="mf-md-p">${line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}</p>`
    })
    .join('\n')
}

export default function ProtocolDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string

  const [protocol, setProtocol] = useState<Protocol | null>(null)
  const [laden, setLaden] = useState(true)
  const [isHr, setIsHr] = useState(false)

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profiel } = await supabase
        .from('profiles').select('bedrijf_id, rol').eq('id', user.id).single()
      setIsHr(profiel?.rol === 'hr' || profiel?.rol === 'admin')

      const { data } = await supabase
        .from('protocollen').select('*').eq('id', id).single()

      if (!data || data.bedrijf_id !== profiel?.bedrijf_id) {
        router.push('/protocollen'); return
      }
      setProtocol(data as Protocol)
      setLaden(false)
    }
    laad()
  }, [router, id])

  if (laden) return (
    <div className="min-h-screen" style={{ background: 'var(--bg-app)' }}>
      <Navbar />
      <main className="flex justify-center mt-20"><div className="mf-spinner" /></main>
    </div>
  )

  if (!protocol) return null

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-app)' }}>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-6 mf-safe-bottom">

        {/* Terug */}
        <Link href="/protocollen" className="inline-flex items-center gap-1.5 text-sm mb-5"
          style={{ color: 'var(--text-3)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Terug naar protocollen
        </Link>

        {/* Header kaart */}
        <div className="rounded-2xl p-5 mb-5"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
              style={{ background: protocol.kleur + '18' }}>
              {protocol.icoon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <h1 className="text-lg font-bold leading-snug" style={{ color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
                  {protocol.titel}
                </h1>
                {isHr && (
                  <Link href={`/hr/protocollen/${protocol.id}/bewerken`}
                    className="mf-btn flex-shrink-0 text-xs"
                    style={{ padding: '6px 12px', background: 'var(--bg-subtle)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
                    Bewerken
                  </Link>
                )}
              </div>
              {protocol.beschrijving && (
                <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>{protocol.beschrijving}</p>
              )}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                  style={{ background: protocol.kleur + '18', color: protocol.kleur }}>
                  {CAT_LABELS[protocol.categorie] ?? protocol.categorie}
                </span>
                {isHr && !protocol.gepubliceerd && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                    style={{ background: 'var(--mf-amber-light)', color: 'var(--mf-amber-dark)' }}>Concept</span>
                )}
                <span className="text-[11px]" style={{ color: 'var(--text-4)' }}>
                  Bijgewerkt {new Date(protocol.bijgewerkt_op).toLocaleDateString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Inhoud */}
        <div className="rounded-2xl p-5"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}>
          <style>{`
            .mf-md-h1 { font-size: 1.1rem; font-weight: 700; color: var(--text-1); margin-bottom: 12px; margin-top: 4px; letter-spacing: -0.02em; }
            .mf-md-h2 { font-size: 0.95rem; font-weight: 700; color: var(--text-1); margin-bottom: 8px; margin-top: 20px; }
            .mf-md-h3 { font-size: 0.875rem; font-weight: 600; color: var(--text-2); margin-bottom: 6px; margin-top: 16px; }
            .mf-md-p  { font-size: 0.875rem; color: var(--text-2); line-height: 1.65; margin-bottom: 6px; }
            .mf-md-li { font-size: 0.875rem; color: var(--text-2); line-height: 1.65; margin-bottom: 4px; padding-left: 16px; position: relative; }
            .mf-md-li::before { content: '•'; position: absolute; left: 4px; color: var(--mf-green); font-weight: 700; }
            .mf-md-ol::before { content: '→'; }
          `}</style>
          <div dangerouslySetInnerHTML={{ __html: renderMarkdown(protocol.inhoud) }} />
        </div>

      </main>
    </div>
  )
}
