'use client'

import { useState } from 'react'

export type WaterfallData = {
  kern_boodschap: string
  virale_hook: string
  instagram: {
    carousels: Array<{
      titel: string
      slides: Array<{ nr: number; type: string; tekst: string }>
    }>
    reels: Array<{
      titel: string
      duur_sec: number
      structuur: Record<string, string>
      hook: string
    }>
  }
  linkedin: {
    posts: Array<{ hook: string; body: string; cta: string }>
  }
  x_threads: Array<{
    titel: string
    tweets: string[]
  }>
  youtube_shorts: Array<{ titel: string; hook: string; script_kern: string }>
  email: {
    onderwerp: string
    secties: Array<{ type: string; inhoud: string }>
  }
  lead_magnet: {
    type: string
    titel: string
    waarde_belofte: string
    onderdelen: string[]
  }
}

const TABS = [
  { key: 'instagram', label: '📸 Instagram' },
  { key: 'linkedin', label: '💼 LinkedIn' },
  { key: 'x', label: '𝕏 Twitter' },
  { key: 'youtube', label: '▶️ YouTube' },
  { key: 'email', label: '📧 Email' },
  { key: 'lead_magnet', label: '🎁 Lead Magnet' },
]

export function WaterfallModal({ data, onClose }: { data: WaterfallData; onClose: () => void }) {
  const [tab, setTab] = useState('instagram')

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9000,
        background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '24px 16px', overflowY: 'auto',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border)', width: '100%', maxWidth: 780,
        boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
      }}>
        <div style={{
          padding: '22px 28px 18px', borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--mf-green)', letterSpacing: '0.1em', marginBottom: 4 }}>
              🌊 CONTENT WATERFALL
            </div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
              {data.virale_hook}
            </h2>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--text-3)', fontWeight: 500 }}>
              {data.kern_boodschap}
            </p>
          </div>
          <button onClick={onClose} style={{
            padding: '6px 10px', border: '1px solid var(--border)',
            borderRadius: 8, background: 'var(--bg-subtle)',
            color: 'var(--text-3)', cursor: 'pointer', fontSize: 16, lineHeight: 1,
          }}>✕</button>
        </div>

        <div style={{
          display: 'flex', gap: 4, padding: '14px 28px 0',
          borderBottom: '1px solid var(--border)', overflowX: 'auto',
        }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: '8px 16px', border: 'none', cursor: 'pointer', borderRadius: '8px 8px 0 0',
              background: tab === t.key ? 'var(--mf-green)' : 'transparent',
              color: tab === t.key ? '#fff' : 'var(--text-3)',
              fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
            }}>{t.label}</button>
          ))}
        </div>

        <div style={{ padding: '24px 28px', maxHeight: '60vh', overflowY: 'auto' }}>
          {tab === 'instagram' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {data.instagram.carousels.map((c, ci) => (
                <div key={ci} style={{
                  background: 'var(--bg-app)', borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border)', overflow: 'hidden',
                }}>
                  <div style={{ padding: '12px 16px', background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--mf-blue)', letterSpacing: '0.08em' }}>CAROUSEL {ci + 1}</span>
                    <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-1)', marginTop: 2 }}>{c.titel}</div>
                  </div>
                  <div style={{ padding: '14px 16px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                    {c.slides.map(s => (
                      <div key={s.nr} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px' }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-4)', letterSpacing: '0.06em', marginBottom: 4 }}>
                          {s.nr}. {s.type.toUpperCase()}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>{s.tekst}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {data.instagram.reels.map((r, ri) => (
                <div key={ri} style={{
                  background: 'var(--bg-app)', borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border)', padding: '14px 16px',
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--mf-red)', letterSpacing: '0.08em', marginBottom: 4 }}>
                    REEL {ri + 1} — {r.duur_sec}s
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-1)', marginBottom: 10 }}>{r.titel}</div>
                  <div style={{ fontStyle: 'italic', fontSize: 13, color: 'var(--text-2)', borderLeft: '3px solid var(--mf-red)', paddingLeft: 12, marginBottom: 12 }}>
                    "{r.hook}"
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {Object.entries(r.structuur).map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--mf-red)', minWidth: 44, paddingTop: 2 }}>{k.replace('_', '-')}s</span>
                        <span style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>{v as string}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'linkedin' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {data.linkedin.posts.map((p, pi) => (
                <div key={pi} style={{ background: 'var(--bg-app)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--mf-blue)', marginBottom: 8 }}>POST {pi + 1}</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-1)', marginBottom: 8 }}>{p.hook}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 10 }}>{p.body}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--mf-blue)', borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                    CTA: {p.cta}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'x' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {data.x_threads.map((t, ti) => (
                <div key={ti} style={{ background: 'var(--bg-app)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', marginBottom: 8 }}>{t.titel}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {t.tweets.map((tweet, i) => (
                      <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-4)', marginRight: 8 }}>{i + 1}/</span>{tweet}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'youtube' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {data.youtube_shorts.map((s, si) => (
                <div key={si} style={{ background: 'var(--bg-app)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px 16px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--mf-red)', marginBottom: 4 }}>SHORT {si + 1}</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-1)', marginBottom: 8 }}>{s.titel}</div>
                  <div style={{ fontStyle: 'italic', fontSize: 13, color: 'var(--text-2)', borderLeft: '3px solid var(--mf-red)', paddingLeft: 10, marginBottom: 10 }}>
                    "{s.hook}"
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.6 }}>{s.script_kern}</div>
                </div>
              ))}
            </div>
          )}

          {tab === 'email' && (
            <div style={{ background: 'var(--bg-app)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--mf-amber)', marginBottom: 6 }}>ONDERWERPREGEL</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-1)', marginBottom: 18 }}>{data.email.onderwerp}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {data.email.secties.map((s, si) => (
                  <div key={si} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--mf-amber)', letterSpacing: '0.08em', marginBottom: 4 }}>
                      {s.type.toUpperCase()}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>{s.inhoud}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'lead_magnet' && (
            <div style={{ background: 'var(--bg-app)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 16 }}>
              <div style={{ marginBottom: 14 }}>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: 'var(--mf-purple)', color: '#fff', letterSpacing: '0.06em' }}>
                  {data.lead_magnet.type.toUpperCase()}
                </span>
              </div>
              <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-1)', marginBottom: 8 }}>{data.lead_magnet.titel}</div>
              <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 16, lineHeight: 1.6, fontStyle: 'italic' }}>
                {data.lead_magnet.waarde_belofte}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', marginBottom: 8 }}>INHOUD:</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {data.lead_magnet.onderdelen.map((o, oi) => (
                  <div key={oi} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px' }}>
                    <span style={{ fontWeight: 800, color: 'var(--mf-green)', minWidth: 20 }}>{oi + 1}.</span>
                    <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{o}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
