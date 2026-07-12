'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth/auth-fetch'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { ContentKaart } from '@/components/coaching/ContentKaart'
import {
  PIJLER_LABELS,
  PIJLER_STIJL,
  CONTENT_TYPE_LABELS,
  type CoachingContent,
  type ContentType,
} from '@/lib/coaching/content'
import { PIJLER_ICOON, CONTENT_TYPE_ICOON } from '@/components/coaching/content-iconen'
import { ArrowLeft, BookOpen, ExternalLink } from 'lucide-react'

const MEDIA_LABEL: Record<ContentType, string> = {
  artikel: 'Open link', opdracht: 'Open link', audio: 'Beluister audio', video: 'Bekijk video',
}

function datumLang(iso: string): string {
  return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function MijnContentPagina() {
  const router = useRouter()
  const [laden, setLaden] = useState(true)
  const [lijst, setLijst] = useState<CoachingContent[]>([])
  const [geselecteerd, setGeselecteerd] = useState<CoachingContent | null>(null)

  const laadContent = useCallback(async () => {
    const res = await authFetch('/api/coaching/mijn-content')
    if (res.ok) {
      const data = await res.json() as { content: CoachingContent[] }
      setLijst(data.content ?? [])
    }
    setLaden(false)
  }, [])

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      await laadContent()
    }
    laad()
  }, [router, laadContent])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '32px 40px 72px', maxWidth: 720, margin: '0 auto' }}>

        {geselecteerd ? (
          <DetailWeergave content={geselecteerd} onTerug={() => setGeselecteerd(null)} />
        ) : (
          <>
            <header style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', marginBottom: 4 }}>
                Van je coach
              </h1>
              <p style={{ fontSize: 13, color: 'var(--text-3)' }}>
                Mindset- en stress-lessen en -opdrachten die je coach voor je heeft klaargezet.
              </p>
            </header>

            {laden ? (
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}><div className="mf-spinner" /></div>
            ) : lijst.length === 0 ? (
              <Card style={{ padding: 8 }}>
                <EmptyState
                  icon={BookOpen}
                  title="Nog niets ontvangen"
                  description="Zodra je coach een les of opdracht publiceert, verschijnt die hier om te lezen."
                />
              </Card>
            ) : (
              <section aria-label="Content van je coach" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {lijst.map(c => (
                  <ContentKaart key={c.id} content={c} onOpen={() => setGeselecteerd(c)} />
                ))}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  )
}

interface DetailWeergaveProps {
  content: CoachingContent
  onTerug: () => void
}

function DetailWeergave({ content, onTerug }: DetailWeergaveProps) {
  const stijl = PIJLER_STIJL[content.pijler]
  const PijlerIcoon = PIJLER_ICOON[content.pijler]
  const TypeIcoon = CONTENT_TYPE_ICOON[content.type]

  return (
    <article>
      <button
        type="button"
        onClick={onTerug}
        className="mf-pressable"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-3)',
          background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 20,
          borderRadius: 'var(--radius-sm)',
        }}
      >
        <ArrowLeft size={15} aria-hidden /> Terug naar overzicht
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600,
          padding: '4px 10px', borderRadius: 100, background: stijl.bg, color: stijl.color,
        }}>
          <PijlerIcoon size={13} aria-hidden /> {PIJLER_LABELS[content.pijler]}
        </span>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600,
          padding: '4px 10px', borderRadius: 100, background: 'var(--bg-subtle)', color: 'var(--text-3)',
          border: '1px solid var(--border-strong)',
        }}>
          <TypeIcoon size={13} aria-hidden /> {CONTENT_TYPE_LABELS[content.type]}
        </span>
      </div>

      <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', lineHeight: 1.2 }}>
        {content.titel}
      </h1>
      <p style={{ fontSize: 12, color: 'var(--text-4)', marginTop: 6, marginBottom: 20 }}>
        Geplaatst op {datumLang(content.aangemaakt_op)}
      </p>

      <Card style={{ padding: '24px 26px' }}>
        <div style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--text-1)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {content.inhoud}
        </div>

        {content.media_url && (
          <a
            href={content.media_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mf-pressable"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 20, padding: '10px 16px',
              fontSize: 14, fontWeight: 600, textDecoration: 'none', borderRadius: 'var(--radius-btn)',
              background: 'var(--mentaforce-primary-light)', color: 'var(--mentaforce-primary)',
              border: '1px solid var(--mentaforce-primary)',
            }}
          >
            <ExternalLink size={15} aria-hidden /> {MEDIA_LABEL[content.type]}
          </a>
        )}
      </Card>
    </article>
  )
}
