'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MessageSquarePlus, Bell, UserPlus, KeyRound, Brain, type LucideIcon } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { useVertaling } from '@/lib/i18n/TaalProvider'

type Props = {
  hrCode: string
  onTabSwitch: (tab: string) => void
  onNieuwMedewerker: () => void
}

type ActieBase = {
  icon: LucideIcon
  label: string
  sub: string
}

export default function HRSnelkoppelingen({ hrCode, onTabSwitch, onNieuwMedewerker }: Props) {
  const { toast } = useToast()
  const { t } = useVertaling()
  const [gekopieerd, setGekopieerd] = useState(false)

  async function kopieerCode() {
    try {
      await navigator.clipboard.writeText(hrCode)
      setGekopieerd(true)
      toast({ title: t('werk.hrSnel.codeGekopieerd'), description: hrCode, variant: 'success' })
      setTimeout(() => setGekopieerd(false), 2000)
    } catch {
      toast({
        title: t('werk.hrSnel.kopierenMislukt'),
        description: t('werk.hrSnel.kopieerHandmatig'),
        variant: 'error',
      })
    }
  }

  const acties: (ActieBase & { onClick: () => void })[] = [
    {
      icon: MessageSquarePlus,
      label: t('werk.hrSnel.nieuwGesprek'),
      sub: t('werk.hrSnel.plannen'),
      onClick: () => onTabSwitch('gesprekken'),
    },
    {
      icon: Bell,
      label: t('werk.hrSnel.herinnering'),
      sub: t('werk.hrSnel.stuurNaarTeam'),
      onClick: () => onTabSwitch('team'),
    },
    {
      icon: UserPlus,
      label: t('werk.hrSnel.medewerkerUitnodigen'),
      sub: t('werk.hrSnel.voegLidToe'),
      onClick: onNieuwMedewerker,
    },
    {
      icon: KeyRound,
      label: hrCode ? t('werk.hrSnel.codeLabel', { code: hrCode }) : t('werk.hrSnel.hrCode'),
      sub: gekopieerd ? t('werk.hrSnel.gekopieerd') : t('werk.hrSnel.klikKopieren'),
      onClick: kopieerCode,
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
      {acties.map(actie => {
        const Icon = actie.icon
        return (
          <button
            key={actie.label}
            onClick={actie.onClick}
            className="mf-snelkop"
            style={cardStyle}
          >
            <Icon size={22} aria-hidden style={{ color: 'var(--mentaforce-primary)', marginBottom: 8 }} />
            <p style={labelStyle}>{actie.label}</p>
            <p style={subStyle}>{actie.sub}</p>
          </button>
        )
      })}
      <Link href="/disc" className="mf-snelkop" style={{ ...cardStyle, textDecoration: 'none', display: 'block' }}>
        <Brain size={22} aria-hidden style={{ color: 'var(--mentaforce-primary)', marginBottom: 8 }} />
        <p style={labelStyle}>{t('werk.hrSnel.discDoen')}</p>
        <p style={subStyle}>{t('werk.hrSnel.eigenProfiel')}</p>
      </Link>

      <style>{`
        .mf-snelkop {
          transition: border-color 0.15s var(--ease), background 0.15s var(--ease), transform 0.1s var(--ease);
        }
        .mf-snelkop:hover {
          border-color: var(--border-strong);
          background: var(--bg-subtle);
        }
        .mf-snelkop:active { transform: scale(0.97); }
        .mf-snelkop:focus-visible {
          outline: 2px solid var(--mentaforce-primary);
          outline-offset: 2px;
        }
        @media (prefers-reduced-motion: reduce) {
          .mf-snelkop, .mf-snelkop:active { transition: none; transform: none; }
        }
      `}</style>
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-card)',
  boxShadow: 'var(--shadow-card)',
  padding: 16,
  textAlign: 'left',
  cursor: 'pointer',
}

const labelStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--text-1)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const subStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--text-3)',
  marginTop: 2,
}
