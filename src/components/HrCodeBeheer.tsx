'use client'

/**
 * HrCodeBeheer
 *
 * HR-dashboard component: toont de huidige HR code van het bedrijf,
 * biedt kopieer- en regenereer-functionaliteit, en toont statistieken
 * over hoeveel medewerkers via de code zijn gekoppeld.
 *
 * Props:
 *   bedrijfId     – UUID van het bedrijf
 *   bedrijfsnaam  – naam van het bedrijf (voor displaydoeleinden)
 *   sessieToken   – Supabase JWT van de ingelogde HR-gebruiker
 */

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Props {
  bedrijfId: string
  bedrijfsnaam: string
  sessieToken?: string
}

export default function HrCodeBeheer({ bedrijfId, bedrijfsnaam, sessieToken }: Props) {
  const [hrCode, setHrCode] = useState<string>('')
  const [aantalGekoppeld, setAantalGekoppeld] = useState<number | null>(null)
  const [laden, setLaden] = useState(true)
  const [kopieert, setKopieert] = useState(false)
  const [regenereert, setRegeneert] = useState(false)
  const [bevestigRegeneer, setBevestigRegeneer] = useState(false)
  const [fout, setFout] = useState<string | null>(null)

  useEffect(() => {
    async function laad() {
      setLaden(true)
      setFout(null)

      // HR code ophalen
      const { data: bedrijf, error: bedrijfError } = await supabase
        .from('bedrijven')
        .select('hr_code')
        .eq('id', bedrijfId)
        .single()

      if (bedrijfError || !bedrijf) {
        setFout('Kon HR code niet laden.')
        setLaden(false)
        return
      }
      setHrCode(bedrijf.hr_code ?? '')

      // Aantal gekoppelde medewerkers via code ophalen
      const { count } = await supabase
        .from('hr_code_logs')
        .select('id', { count: 'exact', head: true })
        .eq('bedrijf_id', bedrijfId)

      setAantalGekoppeld(count ?? 0)
      setLaden(false)
    }
    laad()
  }, [bedrijfId])

  async function kopieerCode() {
    if (!hrCode) return
    try {
      await navigator.clipboard.writeText(hrCode)
      setKopieert(true)
      setTimeout(() => setKopieert(false), 2000)
    } catch {
      // Fallback: selecteer tekst
      const el = document.createElement('textarea')
      el.value = hrCode
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setKopieert(true)
      setTimeout(() => setKopieert(false), 2000)
    }
  }

  async function regenereerCode() {
    setRegeneert(true)
    setFout(null)
    setBevestigRegeneer(false)

    let jwt = sessieToken
    if (!jwt) {
      const { data } = await supabase.auth.getSession()
      jwt = data.session?.access_token
    }
    if (!jwt) {
      setFout('Sessie verlopen. Log opnieuw in.')
      setRegeneert(false)
      return
    }

    try {
      const res = await fetch('/api/hr-code/regenereer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`,
        },
      })
      const json = await res.json()
      if (!res.ok || !json.hr_code) {
        setFout(json.fout ?? 'Regenereren mislukt.')
      } else {
        setHrCode(json.hr_code)
      }
    } catch {
      setFout('Netwerkfout. Probeer opnieuw.')
    }
    setRegeneert(false)
  }

  if (laden) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-6 flex items-center justify-center" style={{ minHeight: 160 }}>
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: '#1D9E75', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #1D9E75 0%, #185FA5 100%)' }}
        >
          HR
        </div>
        <div>
          <h2 className="font-bold text-gray-900 text-base leading-tight">HR Koppelcode</h2>
          <p className="text-xs text-gray-400 mt-0.5">Deel met nieuwe medewerkers om hun account te koppelen</p>
        </div>
      </div>

      {fout && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {fout}
        </div>
      )}

      {/* Code weergave */}
      <div
        className="rounded-2xl p-5 mb-4 flex flex-col items-center gap-4"
        style={{ background: '#F0FBF7' }}
      >
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#1D9E75' }}>
          Jouw HR Code
        </p>
        <code
          className="text-4xl font-mono font-extrabold tracking-[0.3em] select-all"
          style={{ color: '#1D9E75' }}
        >
          {hrCode || '———'}
        </code>

        {/* Kopieer knop */}
        <button
          onClick={kopieerCode}
          disabled={!hrCode || kopieert}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border transition disabled:opacity-40"
          style={{
            borderColor: kopieert ? '#1D9E75' : '#d1fae5',
            background: kopieert ? '#1D9E75' : 'white',
            color: kopieert ? 'white' : '#1D9E75',
          }}
        >
          {kopieert ? (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Gekopieerd!
            </>
          ) : (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              Kopieer code
            </>
          )}
        </button>
      </div>

      {/* Statistiek */}
      {aantalGekoppeld !== null && (
        <div
          className="rounded-xl border px-4 py-3 mb-4 flex items-center gap-3"
          style={{ borderColor: '#e5e7eb', background: '#fafafa' }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold"
            style={{ background: '#E1F5EE', color: '#0F6E56' }}
          >
            {aantalGekoppeld}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800">
              {aantalGekoppeld === 1
                ? '1 medewerker gekoppeld via code'
                : `${aantalGekoppeld} medewerkers gekoppeld via code`}
            </p>
            <p className="text-xs text-gray-400">aan {bedrijfsnaam}</p>
          </div>
        </div>
      )}

      {/* Instructie */}
      <p className="text-xs text-gray-500 leading-relaxed mb-5">
        Stuur deze code naar nieuwe medewerkers. Ze voeren hem in tijdens de registratie of via{' '}
        <strong>Instellingen &rarr; Koppel aan werkgever</strong>. Hun account wordt dan automatisch
        aan {bedrijfsnaam} gekoppeld.
      </p>

      {/* Regenereer sectie */}
      {!bevestigRegeneer ? (
        <button
          onClick={() => setBevestigRegeneer(true)}
          disabled={regenereert}
          className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 transition disabled:opacity-50"
        >
          Genereer nieuwe code (bestaande code wordt ongeldig)
        </button>
      ) : (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
          <p className="text-sm font-semibold text-orange-800 mb-1">Weet je het zeker?</p>
          <p className="text-xs text-orange-700 mb-4">
            De huidige code <strong>{hrCode}</strong> wordt ongeldig. Medewerkers die de oude code nog niet hebben gebruikt
            kunnen niet meer koppelen. Geef de nieuwe code aan iedereen die nog moet koppelen.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setBevestigRegeneer(false)}
              className="flex-1 py-2 rounded-xl text-sm font-medium border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition"
            >
              Annuleren
            </button>
            <button
              onClick={regenereerCode}
              disabled={regenereert}
              className="flex-1 py-2 rounded-xl text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
              style={{ background: '#BA7517' }}
            >
              {regenereert ? 'Genereren...' : 'Ja, genereer nieuwe code'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
