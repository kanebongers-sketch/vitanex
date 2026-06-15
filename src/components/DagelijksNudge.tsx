'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface NudgeItem {
  href: string
  label: string
  beschrijving: string
  kleur: string
  icon: string
  prioriteit: number
}

export default function DagelijksNudge() {
  const [nudges, setNudges] = useState<NudgeItem[]>([])
  const [geladen, setGeladen] = useState(false)

  useEffect(() => {
    async function bepaalNudges() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const vandaag = new Date().toISOString().slice(0, 10)
      const gisterenCutoff = new Date(Date.now() - 86400000).toISOString()
      const weekCutoff = new Date(Date.now() - 7 * 86400000).toISOString()

      const [
        { count: ciVandaag },
        { count: stemmingVandaag },
        { count: slaapWeek },
        { count: stressWeek },
        { count: dankbaarheidWeek },
        { count: journalWeek },
      ] = await Promise.all([
        supabase.from('checkin_sessies').select('id', { count: 'exact', head: true })
          .eq('user_id', user.id).gte('aangemaakt_op', `${vandaag}T00:00:00Z`),
        supabase.from('stemming_logs').select('id', { count: 'exact', head: true })
          .eq('user_id', user.id).gte('aangemaakt_op', `${vandaag}T00:00:00Z`),
        supabase.from('slaap_logs').select('id', { count: 'exact', head: true })
          .eq('user_id', user.id).gte('datum', weekCutoff.slice(0, 10)),
        supabase.from('stress_logs').select('id', { count: 'exact', head: true })
          .eq('user_id', user.id).gte('aangemaakt_op', weekCutoff),
        supabase.from('dankbaarheid_logs').select('id', { count: 'exact', head: true })
          .eq('user_id', user.id).gte('aangemaakt_op', weekCutoff),
        supabase.from('journal_entries').select('id', { count: 'exact', head: true })
          .eq('user_id', user.id).gte('aangemaakt_op', weekCutoff),
      ])

      const items: NudgeItem[] = []

      if (!ciVandaag) {
        items.push({
          href: '/checkin',
          label: 'Check-in doen',
          beschrijving: 'Je hebt vandaag nog geen check-in gedaan',
          kleur: '#1D9E75',
          icon: '✅',
          prioriteit: 10,
        })
      }

      if (!stemmingVandaag) {
        items.push({
          href: '/stemming',
          label: 'Stemming loggen',
          beschrijving: 'Hoe voel je je vandaag?',
          kleur: '#F59E0B',
          icon: '😊',
          prioriteit: 8,
        })
      }

      if ((slaapWeek ?? 0) < 3) {
        items.push({
          href: '/slaap',
          label: 'Slaap bijhouden',
          beschrijving: 'Je hebt deze week nog weinig slaap gelogd',
          kleur: '#8B5CF6',
          icon: '😴',
          prioriteit: 6,
        })
      }

      if ((stressWeek ?? 0) === 0) {
        items.push({
          href: '/stress',
          label: 'Stressniveau meten',
          beschrijving: 'Hoe hoog is jouw stress deze week?',
          kleur: '#E24B4A',
          icon: '🌊',
          prioriteit: 5,
        })
      }

      if ((dankbaarheidWeek ?? 0) < 2) {
        items.push({
          href: '/dankbaarheid',
          label: 'Dankbaarheid',
          beschrijving: 'Schrijf iets op waar je dankbaar voor bent',
          kleur: '#EC4899',
          icon: '💚',
          prioriteit: 4,
        })
      }

      if ((journalWeek ?? 0) === 0) {
        items.push({
          href: '/journal',
          label: 'Journal schrijven',
          beschrijving: 'Reflecteer op jouw week',
          kleur: '#6366f1',
          icon: '📖',
          prioriteit: 3,
        })
      }

      items.sort((a, b) => b.prioriteit - a.prioriteit)
      setNudges(items.slice(0, 3))
      setGeladen(true)
    }
    bepaalNudges()
  }, [])

  if (!geladen || nudges.length === 0) return null

  return (
    <div style={{ marginBottom: 20 }}>
      <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: 10 }}>
        Nog te doen vandaag
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {nudges.map(nudge => (
          <Link key={nudge.href} href={nudge.href} style={{
            textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12,
            background: 'white', borderRadius: 14, padding: '12px 16px',
            border: `1px solid ${nudge.kleur}20`,
          }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>{nudge.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{nudge.label}</p>
              <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{nudge.beschrijving}</p>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={nudge.kleur} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </Link>
        ))}
      </div>
    </div>
  )
}
