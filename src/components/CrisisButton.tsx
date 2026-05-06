'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function CrisisButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Inline button */}
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition active:scale-[0.98]"
        style={{ background: '#FFF5F5', borderColor: '#FECACA', color: '#DC2626' }}
      >
        <span className="text-xl">❤️‍🩹</span>
        <div className="flex-1 text-left">
          <p className="text-sm font-semibold">Hulp nodig?</p>
          <p className="text-xs mt-0.5" style={{ color: '#EF4444', opacity: 0.8 }}>Direct contact met hulpverlening</p>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div
            className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6"
            style={{ boxShadow: '0 -8px 40px rgba(0,0,0,0.2)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold" style={{ color: '#DC2626' }}>🆘 Direct hulp</h2>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-5 leading-relaxed">
              Als je je overweldigd voelt, ben je niet alleen. Praat met iemand.
            </p>

            {/* Resources */}
            <div className="flex flex-col gap-3 mb-5">

              {/* Zelfmoordlijn telefoon */}
              <a
                href="tel:080003232"
                className="flex items-start gap-3 p-3.5 rounded-xl border border-gray-100 hover:bg-gray-50 transition"
              >
                <span className="text-xl flex-shrink-0">📞</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">Zelfmoordlijn</p>
                  <p className="text-sm font-bold" style={{ color: '#DC2626' }}>0800 0 32 32</p>
                  <p className="text-xs text-gray-400 mt-0.5">Gratis, 24/7 bereikbaar</p>
                </div>
              </a>

              {/* Zelfmoordlijn chat */}
              <a
                href="https://online.zelfmoordlijn.be"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 p-3.5 rounded-xl border border-gray-100 hover:bg-gray-50 transition"
              >
                <span className="text-xl flex-shrink-0">💬</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">Chat</p>
                  <p className="text-sm font-medium" style={{ color: '#378ADD' }}>online.zelfmoordlijn.be</p>
                  <p className="text-xs text-gray-400 mt-0.5">Anoniem chatten met een hulpverlener</p>
                </div>
              </a>

              {/* Huisarts */}
              <div className="flex items-start gap-3 p-3.5 rounded-xl border border-gray-100">
                <span className="text-xl flex-shrink-0">🏥</span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Huisarts</p>
                  <p className="text-xs text-gray-500 mt-0.5">Bel je huisarts of ga naar de spoed</p>
                </div>
              </div>

              {/* Tele-Onthaal */}
              <a
                href="tel:106"
                className="flex items-start gap-3 p-3.5 rounded-xl border border-gray-100 hover:bg-gray-50 transition"
              >
                <span className="text-xl flex-shrink-0">🤝</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">Anoniem praten</p>
                  <p className="text-sm font-bold" style={{ color: '#DC2626' }}>Tele-Onthaal 106</p>
                  <p className="text-xs text-gray-400 mt-0.5">Gratis, 24/7 bereikbaar</p>
                </div>
              </a>
            </div>

            {/* AI Coach link */}
            <Link
              href="/coach"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-white text-sm font-semibold transition active:scale-[0.98]"
              style={{ background: '#1D9E75' }}
            >
              Praat met je AI Coach →
            </Link>
          </div>
        </div>
      )}
    </>
  )
}
