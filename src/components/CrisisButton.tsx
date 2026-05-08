'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function CrisisButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl transition active:scale-[0.98]"
        style={{
          background: 'var(--bg-card, white)',
          border: '1.5px solid rgba(220,38,38,0.2)',
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: '#FEF2F2' }}
        >
          <span className="text-xl">❤️‍🩹</span>
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-semibold" style={{ color: '#DC2626' }}>Hulp nodig?</p>
          <p className="text-xs mt-0.5" style={{ color: '#EF4444', opacity: 0.8 }}>
            Direct contact met hulpverlening
          </p>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5, flexShrink: 0 }}>
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {/* Modal */}
      {open && (
        <div
          className="mf-backdrop"
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="mf-modal">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#FEF2F2' }}>
                    <span className="text-xl">🆘</span>
                  </div>
                  <h2 className="text-lg font-bold" style={{ color: '#DC2626' }}>Direct hulp</h2>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold transition"
                  style={{ background: 'var(--bg-subtle)', color: 'var(--text-3)' }}
                >
                  ✕
                </button>
              </div>

              <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--text-2)' }}>
                Als je je overweldigd voelt, ben je niet alleen. Praat met iemand — je hoeft dit niet zelf te dragen.
              </p>

              {/* Resources */}
              <div className="flex flex-col gap-2 mb-5">
                <a
                  href="tel:080003232"
                  className="flex items-start gap-3 p-4 rounded-2xl transition active:opacity-70"
                  style={{
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <span className="text-xl flex-shrink-0">📞</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Zelfmoordlijn</p>
                    <p className="text-sm font-bold" style={{ color: '#DC2626' }}>0800 0 32 32</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-4)' }}>Gratis · 24/7 bereikbaar</p>
                  </div>
                </a>

                <a
                  href="https://online.zelfmoordlijn.be"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 p-4 rounded-2xl transition active:opacity-70"
                  style={{
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <span className="text-xl flex-shrink-0">💬</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Chat online</p>
                    <p className="text-sm font-medium" style={{ color: '#185FA5' }}>online.zelfmoordlijn.be</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-4)' }}>Anoniem chatten met een hulpverlener</p>
                  </div>
                </a>

                <a
                  href="tel:106"
                  className="flex items-start gap-3 p-4 rounded-2xl transition active:opacity-70"
                  style={{
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <span className="text-xl flex-shrink-0">🤝</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Anoniem praten</p>
                    <p className="text-sm font-bold" style={{ color: '#DC2626' }}>Tele-Onthaal 106</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-4)' }}>Gratis · 24/7 bereikbaar</p>
                  </div>
                </a>

                <div
                  className="flex items-start gap-3 p-4 rounded-2xl"
                  style={{
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <span className="text-xl flex-shrink-0">🏥</span>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Huisarts of spoedgevallen</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                      Bel je huisarts of ga naar de spoeddienst voor dringende hulp.
                    </p>
                  </div>
                </div>
              </div>

              {/* AI Coach CTA */}
              <Link
                href="/coach"
                onClick={() => setOpen(false)}
                className="mf-btn mf-btn-primary w-full"
                style={{ fontSize: 14, padding: '12px' }}
              >
                🧠 Praat met je AI Coach
              </Link>

              <p className="text-[11px] text-center mt-3" style={{ color: 'var(--text-4)' }}>
                De AI Coach is geen vervanging voor professionele hulp bij een crisis.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
