'use client'

import { useState } from 'react'

export type WaterfallData = {
  kern_boodschap: string
  virale_hook: string
  carousels: Array<{
    titel: string
    doel: string
    slides: Array<{ nr: number; type: string; tekst: string; visueel: string }>
    caption: string
    hashtags: string[]
    cta: string
  }>
  reels: Array<{
    titel: string
    duur_sec: number
    hook: string
    script: string
    shots: string[]
    caption: string
    hashtags: string[]
  }>
  stories: Array<{
    nr: number
    type: string
    tekst: string
    visueel: string
  }>
  hashtag_strategie: {
    niche: string[]
    medium: string[]
    breed: string[]
    caption_template: string
  }
  postplan: {
    beste_dag: string
    beste_tijd: string
    volgorde: string
    tip: string
  }
}

const TABS = [
  { key: 'carousels', label: '🎠 Carousels' },
  { key: 'reels', label: '🎬 Reels' },
  { key: 'stories', label: '📱 Stories' },
  { key: 'hashtags', label: '# Hashtags' },
  { key: 'postplan', label: '📅 Postplan' },
]

const SLIDE_KLEUR: Record<string, string> = {
  hook: 'var(--mf-red)',
  probleem: 'var(--mf-amber)',
  waarom: 'var(--mf-purple)',
  oplossing: 'var(--mf-green)',
  samenvatting: 'var(--mf-blue)',
  cta: 'var(--mf-green)',
  tip: 'var(--mf-green)',
  bewijs: 'var(--mf-blue)',
  mythe: 'var(--mf-red)',
}

const STORY_KLEUR: Record<string, string> = {
  hook: 'var(--mf-red)',
  vraag: 'var(--mf-amber)',
  tip: 'var(--mf-green)',
  poll: 'var(--mf-blue)',
  cta: 'var(--mf-purple)',
  bewijs: 'var(--mf-green)',
  swipe: 'var(--mf-amber)',
}

function CopyButton({ tekst }: { tekst: string }) {
  const [gekopieerd, setGekopieerd] = useState(false)
  function kopieer() {
    navigator.clipboard.writeText(tekst).then(() => {
      setGekopieerd(true)
      setTimeout(() => setGekopieerd(false), 1800)
    })
  }
  return (
    <button onClick={kopieer} style={{
      padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)',
      background: gekopieerd ? 'var(--mf-green)' : 'var(--bg-subtle)',
      color: gekopieerd ? 'var(--bg-app)' : 'var(--text-3)',
      fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
    }}>
      {gekopieerd ? 'Gekopieerd' : 'Kopieer'}
    </button>
  )
}

export function WaterfallModal({ data, onClose }: { data: WaterfallData; onClose: () => void }) {
  const [tab, setTab] = useState('carousels')

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9000,
        background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '24px 16px', overflowY: 'auto',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border)', width: '100%', maxWidth: 820,
        boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
      }}>

        {/* Header */}
        <div style={{
          padding: '22px 28px 18px', borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          background: 'linear-gradient(135deg, rgba(29,158,117,0.08) 0%, transparent 60%)',
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--mf-green)', letterSpacing: '0.12em', marginBottom: 6 }}>
              📸 INSTAGRAM CONTENT WATERFALL
            </div>
            <h2 style={{ margin: '0 0 6px', fontSize: 21, fontWeight: 900, color: 'var(--text-1)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              {data.virale_hook}
            </h2>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-3)', fontWeight: 500 }}>
              {data.kern_boodschap}
            </p>
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              {[
                `${data.carousels?.length ?? 0} carousels`,
                `${data.reels?.length ?? 0} reels`,
                `${data.stories?.length ?? 0} stories`,
              ].map(label => (
                <span key={label} style={{
                  fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                  background: 'var(--bg-subtle)', color: 'var(--text-3)',
                  border: '1px solid var(--border)',
                }}>📸 {label}</span>
              ))}
            </div>
          </div>
          <button onClick={onClose} style={{
            padding: '6px 12px', border: '1px solid var(--border)', borderRadius: 8,
            background: 'var(--bg-subtle)', color: 'var(--text-3)',
            cursor: 'pointer', fontSize: 16, lineHeight: 1, fontWeight: 700,
          }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: 2, padding: '0 28px',
          borderBottom: '1px solid var(--border)', overflowX: 'auto',
          background: 'var(--bg-subtle)',
        }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: '12px 18px', border: 'none', cursor: 'pointer',
              background: 'transparent',
              color: tab === t.key ? 'var(--mf-green)' : 'var(--text-3)',
              fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
              borderBottom: tab === t.key ? '2px solid var(--mf-green)' : '2px solid transparent',
              transition: 'all 0.15s',
            }}>{t.label}</button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: '24px 28px', maxHeight: '65vh', overflowY: 'auto' }}>

          {/* ── Carousels ── */}
          {tab === 'carousels' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              {(data.carousels ?? []).map((c, ci) => (
                <div key={ci} style={{
                  background: 'var(--bg-app)', borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border)', overflow: 'hidden',
                }}>
                  {/* Carousel header */}
                  <div style={{
                    padding: '14px 18px', background: 'var(--bg-subtle)',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <div>
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--mf-blue)', letterSpacing: '0.1em' }}>
                        CAROUSEL {ci + 1} — {c.doel?.toUpperCase()}
                      </span>
                      <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-1)', marginTop: 2 }}>{c.titel}</div>
                    </div>
                    <CopyButton tekst={c.caption} />
                  </div>

                  {/* Slides grid */}
                  <div style={{ padding: '16px 18px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                    {(c.slides ?? []).map(s => {
                      const kleur = SLIDE_KLEUR[s.type] ?? 'var(--text-3)'
                      return (
                        <div key={s.nr} style={{
                          background: 'var(--bg-card)', border: `1px solid ${kleur}20`,
                          borderLeft: `3px solid ${kleur}`,
                          borderRadius: 8, padding: '10px 13px',
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: kleur, letterSpacing: '0.06em' }}>
                              {s.nr}. {s.type.toUpperCase()}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-1)', lineHeight: 1.5, fontWeight: 600, marginBottom: 4 }}>
                            {s.tekst}
                          </div>
                          {s.visueel && (
                            <div style={{ fontSize: 11, color: 'var(--text-4)', lineHeight: 1.4, fontStyle: 'italic' }}>
                              👁 {s.visueel}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Caption + CTA */}
                  <div style={{ padding: '14px 18px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{
                      background: 'var(--bg-card)', border: '1px solid var(--border)',
                      borderRadius: 8, padding: '12px 14px',
                      fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7, whiteSpace: 'pre-wrap',
                    }}>
                      {c.caption}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{
                        fontSize: 12, fontWeight: 700, color: 'var(--mf-green)',
                        background: 'rgba(29,158,117,0.1)', padding: '6px 12px', borderRadius: 8,
                      }}>
                        CTA: {c.cta}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Reels ── */}
          {tab === 'reels' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {(data.reels ?? []).map((r, ri) => (
                <div key={ri} style={{
                  background: 'var(--bg-app)', borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border)', overflow: 'hidden',
                }}>
                  <div style={{
                    padding: '14px 18px', background: 'var(--bg-subtle)',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <div>
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--mf-red)', letterSpacing: '0.1em' }}>
                        REEL {ri + 1} — {r.duur_sec}s
                      </span>
                      <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-1)', marginTop: 2 }}>{r.titel}</div>
                    </div>
                    <CopyButton tekst={r.script} />
                  </div>

                  <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {/* Hook */}
                    <div style={{
                      background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
                      borderLeft: '3px solid var(--mf-red)', borderRadius: 8, padding: '12px 14px',
                    }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--mf-red)', letterSpacing: '0.08em', marginBottom: 6 }}>
                        HOOK — OPENINGSZIN
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-1)', lineHeight: 1.4 }}>
                        "{r.hook}"
                      </div>
                    </div>

                    {/* Script */}
                    <div style={{
                      background: 'var(--bg-card)', border: '1px solid var(--border)',
                      borderRadius: 8, padding: '14px 16px',
                    }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-4)', letterSpacing: '0.08em', marginBottom: 8 }}>
                        VOLLEDIG SCRIPT
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                        {r.script}
                      </div>
                    </div>

                    {/* Shots */}
                    {r.shots?.length > 0 && (
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-4)', letterSpacing: '0.08em', marginBottom: 8 }}>
                          🎥 SHOTLIST
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {r.shots.map((shot, si) => (
                            <div key={si} style={{
                              display: 'flex', gap: 10, background: 'var(--bg-card)',
                              border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px',
                            }}>
                              <span style={{ fontWeight: 700, color: 'var(--mf-red)', minWidth: 20, fontSize: 12 }}>
                                {si + 1}.
                              </span>
                              <span style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>{shot}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Caption */}
                    <div style={{
                      background: 'var(--bg-card)', border: '1px solid var(--border)',
                      borderRadius: 8, padding: '12px 14px',
                    }}>
                      <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8,
                      }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-4)', letterSpacing: '0.08em' }}>
                          CAPTION
                        </span>
                        <CopyButton tekst={r.caption} />
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7 }}>{r.caption}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Stories ── */}
          {tab === 'stories' && (
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 16, lineHeight: 1.6 }}>
                7-slide story reeks die je kijkers door de funnel leidt — van bereik naar engagement naar actie.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(data.stories ?? []).map(s => {
                  const kleur = STORY_KLEUR[s.type] ?? 'var(--text-3)'
                  return (
                    <div key={s.nr} style={{
                      display: 'grid', gridTemplateColumns: '160px 1fr',
                      background: 'var(--bg-app)', border: `1px solid ${kleur}25`,
                      borderRadius: 10, overflow: 'hidden',
                    }}>
                      <div style={{
                        background: `${kleur}12`, borderRight: `1px solid ${kleur}20`,
                        padding: '14px 16px', display: 'flex', flexDirection: 'column',
                        justifyContent: 'center', alignItems: 'flex-start', gap: 4,
                      }}>
                        <span style={{ fontSize: 22 }}>
                          {s.nr === 1 ? '🔥' : s.nr === 7 ? '👆' : s.type === 'poll' ? '🗳️' : s.type === 'vraag' ? '❓' : s.type === 'tip' ? '💡' : '📸'}
                        </span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: kleur, letterSpacing: '0.08em' }}>
                          SLIDE {s.nr}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: kleur }}>
                          {s.type.toUpperCase()}
                        </span>
                      </div>
                      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', lineHeight: 1.5 }}>
                          {s.tekst}
                        </div>
                        {s.visueel && (
                          <div style={{ fontSize: 12, color: 'var(--text-4)', fontStyle: 'italic', lineHeight: 1.4 }}>
                            👁 {s.visueel}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Hashtags ── */}
          {tab === 'hashtags' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {[
                { key: 'niche', label: 'Niche (klein bereik, hoge relevantie)', kleur: 'var(--mf-green)', icon: '🎯' },
                { key: 'medium', label: 'Medium (balans bereik/relevantie)', kleur: 'var(--mf-blue)', icon: '⚖️' },
                { key: 'breed', label: 'Breed (groot bereik)', kleur: 'var(--mf-purple)', icon: '📡' },
              ].map(tier => {
                const tags: string[] = data.hashtag_strategie?.[tier.key as keyof typeof data.hashtag_strategie] as string[] ?? []
                return (
                  <div key={tier.key} style={{
                    background: 'var(--bg-app)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)', padding: '16px 18px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div>
                        <span style={{ fontSize: 16, marginRight: 8 }}>{tier.icon}</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: tier.kleur }}>{tier.label}</span>
                      </div>
                      <CopyButton tekst={tags.join(' ')} />
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {tags.map(tag => (
                        <span key={tag} style={{
                          fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 20,
                          background: `${tier.kleur}12`, color: tier.kleur,
                          border: `1px solid ${tier.kleur}30`, cursor: 'pointer',
                        }} onClick={() => navigator.clipboard.writeText(tag)}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })}

              {/* Caption template */}
              {data.hashtag_strategie?.caption_template && (
                <div style={{ background: 'var(--bg-app)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--mf-amber)' }}>📝 Caption template</span>
                    <CopyButton tekst={data.hashtag_strategie.caption_template} />
                  </div>
                  <div style={{
                    background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px',
                    fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7, whiteSpace: 'pre-wrap',
                  }}>
                    {data.hashtag_strategie.caption_template}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Postplan ── */}
          {tab === 'postplan' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { label: '📅 Beste dag', waarde: data.postplan?.beste_dag, kleur: 'var(--mf-blue)' },
                { label: '⏰ Beste tijd', waarde: data.postplan?.beste_tijd, kleur: 'var(--mf-green)' },
                { label: '🗺 Volgorde', waarde: data.postplan?.volgorde, kleur: 'var(--mf-purple)' },
                { label: '💡 Pro tip', waarde: data.postplan?.tip, kleur: 'var(--mf-amber)' },
              ].map(item => (
                <div key={item.label} style={{
                  background: 'var(--bg-app)', border: `1px solid ${item.kleur}20`,
                  borderLeft: `3px solid ${item.kleur}`,
                  borderRadius: 'var(--radius-lg)', padding: '16px 18px',
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: item.kleur, marginBottom: 8 }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--text-1)', lineHeight: 1.6, fontWeight: 500 }}>
                    {item.waarde ?? '—'}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
