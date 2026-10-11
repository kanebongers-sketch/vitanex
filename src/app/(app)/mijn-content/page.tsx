'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth/auth-fetch'
import { Card } from '@/components/ui/Card'
import { ContentKaart } from '@/components/coaching/ContentKaart'
import { CoachHeader, CoachEmpty, CoachSkeleton } from '@/components/coaching/CoachChrome'
import { PIJLER_STIJL, type CoachingContent, type ContentType } from '@/lib/coaching/content'
import { PIJLER_ICOON, CONTENT_TYPE_ICOON } from '@/components/coaching/content-iconen'
import { ArrowLeft, BookOpen, ExternalLink } from 'lucide-react'
import { useVertaling } from '@/lib/i18n/TaalProvider'
import { INTL_LOCALE, type Taal } from '@/lib/i18n/talen'

// Sleutels onder coaching.mijnContent.media.*
const MEDIA_LABEL: Record<ContentType, 'link' | 'audio' | 'video'> = {
  artikel: 'link', opdracht: 'link', audio: 'audio', video: 'video',
}

function datumLang(iso: string, taal: Taal): string {
  return new Date(iso).toLocaleDateString(INTL_LOCALE[taal], { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function MijnContentPagina() {
  const { t } = useVertaling()
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
    <div className="mf-mesh-bg" style={{ minHeight: '100vh' }}>
      <Navbar />
      <main className="mf-page-main" style={{ padding: '40px 40px 80px', maxWidth: 720, margin: '0 auto' }}>

        {geselecteerd ? (
          <DetailWeergave content={geselecteerd} onTerug={() => setGeselecteerd(null)} />
        ) : (
          <>
            <CoachHeader
              eyebrow={t('coaching.tabs.mindset')}
              titel={t('coaching.mijnContent.titel')}
              subtitel={t('coaching.mijnContent.subtitel')}
            />

            {laden ? (
              <CoachSkeleton rijen={3} />
            ) : lijst.length === 0 ? (
              <CoachEmpty
                icon={BookOpen}
                titel={t('coaching.mijnContent.leegTitel')}
                tekst={t('coaching.mijnContent.leegTekst')}
              />
            ) : (
              <section aria-label={t('coaching.mijnContent.lijstAria')} className="mf-coach-stagger" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
  const { t, taal } = useVertaling()
  const stijl = PIJLER_STIJL[content.pijler]
  const PijlerIcoon = PIJLER_ICOON[content.pijler]
  const TypeIcoon = CONTENT_TYPE_ICOON[content.type]

  return (
    <article className="mf-animate-up">
      <button
        type="button"
        onClick={onTerug}
        className="mf-coach-back"
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        <ArrowLeft size={15} aria-hidden /> {t('coaching.mijnContent.terug')}
      </button>

      <header style={{ position: 'relative', marginBottom: 24 }}>
        <span className="mf-coach-aura" aria-hidden style={{ top: -150, left: -120 }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600,
              padding: '4px 10px', borderRadius: 100, background: stijl.bg, color: stijl.color,
            }}>
              <PijlerIcoon size={13} aria-hidden /> {t(`coaching.labels.pijler.${content.pijler}`)}
            </span>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600,
              padding: '4px 10px', borderRadius: 100, background: 'var(--bg-subtle)', color: 'var(--text-3)',
              border: '1px solid var(--border-strong)',
            }}>
              <TypeIcoon size={13} aria-hidden /> {t(`coaching.labels.contentType.${content.type}`)}
            </span>
          </div>

          <h1 className="mf-h1" style={{ fontSize: 'clamp(22px, 4vw, 28px)', lineHeight: 1.2 }}>
            {content.titel}
          </h1>
          <p className="mf-caption" style={{ marginTop: 8 }}>
            {t('coaching.mijnContent.geplaatst', { datum: datumLang(content.aangemaakt_op, taal) })}
          </p>
        </div>
      </header>

      <Card className="mf-animate-up mf-delay-1" style={{ padding: '26px 28px' }}>
        <div style={{ fontSize: 15, lineHeight: 1.75, color: 'var(--text-1)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {content.inhoud}
        </div>

        {content.media_url && (
          <a
            href={content.media_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mf-lift"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 22, padding: '10px 16px',
              fontSize: 14, fontWeight: 600, textDecoration: 'none', borderRadius: 'var(--radius-btn)',
              background: 'var(--mf-green-light)', color: 'var(--mf-green)',
              border: '1px solid color-mix(in srgb, var(--mf-green) 45%, transparent)',
            }}
          >
            <ExternalLink size={15} aria-hidden /> {t(`coaching.mijnContent.media.${MEDIA_LABEL[content.type]}`)}
          </a>
        )}
      </Card>
    </article>
  )
}
