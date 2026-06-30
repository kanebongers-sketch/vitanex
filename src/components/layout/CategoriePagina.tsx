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
  // De categorie-kleur komt altijd als token binnen (var(--mf-*)); we mengen
  // hem via color-mix met tokens, nooit met hardcoded hex of var()+hex-alpha.
  const accentVars = {
    '--cat-kleur': categorie.kleur,
    '--cat-zacht': `color-mix(in srgb, ${categorie.kleur} 12%, transparent)`,
    '--cat-rand': `color-mix(in srgb, ${categorie.kleur} 25%, transparent)`,
    '--cat-icoon-bg': `color-mix(in srgb, ${categorie.kleur} 10%, transparent)`,
    '--cat-hover-rand': `color-mix(in srgb, ${categorie.kleur} 40%, transparent)`,
    '--cat-hover-bg': `color-mix(in srgb, ${categorie.kleur} 4%, var(--bg-card))`,
  } as React.CSSProperties

  return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh' }}>
      <Navbar />
      <main className="mf-cat-page" style={{ padding: '48px 20px 100px', maxWidth: 560, margin: '0 auto', ...accentVars }}>

        {/* Hero embleem */}
        <header style={{ textAlign: 'center', marginBottom: 40 }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 72,
            height: 72,
            borderRadius: 'var(--radius-xl)',
            background: 'var(--cat-zacht)',
            border: '1px solid var(--cat-rand)',
            marginBottom: 16,
          }}>
            <Icon
              size={32}
              strokeWidth={1.5}
              style={{ color: 'var(--cat-kleur)' }}
              aria-hidden
            />
          </span>
          <h1 style={{
            fontSize: 28,
            fontWeight: 700,
            color: 'var(--text-1)',
            letterSpacing: '-0.03em',
            margin: 0,
          }}>
            {categorie.titel}
          </h1>
        </header>

        {/* Items */}
        <nav aria-label={categorie.titel} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {categorie.items.map((item) => {
            const ItemIcon = item.icoon ? ICOON_MAP[item.icoon] : null
            return (
              <Link
                key={item.href}
                href={item.href}
                className="mf-cat-item"
              >
                {ItemIcon && (
                  <span className="mf-cat-item-icoon" aria-hidden>
                    <ItemIcon size={15} strokeWidth={1.8} style={{ color: 'var(--cat-kleur)' }} />
                  </span>
                )}
                <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>
                  {item.label}
                </span>
                <ChevronRight size={14} strokeWidth={2} style={{ color: 'var(--text-4)', flexShrink: 0 }} aria-hidden />
              </Link>
            )
          })}
        </nav>

        <style>{`
          .mf-cat-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 13px 16px;
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: var(--radius-card);
            text-decoration: none;
            transition: border-color 0.12s var(--ease), background 0.12s var(--ease);
          }
          .mf-cat-item:hover {
            border-color: var(--cat-hover-rand);
            background: var(--cat-hover-bg);
          }
          .mf-cat-item:focus-visible {
            outline: 2px solid var(--cat-kleur);
            outline-offset: 2px;
          }
          .mf-cat-item-icoon {
            width: 32px;
            height: 32px;
            border-radius: var(--radius-sm);
            background: var(--cat-icoon-bg);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }
        `}</style>
      </main>
    </div>
  )
}
