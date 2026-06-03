'use client'

import { useState } from 'react'

type Props = {
  hrCode: string
  onTabSwitch: (tab: string) => void
  onNieuwMedewerker: () => void
}

export default function HRSnelkoppelingen({ hrCode, onTabSwitch, onNieuwMedewerker }: Props) {
  const [gekopieerd, setGekopieerd] = useState(false)

  function kopieerCode() {
    navigator.clipboard.writeText(hrCode).then(() => {
      setGekopieerd(true)
      setTimeout(() => setGekopieerd(false), 2000)
    })
  }

  const acties: {
    icon: string
    label: string
    sub: string
    onClick: () => void
    color: string
    bg: string
  }[] = [
    {
      icon: '💬',
      label: 'Nieuw gesprek',
      sub: 'Plannen',
      onClick: () => onTabSwitch('gesprekken'),
      color: '#185FA5',
      bg: '#E6F1FB',
    },
    {
      icon: '🔔',
      label: 'Herinnering',
      sub: 'Stuur naar team',
      onClick: () => onTabSwitch('team'),
      color: '#BA7517',
      bg: '#FAEEDA',
    },
    {
      icon: '👤',
      label: 'Medewerker uitnodigen',
      sub: 'Voeg lid toe',
      onClick: onNieuwMedewerker,
      color: '#8B5CF6',
      bg: '#EDE9FE',
    },
    {
      icon: '🔑',
      label: hrCode ? `Code: ${hrCode}` : 'HR Code',
      sub: gekopieerd ? 'Gekopieerd!' : 'Klik om te kopieren',
      onClick: kopieerCode,
      color: '#1D9E75',
      bg: '#E1F5EE',
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {acties.map(actie => (
        <button
          key={actie.label}
          onClick={actie.onClick}
          className="rounded-2xl p-4 text-left transition hover:opacity-80 active:scale-95"
          style={{ background: actie.bg, border: `1px solid ${actie.color}20` }}
        >
          <span className="text-2xl block mb-2">{actie.icon}</span>
          <p className="text-sm font-semibold truncate" style={{ color: actie.color }}>{actie.label}</p>
          <p className="text-xs mt-0.5" style={{ color: actie.color, opacity: 0.7 }}>{actie.sub}</p>
        </button>
      ))}
    </div>
  )
}
