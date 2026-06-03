'use client'

/**
 * HrCodeModal
 *
 * Herbruikbaar modal voor het invoeren en valideren van een HR code.
 *
 * Props:
 *   open          – toon/verberg de modal
 *   onSluit       – callback om de modal te sluiten
 *   onGekoppeld   – callback na succesvolle koppeling
 *                   (ontvangt bedrijf_id en bedrijfsnaam)
 *   sessieToken   – Supabase JWT van de ingelogde user
 *                   (optioneel als je de token zelf wilt meegeven;
 *                    als niet opgegeven wordt de sessie uit Supabase gelezen)
 *
 * Gebruik (vanuit instellingen):
 *   <HrCodeModal
 *     open={toonModal}
 *     onSluit={() => setToonModal(false)}
 *     onGekoppeld={({ bedrijfsnaam }) => toast(`Gekoppeld aan ${bedrijfsnaam}`)}
 *   />
 */

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Props {
  open: boolean
  onSluit: () => void
  onGekoppeld?: (result: { bedrijf_id: string; bedrijfsnaam: string }) => void
  sessieToken?: string
}

type Fase = 'invoer' | 'valideren' | 'bevestig' | 'koppelen' | 'klaar' | 'fout'

export default function HrCodeModal({ open, onSluit, onGekoppeld, sessieToken }: Props) {
  const [invoer, setInvoer] = useState('')
  const [fase, setFase] = useState<Fase>('invoer')
  const [foutTekst, setFoutTekst] = useState<string | null>(null)
  const [bedrijfsnaam, setBedrijfsnaam] = useState('')
  const [bedrijfId, setBedrijfId] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Reset bij openen
  useEffect(() => {
    if (open) {
      setInvoer('')
      setFase('invoer')
      setFoutTekst(null)
      setBedrijfsnaam('')
      setBedrijfId('')
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  // Formatteer invoer automatisch: letters naar hoofd, voeg streepje in
  function handleInvoer(raw: string) {
    let v = raw.toUpperCase().replace(/[^A-Z0-9-]/g, '')
    // Zet automatisch een streepje na de derde letter als de user dat niet doet
    if (v.length === 3 && !v.includes('-') && invoer.length === 2) {
      v = v + '-'
    }
    if (v.length > 7) v = v.slice(0, 7)
    setInvoer(v)
  }

  // Stap 1: valideer de code bij de server (ophalen bedrijfsnaam)
  async function valideerCode() {
    const code = invoer.trim()
    if (!/^[A-Z]{3}-[0-9][A-Z][0-9]$/.test(code)) {
      setFoutTekst('Voer een geldige code in, zoals FIT-X2K.')
      return
    }
    setFase('valideren')
    setFoutTekst(null)
    try {
      const res = await fetch(`/api/hr-code/valideer?code=${encodeURIComponent(code)}`)
      const json = await res.json()
      if (!res.ok || !json.geldig) {
        setFoutTekst(json.fout ?? 'Ongeldige HR code.')
        setFase('fout')
        return
      }
      setBedrijfsnaam(json.bedrijfsnaam)
      setBedrijfId(json.bedrijf_id)
      setFase('bevestig')
    } catch {
      setFoutTekst('Netwerkfout. Controleer je verbinding en probeer opnieuw.')
      setFase('fout')
    }
  }

  // Stap 2: definitief koppelen
  async function koppelAanBedrijf() {
    setFase('koppelen')
    setFoutTekst(null)

    // Haal JWT op als niet meegegeven via props
    let jwt = sessieToken
    if (!jwt) {
      const { data } = await supabase.auth.getSession()
      jwt = data.session?.access_token
    }
    if (!jwt) {
      setFoutTekst('Je sessie is verlopen. Log opnieuw in.')
      setFase('fout')
      return
    }

    try {
      const res = await fetch('/api/hr-code/koppel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({ code: invoer.trim() }),
      })
      const json = await res.json()
      if (!res.ok) {
        setFoutTekst(json.fout ?? 'Koppeling mislukt.')
        setFase('fout')
        return
      }
      setFase('klaar')
      onGekoppeld?.({ bedrijf_id: bedrijfId, bedrijfsnaam })
    } catch {
      setFoutTekst('Netwerkfout. Probeer opnieuw.')
      setFase('fout')
    }
  }

  if (!open) return null

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(10,15,30,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onSluit() }}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="HR code koppeling"
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-0 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #1D9E75 0%, #185FA5 100%)' }}
            >
              HR
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-lg leading-tight">Koppel aan werkgever</h2>
              <p className="text-xs text-gray-400 mt-0.5">Voer de HR code in die je van je werkgever hebt ontvangen</p>
            </div>
          </div>
          <button
            onClick={onSluit}
            className="text-gray-300 hover:text-gray-500 transition ml-4 mt-0.5"
            aria-label="Sluiten"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6">

          {/* FASE: invoer / valideren / fout */}
          {(fase === 'invoer' || fase === 'valideren' || fase === 'fout') && (
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-2">
                HR Code
              </label>
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={invoer}
                  onChange={e => handleInvoer(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && fase !== 'valideren' && valideerCode()}
                  placeholder="FIT-X2K"
                  maxLength={7}
                  disabled={fase === 'valideren'}
                  className="w-full border-2 rounded-xl px-4 py-3.5 text-xl font-mono font-bold text-center tracking-[0.3em] outline-none transition disabled:opacity-50"
                  style={{
                    borderColor: fase === 'fout' ? '#E24B4A' : invoer.length === 7 ? '#1D9E75' : '#e5e7eb',
                    color: '#0a0f1e',
                    letterSpacing: '0.25em',
                  }}
                  spellCheck={false}
                  autoComplete="off"
                />
                {fase === 'valideren' && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <div
                      className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
                      style={{ borderColor: '#1D9E75', borderTopColor: 'transparent' }}
                    />
                  </div>
                )}
              </div>

              {foutTekst && (
                <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                  {foutTekst}
                </div>
              )}

              <p className="text-xs text-gray-400 mt-3 text-center">
                Je werkgever vindt de HR code op het HR-dashboard van MentaForce.
              </p>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={onSluit}
                  className="px-5 py-3 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition"
                >
                  Annuleren
                </button>
                <button
                  onClick={() => { setFoutTekst(null); fase === 'fout' ? setFase('invoer') : valideerCode() }}
                  disabled={fase === 'valideren' || invoer.length < 7}
                  className="flex-1 py-3 rounded-xl text-white font-bold text-sm transition hover:opacity-90 disabled:opacity-30"
                  style={{ background: '#1D9E75' }}
                >
                  {fase === 'fout' ? 'Opnieuw proberen' : fase === 'valideren' ? 'Controleren...' : 'Controleer code'}
                </button>
              </div>
            </div>
          )}

          {/* FASE: bevestig */}
          {fase === 'bevestig' && (
            <div>
              <div
                className="rounded-2xl border-2 p-5 mb-5 text-center"
                style={{ borderColor: '#1D9E75', background: '#F0FBF7' }}
              >
                <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#1D9E75' }}>
                  Bedrijf gevonden
                </p>
                <p className="text-2xl font-extrabold text-gray-900">{bedrijfsnaam}</p>
                <p className="text-sm text-gray-500 mt-1">Code: <span className="font-mono font-bold">{invoer}</span></p>
              </div>

              <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                Wil je je account koppelen aan <strong>{bedrijfsnaam}</strong>?
                Je HR-afdeling krijgt toegang tot anonieme welzijnsdata van jouw team — nooit persoonsgebonden inzichten.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setFase('invoer')}
                  className="px-5 py-3 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition"
                >
                  Terug
                </button>
                <button
                  onClick={koppelAanBedrijf}
                  className="flex-1 py-3 rounded-xl text-white font-bold text-sm transition hover:opacity-90"
                  style={{ background: '#185FA5' }}
                >
                  Ja, koppel mij aan {bedrijfsnaam}
                </button>
              </div>
            </div>
          )}

          {/* FASE: koppelen (laden) */}
          {fase === 'koppelen' && (
            <div className="flex flex-col items-center py-6 gap-4">
              <div
                className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin"
                style={{ borderColor: '#1D9E75', borderTopColor: 'transparent' }}
              />
              <p className="text-sm text-gray-500">Koppeling verwerken...</p>
            </div>
          )}

          {/* FASE: klaar */}
          {fase === 'klaar' && (
            <div className="flex flex-col items-center py-4 text-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-5 text-2xl"
                style={{ background: '#E1F5EE' }}
              >
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <circle cx="16" cy="16" r="16" fill="#1D9E75" />
                  <path d="M9 17l5 5 9-10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="font-extrabold text-gray-900 text-xl mb-2">Gekoppeld!</h3>
              <p className="text-sm text-gray-500 mb-6">
                Je account is succesvol gekoppeld aan <strong>{bedrijfsnaam}</strong>.
              </p>
              <button
                onClick={onSluit}
                className="w-full py-3 rounded-xl text-white font-bold text-sm transition hover:opacity-90"
                style={{ background: '#1D9E75' }}
              >
                Sluiten
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
