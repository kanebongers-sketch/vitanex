'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MessageSquarePlus, Bell, UserPlus, KeyRound, Brain, type LucideIcon } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

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
  const [gekopieerd, setGekopieerd] = useState(false)

  async function kopieerCode() {
    try {
      await navigator.clipboard.writeText(hrCode)
      setGekopieerd(true)
      toast({ title: 'HR-code gekopieerd', description: hrCode, variant: 'success' })
      setTimeout(() => setGekopieerd(false), 2000)
    } catch {
      toast({
        title: 'Kopiëren mislukt',
        description: 'Kopieer de code handmatig.',
        variant: 'error',
      })
    }
  }

  const acties: (ActieBase & { onClick: () => void })[] = [
    {
      icon: MessageSquarePlus,
      label: 'Nieuw gesprek',
      sub: 'Plannen',
      onClick: () => onTabSwitch('gesprekken'),
    },
    {
      icon: Bell,
      label: 'Herinnering',
      sub: 'Stuur naar team',
      onClick: () => onTabSwitch('team'),
    },
    {
      icon: UserPlus,
      label: 'Medewerker uitnodigen',
      sub: 'Voeg lid toe',
      onClick: onNieuwMedewerker,
    },
    {
      icon: KeyRound,
      label: hrCode ? `Code: ${hrCode}` : 'HR Code',
      sub: gekopieerd ? 'Gekopieerd!' : 'Klik om te kopiëren',
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
        <p style={labelStyle}>DISC doen</p>
        <p style={subStyle}>Eigen profiel</p>
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
