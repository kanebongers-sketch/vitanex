'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Bot, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { useVertaling } from '@/lib/i18n/TaalProvider'

interface Props {
  categorie: string
  apiUrl: string
  linkUrl: string
  linkLabel: string
}

export default function AiCoachCard({ categorie, apiUrl, linkUrl, linkLabel }: Props) {
  const [advies, setAdvies] = useState<string | null>(null)
  const [laden, setLaden] = useState(false)
  const { toast } = useToast()
  const { t, taal } = useVertaling()
  const naam = categorie.charAt(0).toUpperCase() + categorie.slice(1)

  async function laadAdvies() {
    if (advies || laden) return
    setLaden(true)
    try {
      const res = await fetch(apiUrl, { method: 'POST' })
      const data = await res.json() as { advies?: string; error?: string }
      const serverFout = taal === 'nl' ? data.error : undefined
      const tekst = data.advies ?? serverFout ?? t('lichaam.aiCoach.geenAdviesTekst')
      setAdvies(tekst)
      if (!data.advies) {
        toast({ title: t('lichaam.aiCoach.geenAdvies'), description: serverFout ?? t('lichaam.aiCoach.later'), variant: 'warning' })
      }
    } catch {
      const tekst = t('lichaam.aiCoach.nietBereiktTekst')
      setAdvies(tekst)
      toast({ title: t('lichaam.aiCoach.nietBereikt'), description: t('lichaam.aiCoach.verbinding'), variant: 'error' })
    } finally {
      setLaden(false)
    }
  }

  return (
    <section
      aria-label={t('lichaam.aiCoach.titel', { naam: categorie })}
      style={{
        background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-subtle) 100%)',
        border: '1px solid var(--border-strong)',
        borderRadius: 'var(--radius-xl)',
        padding: '20px 20px 16px',
        marginBottom: 16,
        color: 'var(--text-1)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0, opacity: 0.5, pointerEvents: 'none',
        background: 'radial-gradient(circle at 90% 0%, color-mix(in srgb, var(--mentaforce-primary) 14%, transparent) 0%, transparent 55%)',
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, position: 'relative' }}>
        <div aria-hidden="true" style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: 'var(--mf-green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--mentaforce-primary)' }}>
          <Bot size={18} />
        </div>
        <div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: 'var(--text-1)' }}>{t('lichaam.aiCoach.titel', { naam })}</p>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-3)' }}>{t('lichaam.aiCoach.sub')}</p>
        </div>
      </div>

      {!advies && !laden && (
        <Button onClick={laadAdvies} variant="primary" style={{ position: 'relative', width: '100%' }}>
          {t('lichaam.aiCoach.genereer')}
        </Button>
      )}

      {laden && (
        <div style={{ textAlign: 'center', padding: '10px 0', color: 'var(--text-3)', fontSize: 14, position: 'relative' }}>
          {t('lichaam.aiCoach.bezig')}
        </div>
      )}

      {advies && (
        <div style={{ position: 'relative' }}>
          <p style={{ margin: '0 0 12px', fontSize: 14, lineHeight: 1.6, color: 'var(--text-2)' }}>{advies}</p>
          <Link
            href={linkUrl}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-btn)',
              color: 'var(--text-1)',
              padding: '8px 14px',
              fontSize: 13,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            {linkLabel}
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
      )}
    </section>
  )
}
