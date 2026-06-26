'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import {
  HeartPulse, Activity, Layers, User, ChevronRight,
  Smile, Moon, Zap, Sun, Shield, Sparkles, GitBranch, FileText, Calendar,
  Dumbbell, Apple, Droplets, Heart, Target,
  Bot, Flag, NotebookPen, Leaf, Wind, TrendingUp, PieChart, Telescope,
  MessageCircle, Trophy, BarChart2, Link2, FileBarChart, Settings,
  HandHeart,
} from 'lucide-react'
import type { CategorieDef } from '@/lib/categorie-nav'
import type { LucideIcon } from 'lucide-react'

const ICOON_MAP: Record<string, LucideIcon> = {
  // categorie
  'heart-pulse':   HeartPulse,
  'activity':      Activity,
  'layers':        Layers,
  'user':          User,
  // welzijn
  'smile':         Smile,
  'moon':          Moon,
  'zap':           Zap,
  'sun':           Sun,
  'shield':        Shield,
  'sparkles':      Sparkles,
  'git-branch':    GitBranch,
  'file-text':     FileText,
  'calendar':      Calendar,
  // actief
  'dumbbell':      Dumbbell,
  'apple':         Apple,
  'droplets':      Droplets,
  'heart':         Heart,
  'target':        Target,
  // groeien
  'bot':           Bot,
  'flag':          Flag,
  'notebook-pen':  NotebookPen,
  'leaf':          Leaf,
  'wind':          Wind,
  'hand-heart':    HandHeart,
  'telescope':     Telescope,
  'trending-up':   TrendingUp,
  'pie-chart':     PieChart,
  // profiel
  'message-circle': MessageCircle,
  'trophy':         Trophy,
  'bar-chart-2':    BarChart2,
  'link':           Link2,
  'file-bar-chart': FileBarChart,
  'settings':       Settings,
}

function Laden() {
  return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh' }}>
      <Navbar />
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

  const Icon = ICOON_MAP[categorie.icoon] ?? Layers

  return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh' }}>
      <Navbar />
      <main style={{ padding: '48px 20px 100px', maxWidth: 560, margin: '0 auto' }}>

        {/* Hero embleem */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 72,
            height: 72,
            borderRadius: 20,
            background: `color-mix(in srgb, ${categorie.kleur} 12%, transparent)`,
            border: `1px solid color-mix(in srgb, ${categorie.kleur} 25%, transparent)`,
            marginBottom: 16,
          }}>
            <Icon
              size={32}
              strokeWidth={1.5}
              style={{ color: categorie.kleur }}
            />
          </div>
          <h1 style={{
            fontSize: 28,
            fontWeight: 700,
            color: 'var(--text-1)',
            letterSpacing: '-0.03em',
            margin: 0,
          }}>
            {categorie.titel}
          </h1>
        </div>

        {/* Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {categorie.items.map((item) => {
            const ItemIcon = item.icoon ? ICOON_MAP[item.icoon] : null
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '13px 16px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  textDecoration: 'none',
                  transition: 'border-color 0.12s, background 0.12s',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLAnchorElement
                  el.style.borderColor = `color-mix(in srgb, ${categorie.kleur} 40%, transparent)`
                  el.style.background = `color-mix(in srgb, ${categorie.kleur} 4%, var(--bg-card))`
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLAnchorElement
                  el.style.borderColor = 'var(--border)'
                  el.style.background = 'var(--bg-card)'
                }}
              >
                {ItemIcon && (
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: `color-mix(in srgb, ${categorie.kleur} 10%, transparent)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <ItemIcon size={15} strokeWidth={1.8} style={{ color: categorie.kleur }} />
                  </div>
                )}
                <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>
                  {item.label}
                </span>
                <ChevronRight size={14} strokeWidth={2} style={{ color: 'var(--text-4)', flexShrink: 0 }} />
              </Link>
            )
          })}
        </div>

      </main>
    </div>
  )
}
