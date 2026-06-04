'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// ─── Types ───────────────────────────────────────────────────────────────────
type Stap = 'welkom' | 'profiel' | 'lichaam' | 'hrcode' | 'klaar'

type FormData = {
  naam: string
  geboortedatum: string
  lengte_cm: string
  gewicht_kg: string
  geslacht: 'man' | 'vrouw' | 'anders' | 'zeg_ik_niet' | ''
  hrCode: string
}

// ─── Stap-configuratie ───────────────────────────────────────────────────────
const STAPPEN: Stap[] = ['welkom', 'profiel', 'lichaam', 'hrcode', 'klaar']

const STAP_INFO: Record<Stap, { titel: string; sub: string; emoji: string }> = {
  welkom:  { titel: 'Welkom bij MentaForce', sub: 'Even kennismaken', emoji: '👋' },
  profiel: { titel: 'Jouw profiel', sub: 'Hoe mogen we je noemen?', emoji: '😊' },
  lichaam: { titel: 'Persoonlijke gegevens', sub: 'Voor je vitaliteitsberekeningen', emoji: '📊' },
  hrcode:  { titel: 'Werkgever koppelen', sub: 'Optioneel — je kunt dit overslaan', emoji: '🏢' },
  klaar:   { titel: 'Je bent klaar!', sub: 'Welkom aan boord', emoji: '🎉' },
}

// ─── Hulpcomponenten ─────────────────────────────────────────────────────────
function VoortgangsBalk({ huidig }: { huidig: number }) {
  const totaal = STAPPEN.length - 1 // klaar telt niet mee
  const pct = Math.min(100, (huidig / (totaal - 1)) * 100)
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: '#9CA3AF' }}>Stap {Math.min(huidig + 1, totaal)} van {totaal}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#1D9E75' }}>{Math.round(pct)}%</span>
      </div>
      <div style={{ height: 6, background: '#F3F4F6', borderRadius: 9999, overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 9999,
          background: 'linear-gradient(90deg, #1D9E75, #15B89A)',
          width: `${pct}%`,
          transition: 'width 0.4s cubic-bezier(0.16,1,0.3,1)',
        }} />
      </div>
    </div>
  )
}

function InvoerVeld({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
        {label}
      </label>
      {sub && <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 8 }}>{sub}</p>}
      {children}
    </div>
  )
}

function Knop({ onClick, disabled, children, variant = 'primary', type = 'button' }: {
  onClick?: () => void
  disabled?: boolean
  children: React.ReactNode
  variant?: 'primary' | 'secondary'
  type?: 'button' | 'submit'
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '14px 28px', borderRadius: 12, fontSize: 14, fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'all 0.15s',
        border: variant === 'secondary' ? '1.5px solid #E5E7EB' : 'none',
        background: variant === 'primary' ? 'linear-gradient(135deg, #1D9E75, #15B89A)' : 'white',
        color: variant === 'primary' ? 'white' : '#6B7280',
        boxShadow: variant === 'primary' ? '0 4px 16px rgba(29,158,117,0.3)' : 'none',
      }}
    >
      {children}
    </button>
  )
}

// ─── Hoofd component ─────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const router = useRouter()
  const [stap, setStap] = useState<Stap>('welkom')
  const [userId, setUserId] = useState<string | null>(null)
  const [bezig, setBezig] = useState(false)
  const [hrFout, setHrFout] = useState('')
  const [hrBedrijf, setHrBedrijf] = useState('')
  const [hrValidBezig, setHrValidBezig] = useState(false)
  const hrTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [form, setForm] = useState<FormData>({
    naam: '', geboortedatum: '', lengte_cm: '', gewicht_kg: '',
    geslacht: '', hrCode: '',
  })

  // Auth check + al onboarding gedaan?
  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      const { data: profiel } = await supabase
        .from('profiles')
        .select('naam, onboarding_voltooid, rol')
        .eq('id', user.id)
        .single()

      if (profiel?.onboarding_voltooid) {
        // Al gedaan — stuur door
        const bestemming = profiel.rol === 'admin' ? '/admin' : profiel.rol === 'hr' ? '/hr' : '/home'
        router.replace(bestemming)
        return
      }

      if (profiel?.naam) setForm(f => ({ ...f, naam: profiel.naam }))
    }
    check()
  }, [router])

  function set(key: keyof FormData, val: string) {
    setForm(f => ({ ...f, [key]: val }))
  }

  // HR code live validatie
  useEffect(() => {
    if (hrTimeoutRef.current) clearTimeout(hrTimeoutRef.current)
    if (!form.hrCode || form.hrCode.length < 6) { setHrFout(''); setHrBedrijf(''); return }

    hrTimeoutRef.current = setTimeout(async () => {
      setHrValidBezig(true)
      try {
        const res = await fetch(`/api/hr-code?code=${form.hrCode.toUpperCase()}`)
        const data = await res.json()
        if (data.geldig) { setHrBedrijf(data.bedrijfsnaam); setHrFout('') }
        else { setHrBedrijf(''); setHrFout('Ongeldige code') }
      } catch { setHrFout('Kan niet valideren') }
      setHrValidBezig(false)
    }, 500)

    return () => { if (hrTimeoutRef.current) clearTimeout(hrTimeoutRef.current) }
  }, [form.hrCode])

  const stapIndex = STAPPEN.indexOf(stap)

  function volgende() {
    const volgend = STAPPEN[stapIndex + 1]
    if (volgend) setStap(volgend)
  }

  function vorige() {
    const vorig = STAPPEN[stapIndex - 1]
    if (vorig) setStap(vorig)
  }

  async function afronden() {
    if (!userId) return
    setBezig(true)

    const updates: Record<string, unknown> = {
      naam: form.naam.trim(),
      onboarding_voltooid: true,
    }

    if (form.geboortedatum) updates.geboortedatum = form.geboortedatum
    if (form.lengte_cm) updates.lengte_cm = parseInt(form.lengte_cm)
    if (form.gewicht_kg) updates.gewicht_kg = parseFloat(form.gewicht_kg.replace(',', '.'))
    if (form.geslacht) updates.geslacht = form.geslacht

    // HR code koppelen als ingevuld en geldig
    if (form.hrCode && hrBedrijf) {
      const res = await fetch('/api/hr-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: form.hrCode.toUpperCase() }),
      })
      if (res.ok) {
        updates.rol = 'medewerker'
      }
    }

    await supabase.from('profiles').update(updates).eq('id', userId)
    setStap('klaar')
    setBezig(false)
  }

  const info = STAP_INFO[stap]

  return (
    <main style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #F0FDF8 0%, #F9FAFB 50%, #EEF2FF 100%)',
      padding: '24px 16px',
    }}>
      <div style={{
        width: '100%', maxWidth: 480,
        background: 'white', borderRadius: 24,
        border: '1px solid #E5E7EB',
        boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
        padding: '40px 36px',
        animation: 'mf-fade-in 0.3s ease',
      }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #1D9E75, #15B89A)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16,
          }}>🌿</div>
          <span style={{ fontWeight: 800, fontSize: 15, color: '#111827' }}>MentaForce</span>
        </div>

        {/* Voortgang (niet op welkom en klaar) */}
        {stap !== 'welkom' && stap !== 'klaar' && (
          <VoortgangsBalk huidig={stapIndex} />
        )}

        {/* Stap header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>{info.emoji}</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em', marginBottom: 4 }}>
            {info.titel}
          </h1>
          <p style={{ fontSize: 14, color: '#9CA3AF' }}>{info.sub}</p>
        </div>

        {/* ── STAP: WELKOM ── */}
        {stap === 'welkom' && (
          <div>
            <p style={{ fontSize: 15, color: '#4B5563', lineHeight: 1.7, marginBottom: 28 }}>
              Fijn dat je er bent. We stellen je een paar korte vragen om jouw vitaliteitsplatform persoonlijk te maken.
              <br /><br />
              Dit duurt minder dan <strong>2 minuten</strong> en je doet het maar één keer.
            </p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
              {[
                { emoji: '🎯', tekst: 'Persoonlijke vitaliteitsscores' },
                { emoji: '🤖', tekst: 'Betere AI-coach adviezen' },
                { emoji: '📈', tekst: 'Nauwkeurige gezondheidsmetingen' },
              ].map(({ emoji, tekst }) => (
                <div key={tekst} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#6B7280' }}>
                  <span style={{ fontSize: 18 }}>{emoji}</span>
                  {tekst}
                </div>
              ))}
            </div>
            <Knop onClick={volgende}>Beginnen →</Knop>
          </div>
        )}

        {/* ── STAP: PROFIEL ── */}
        {stap === 'profiel' && (
          <div>
            <InvoerVeld label="Hoe heet je?" sub="Je weergavenaam in de app">
              <input
                type="text"
                value={form.naam}
                onChange={e => set('naam', e.target.value)}
                placeholder="Jouw naam"
                autoFocus
                style={{
                  width: '100%', border: '1.5px solid #E5E7EB', borderRadius: 12,
                  padding: '12px 16px', fontSize: 14, outline: 'none',
                  transition: 'border-color 0.15s', boxSizing: 'border-box',
                }}
                onFocus={e => e.target.style.borderColor = '#1D9E75'}
                onBlur={e => e.target.style.borderColor = '#E5E7EB'}
              />
            </InvoerVeld>

            <InvoerVeld label="Geslacht" sub="Gebruikt voor nauwkeurige berekeningen">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {([
                  { val: 'man',         label: '♂ Man' },
                  { val: 'vrouw',       label: '♀ Vrouw' },
                  { val: 'anders',      label: '⚧ Anders' },
                  { val: 'zeg_ik_niet', label: '— Zeg ik niet' },
                ] as const).map(opt => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => set('geslacht', opt.val)}
                    style={{
                      padding: '10px 12px', borderRadius: 10, fontSize: 13,
                      fontWeight: form.geslacht === opt.val ? 700 : 400,
                      border: `1.5px solid ${form.geslacht === opt.val ? '#1D9E75' : '#E5E7EB'}`,
                      background: form.geslacht === opt.val ? '#E1F5EE' : 'white',
                      color: form.geslacht === opt.val ? '#0F6E56' : '#6B7280',
                      cursor: 'pointer', transition: 'all 0.12s',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </InvoerVeld>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', marginTop: 28 }}>
              <Knop onClick={vorige} variant="secondary">← Terug</Knop>
              <Knop onClick={volgende} disabled={!form.naam.trim()}>Volgende →</Knop>
            </div>
          </div>
        )}

        {/* ── STAP: LICHAAM ── */}
        {stap === 'lichaam' && (
          <div>
            <div style={{
              padding: '12px 16px', borderRadius: 12, marginBottom: 24,
              background: '#F0FDF8', border: '1px solid #A3DECE',
              fontSize: 13, color: '#0F6E56',
            }}>
              🔒 Deze gegevens worden versleuteld opgeslagen en nooit gedeeld met HR.
            </div>

            <InvoerVeld label="Geboortedatum">
              <input
                type="date"
                value={form.geboortedatum}
                onChange={e => set('geboortedatum', e.target.value)}
                max={new Date(Date.now() - 14 * 365.25 * 86400000).toISOString().split('T')[0]}
                style={{
                  width: '100%', border: '1.5px solid #E5E7EB', borderRadius: 12,
                  padding: '12px 16px', fontSize: 14, outline: 'none',
                  transition: 'border-color 0.15s', boxSizing: 'border-box',
                }}
                onFocus={e => e.target.style.borderColor = '#1D9E75'}
                onBlur={e => e.target.style.borderColor = '#E5E7EB'}
              />
            </InvoerVeld>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <InvoerVeld label="Lengte (cm)">
                <input
                  type="number"
                  value={form.lengte_cm}
                  onChange={e => set('lengte_cm', e.target.value)}
                  placeholder="175"
                  min={100} max={250}
                  style={{
                    width: '100%', border: '1.5px solid #E5E7EB', borderRadius: 12,
                    padding: '12px 16px', fontSize: 14, outline: 'none',
                    transition: 'border-color 0.15s', boxSizing: 'border-box',
                  }}
                  onFocus={e => e.target.style.borderColor = '#1D9E75'}
                  onBlur={e => e.target.style.borderColor = '#E5E7EB'}
                />
              </InvoerVeld>
              <InvoerVeld label="Gewicht (kg)">
                <input
                  type="number"
                  value={form.gewicht_kg}
                  onChange={e => set('gewicht_kg', e.target.value)}
                  placeholder="70"
                  min={30} max={300} step={0.1}
                  style={{
                    width: '100%', border: '1.5px solid #E5E7EB', borderRadius: 12,
                    padding: '12px 16px', fontSize: 14, outline: 'none',
                    transition: 'border-color 0.15s', boxSizing: 'border-box',
                  }}
                  onFocus={e => e.target.style.borderColor = '#1D9E75'}
                  onBlur={e => e.target.style.borderColor = '#E5E7EB'}
                />
              </InvoerVeld>
            </div>

            {/* BMI preview */}
            {form.lengte_cm && form.gewicht_kg && (() => {
              const h = parseInt(form.lengte_cm) / 100
              const w = parseFloat(form.gewicht_kg.replace(',', '.'))
              if (!h || !w) return null
              const bmi = w / (h * h)
              const cat = bmi < 18.5 ? { label: 'Ondergewicht', kleur: '#378ADD' }
                : bmi < 25 ? { label: 'Gezond gewicht', kleur: '#1D9E75' }
                : bmi < 30 ? { label: 'Overgewicht', kleur: '#BA7517' }
                : { label: 'Obesitas', kleur: '#E24B4A' }
              return (
                <div style={{ padding: '10px 14px', borderRadius: 10, background: '#F9FAFB', border: '1px solid #E5E7EB', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: '#6B7280' }}>BMI: <strong>{bmi.toFixed(1)}</strong></span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: cat.kleur, padding: '2px 8px', borderRadius: 20, background: cat.kleur + '15' }}>{cat.label}</span>
                </div>
              )
            })()}

            <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 24 }}>
              Alle velden zijn optioneel — je kunt dit later invullen in Instellingen.
            </p>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between' }}>
              <Knop onClick={vorige} variant="secondary">← Terug</Knop>
              <Knop onClick={volgende}>Volgende →</Knop>
            </div>
          </div>
        )}

        {/* ── STAP: HR CODE ── */}
        {stap === 'hrcode' && (
          <div>
            <p style={{ fontSize: 14, color: '#4B5563', lineHeight: 1.6, marginBottom: 24 }}>
              Werkt u bij een organisatie die MentaForce gebruikt? Voer dan de HR code in die u van uw werkgever heeft ontvangen. Zo worden uw roosters, verlof en HR-functies automatisch gekoppeld.
            </p>

            <InvoerVeld label="HR Code" sub="6 tekens — ontvangen van uw werkgever">
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={form.hrCode}
                  onChange={e => set('hrCode', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                  placeholder="bijv. A3KZ9W"
                  maxLength={6}
                  style={{
                    width: '100%', border: `1.5px solid ${hrFout ? '#E24B4A' : hrBedrijf ? '#1D9E75' : '#E5E7EB'}`,
                    borderRadius: 12, padding: '12px 48px 12px 16px',
                    fontSize: 18, fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.15em',
                    outline: 'none', transition: 'border-color 0.15s', boxSizing: 'border-box',
                    textTransform: 'uppercase',
                  }}
                />
                <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)' }}>
                  {hrValidBezig && <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #E5E7EB', borderTopColor: '#1D9E75', animation: 'spin 0.7s linear infinite' }} />}
                  {!hrValidBezig && hrBedrijf && <span style={{ color: '#1D9E75', fontSize: 16 }}>✓</span>}
                  {!hrValidBezig && hrFout && <span style={{ color: '#E24B4A', fontSize: 16 }}>✗</span>}
                </div>
              </div>

              {hrBedrijf && (
                <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 10, background: '#E1F5EE', border: '1px solid #A3DECE', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #1D9E75, #185FA5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 10, fontWeight: 800, flexShrink: 0 }}>HR</div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#0F6E56' }}>{hrBedrijf}</p>
                    <p style={{ fontSize: 11, color: '#4CAF87' }}>Je wordt als werknemer gekoppeld</p>
                  </div>
                </div>
              )}
              {hrFout && <p style={{ fontSize: 12, color: '#E24B4A', marginTop: 6 }}>{hrFout}</p>}
            </InvoerVeld>

            <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 24 }}>
              Geen code? Geen probleem — klik op &ldquo;Overslaan&rdquo;. Je kunt dit later alsnog doen via Instellingen.
            </p>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between' }}>
              <Knop onClick={vorige} variant="secondary">← Terug</Knop>
              <div style={{ display: 'flex', gap: 8 }}>
                {!hrBedrijf && (
                  <Knop onClick={afronden} variant="secondary" disabled={bezig}>
                    Overslaan
                  </Knop>
                )}
                <Knop onClick={afronden} disabled={bezig || (form.hrCode.length > 0 && !hrBedrijf)}>
                  {bezig ? 'Opslaan...' : hrBedrijf ? 'Koppelen & afronden →' : 'Afronden →'}
                </Knop>
              </div>
            </div>
          </div>
        )}

        {/* ── STAP: KLAAR ── */}
        {stap === 'klaar' && (
          <div>
            <div style={{ marginBottom: 28 }}>
              {[
                { emoji: '✅', tekst: `Profiel aangemaakt als "${form.naam || 'Gebruiker'}"` },
                form.geboortedatum || form.lengte_cm || form.gewicht_kg
                  ? { emoji: '📊', tekst: 'Persoonlijke gegevens opgeslagen' }
                  : null,
                hrBedrijf
                  ? { emoji: '🏢', tekst: `Gekoppeld aan ${hrBedrijf}` }
                  : { emoji: '👤', tekst: 'Persoonlijk account — geen werkgever' },
              ].filter(Boolean).map((item, i) => item && (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #F3F4F6' }}>
                  <span style={{ fontSize: 20 }}>{item.emoji}</span>
                  <p style={{ fontSize: 14, color: '#374151' }}>{item.tekst}</p>
                </div>
              ))}
            </div>

            <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6, marginBottom: 28 }}>
              Je kunt al je instellingen later aanpassen via{' '}
              <strong style={{ color: '#374151' }}>Instellingen → Profiel</strong>.
            </p>

            <button
              onClick={() => { window.location.href = hrBedrijf ? '/home' : '/home' }}
              style={{
                width: '100%', padding: '16px', borderRadius: 14, fontSize: 15, fontWeight: 800,
                background: 'linear-gradient(135deg, #1D9E75, #15B89A)',
                color: 'white', border: 'none', cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(29,158,117,0.35)',
                transition: 'opacity 0.15s',
              }}
            >
              Naar mijn dashboard 🚀
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes mf-fade-in { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
      `}</style>
    </main>
  )
}
