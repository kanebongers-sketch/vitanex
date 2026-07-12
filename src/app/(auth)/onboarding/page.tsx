'use client'
export const dynamic = 'force-dynamic'

// ════════════════════════════════════════════════════════════════════════════
// Onboarding-container. Bezit auth + alle data-saves; delegeert de presentatie
// aan VitaIntakeGesprek (gebruiker) en HrOnboarding (HR). Geen enkele data-save
// gaat verloren: profiel, baseline dag-signalen (stemming/slaap), AI-analyse,
// lichaam, doel, HR-code-koppeling, startmeting en de eind-update van profiles.
// Strikt navy + cyan; PandaFace (Vita) is het enige meerkleurige element.
// ════════════════════════════════════════════════════════════════════════════

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/supabase'
import { Check } from 'lucide-react'
import {
  type BaselineMeting,
  LEGE_BASELINE,
  type GebrForm,
} from './IntakeStappen'
import type { GezondheidProfiel } from '@/lib/health/gezondheid-berekeningen'
import type { OnboardingAiAnalyse } from '@/app/api/onboarding/analyse/route'
import VitaIntakeGesprek, { type IntakeStap } from './VitaIntakeGesprek'
import HrOnboarding, { type HrStap, type HrForm } from './HrOnboarding'
import { GesprekStyles } from './VitaGesprekStyles'
import { VitaVeld, VitaInput } from './VitaKeuze'

export default function OnboardingPage() {
  const router = useRouter()
  const [rol, setRol] = useState<'hr' | 'gebruiker' | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const [naam, setNaamState] = useState('')

  // Stap-state
  const [hrStap, setHrStap] = useState<HrStap>('welkom')
  const [gebrStap, setGebrStap] = useState<IntakeStap>('welkom')

  // Baseline + AI-analyse
  const [baseline, setBaseline] = useState<BaselineMeting>(LEGE_BASELINE)
  const [aiAnalyse, setAiAnalyse] = useState<OnboardingAiAnalyse | null>(null)
  const [aiBezig, setAiBezig] = useState(false)

  // HR-form
  const [hr, setHr] = useState<HrForm>({
    naam: '', functietitel: '', telefoon: '',
    bedrijfNaam: '', stad: '', kvk: '', website: '',
    sector: '', grootte: '',
  })

  // Gebruiker-form — volledige intake
  const [gebr, setGebr] = useState<GebrForm>({
    naam: '', geslacht: '',
    geboortedatum: '', lengte_cm: '', gewicht_kg: '', vetpercentage: '',
    activiteitsniveau: '', fitness_doel: '', streefgewicht_kg: '',
    dieetvoorkeur: '', allergieen: [],
    hrCode: '',
    hrInzageRapporten: false,
    hrInzageBestanden: false,
  })

  // HR-code validatie
  const [hrCodeBedrijf, setHrCodeBedrijf] = useState('')
  const hrCodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [maxGeboortedatum] = useState(
    () => new Date(Date.now() - 14 * 365.25 * 86400000).toISOString().split('T')[0]
  )

  // ── Auth check ─────────────────────────────────────────────────────────────
  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      const { data: profiel } = await supabase
        .from('profiles')
        .select('naam, rol, onboarding_voltooid')
        .eq('id', user.id).single()

      if (profiel?.onboarding_voltooid) {
        const dest = profiel.rol === 'admin' ? '/admin' : profiel.rol === 'hr' ? '/hr' : '/home'
        router.replace(dest); return
      }

      const isHr = profiel?.rol === 'hr'
      setRol(isHr ? 'hr' : 'gebruiker')
      if (profiel?.naam) {
        setNaamState(profiel.naam)
        if (isHr) setHr(f => ({ ...f, naam: profiel.naam }))
        else setGebr(f => ({ ...f, naam: profiel.naam }))
      }
    }
    check()
  }, [router])

  // ── HR-code live check ─────────────────────────────────────────────────────
  useEffect(() => {
    if (hrCodeTimer.current) clearTimeout(hrCodeTimer.current)
    if (!gebr.hrCode || gebr.hrCode.length < 6) {
      hrCodeTimer.current = setTimeout(() => setHrCodeBedrijf(''), 0)
      return
    }
    hrCodeTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/hr-code?code=${gebr.hrCode.toUpperCase()}`)
        const data = await res.json()
        setHrCodeBedrijf(data.geldig ? data.bedrijfsnaam : '')
      } catch { setHrCodeBedrijf('') }
    }, 500)
    return () => { if (hrCodeTimer.current) clearTimeout(hrCodeTimer.current) }
  }, [gebr.hrCode])

  // ── HR afronden ────────────────────────────────────────────────────────────
  async function hrAfronden() {
    if (!userId) return
    setBezig(true)

    const { data: bedrijf } = await supabase
      .from('bedrijven')
      .insert({
        naam: hr.bedrijfNaam.trim(),
        sector: hr.sector || null,
        grootte: hr.grootte || null,
        stad: hr.stad.trim() || null,
        website: hr.website.trim() || null,
        kvk_nummer: hr.kvk.trim() || null,
      })
      .select('id')
      .single()

    await supabase.from('profiles').update({
      naam: hr.naam.trim(),
      functie: hr.functietitel.trim() || null,
      telefoon: hr.telefoon.trim() || null,
      bedrijf_id: bedrijf?.id ?? null,
      onboarding_voltooid: true,
    }).eq('id', userId)

    setHrStap('klaar')
    setBezig(false)
  }

  // ── Sla baseline dag-signalen op (stemming + slaap) ────────────────────────
  async function slaBaselineDagSignalen(session: { access_token?: string } | null) {
    if (!userId) return
    const vandaag = new Date().toISOString().split('T')[0]
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`

    const taken: Promise<Response>[] = []
    if (baseline.stemming !== null) {
      taken.push(fetch('/api/stemming', {
        method: 'POST', headers,
        body: JSON.stringify({ score: baseline.stemming, notitie: 'Ingevoerd tijdens onboarding' }),
      }))
    }
    if (baseline.slaap_kwaliteit !== null) {
      taken.push(fetch('/api/slaap', {
        method: 'POST', headers,
        body: JSON.stringify({ kwaliteit: baseline.slaap_kwaliteit, datum: vandaag }),
      }))
    }
    if (taken.length > 0) await Promise.allSettled(taken)
  }

  // ── Numerieke parsers (komma → punt, leeg → null) ──────────────────────────
  const parseGewicht = () => gebr.gewicht_kg ? parseFloat(gebr.gewicht_kg.replace(',', '.')) : null
  const parseVet = () => gebr.vetpercentage ? parseFloat(gebr.vetpercentage.replace(',', '.')) : null

  // ── Bouw het gezondheidsprofiel uit de huidige form (voor de payoff) ───────
  function bouwProfiel(): GezondheidProfiel {
    return {
      gewicht_kg: parseGewicht(),
      lengte_cm: gebr.lengte_cm ? parseInt(gebr.lengte_cm) : null,
      geboortedatum: gebr.geboortedatum || null,
      geslacht: gebr.geslacht || null,
      activiteitsniveau: gebr.activiteitsniveau || null,
      fitness_doel: gebr.fitness_doel || null,
    }
  }

  // ── Sla een startmeting op in lichaamsmetingen (upsert op user_id+datum) ───
  async function slaStartmeting(gewicht: number, vet: number | null) {
    if (!userId) return
    const vandaag = new Date().toISOString().split('T')[0]
    const { error } = await supabase.from('lichaamsmetingen').upsert(
      {
        user_id: userId,
        datum: vandaag,
        gewicht_kg: gewicht,
        vetpercentage: vet,
        notitie: 'Startmeting bij intake',
      },
      { onConflict: 'user_id,datum' },
    )
    if (error) {
      // Niet-blokkerend: het profiel is al opgeslagen. Toon een nette melding.
      setFout('Je startmeting kon niet worden opgeslagen, maar je profiel staat klaar.')
    }
  }

  // ── AI-analyse na baseline meting ──────────────────────────────────────────
  async function rondBaselineAfEnAnalyseer() {
    if (!userId) return
    setAiBezig(true)
    setFout(null)

    const { data: { session } } = await supabase.auth.getSession()
    await slaBaselineDagSignalen(session)

    try {
      const res = await fetch('/api/onboarding/analyse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          antwoorden: baseline,
          antropometrie: {
            geslacht: gebr.geslacht || null,
            geboortedatum: gebr.geboortedatum || null,
            lengte_cm: gebr.lengte_cm ? parseInt(gebr.lengte_cm) : null,
            gewicht_kg: parseGewicht(),
            activiteitsniveau: gebr.activiteitsniveau || null,
            fitness_doel: gebr.fitness_doel || null,
            streefgewicht_kg: gebr.streefgewicht_kg ? parseFloat(gebr.streefgewicht_kg.replace(',', '.')) : null,
          },
        }),
      })
      if (res.ok) {
        const d = await res.json()
        setAiAnalyse(d.analyse ?? null)
      }
    } catch {
      // Niet-blokkerend: gebruiker gaat gewoon door
    } finally {
      setAiBezig(false)
      setGebrStap('lichaam')
    }
  }

  // ── Gebruiker afronden ─────────────────────────────────────────────────────
  async function gebruikerAfronden() {
    if (!userId) return
    setBezig(true)
    setFout(null)

    const gewicht = parseGewicht()
    const vet = parseVet()

    const updates: Record<string, unknown> = {
      naam: gebr.naam.trim(),
      onboarding_voltooid: true,
      intake_voltooid: true,
      hr_inzage_rapporten: gebr.hrInzageRapporten,
      hr_inzage_bestanden: gebr.hrInzageBestanden,
    }
    if (gebr.geboortedatum) updates.geboortedatum = gebr.geboortedatum
    if (gebr.lengte_cm) updates.lengte_cm = parseInt(gebr.lengte_cm)
    if (gewicht !== null) updates.gewicht_kg = gewicht
    if (vet !== null) updates.vetpercentage = vet
    if (gebr.geslacht) updates.geslacht = gebr.geslacht
    if (gebr.activiteitsniveau) updates.activiteitsniveau = gebr.activiteitsniveau
    if (gebr.fitness_doel) updates.fitness_doel = gebr.fitness_doel
    if (gebr.streefgewicht_kg) updates.streefgewicht_kg = parseFloat(gebr.streefgewicht_kg.replace(',', '.'))
    // dieetvoorkeur / allergieen worden in onboarding niet meer ingevuld;
    // die worden via /voeding ingesteld door de VoedingSetup wizard.
    // water_doel_ml / stappen_doel / calorie_doel blijven NULL (automatisch).

    if (gebr.hrCode && hrCodeBedrijf) {
      const { data: { session } } = await supabase.auth.getSession()
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`
      try {
        const res = await fetch('/api/hr-code', {
          method: 'POST',
          headers,
          body: JSON.stringify({ code: gebr.hrCode.toUpperCase() }),
        })
        // Zet de rol alleen op 'medewerker' als de koppeling écht slaagde —
        // anders zou de gebruiker stil worden gepromoveerd zonder geldige link.
        if (res.ok) {
          updates.rol = 'medewerker'
        } else {
          setFout('Koppelen aan je werkgever lukte niet. Je account is aangemaakt; je kunt de HR-code later opnieuw invoeren in Instellingen.')
        }
      } catch {
        setFout('Koppelen aan je werkgever lukte niet door een verbindingsprobleem. Je account is aangemaakt; probeer de HR-code later opnieuw in Instellingen.')
      }
    }

    const { error } = await supabase.from('profiles').update(updates).eq('id', userId)
    if (error) {
      setFout('Opslaan is niet gelukt. Controleer je verbinding en probeer het opnieuw.')
      setBezig(false)
      return
    }

    if (gewicht !== null) await slaStartmeting(gewicht, vet)

    setGebrStap('klaar')
    setBezig(false)
  }

  // ── Laad-state ─────────────────────────────────────────────────────────────
  if (rol === null) {
    return (
      <main
        style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--bg-app)',
        }}
      >
        <div className="mf-spinner" style={{ borderTopColor: 'var(--mentaforce-primary)' }} />
      </main>
    )
  }

  // ── HR-flow ────────────────────────────────────────────────────────────────
  if (rol === 'hr') {
    return (
      <main className="vita-intake">
        <GesprekStyles />
        <div className="vita-intake-kaart mf-grain">
          <header className="vita-merk">
            <span className="vita-merk-woord">MENTAFORCE<span className="vita-merk-stip" aria-hidden>.</span></span>
            <span className="vita-merk-badge">HR-setup</span>
          </header>
          <HrOnboarding stap={hrStap} setStap={setHrStap} hr={hr} setHr={setHr} bezig={bezig} onAfronden={hrAfronden} />
        </div>
      </main>
    )
  }

  // ── Gebruiker-flow (Vita-gesprek) ──────────────────────────────────────────
  return (
    <VitaIntakeGesprek
      stap={gebrStap}
      setStap={setGebrStap}
      naam={naam}
      gebr={gebr}
      setGebr={setGebr}
      baseline={baseline}
      setBaseline={setBaseline}
      maxGeboortedatum={maxGeboortedatum}
      aiAnalyse={aiAnalyse}
      aiBezig={aiBezig}
      bezig={bezig}
      fout={fout}
      hrCodeBedrijf={hrCodeBedrijf}
      bouwProfiel={bouwProfiel}
      onStartMeting={rondBaselineAfEnAnalyseer}
      onAfronden={gebruikerAfronden}
      hrSlot={
        <HrCodeSlot
          hrCode={gebr.hrCode}
          onHrCode={code => setGebr(f => ({ ...f, hrCode: code.toUpperCase() }))}
          hrCodeBedrijf={hrCodeBedrijf}
          inzageRapporten={gebr.hrInzageRapporten}
          inzageBestanden={gebr.hrInzageBestanden}
          onToggle={key => setGebr(f => ({ ...f, [key]: !f[key] }))}
        />
      }
    />
  )
}

// ════════════════════════════════════════════════════════════════════════════
// HR-code slot binnen de lichaam-stap — optionele werkgever-koppeling.
// ════════════════════════════════════════════════════════════════════════════
function HrCodeSlot({
  hrCode, onHrCode, hrCodeBedrijf, inzageRapporten, inzageBestanden, onToggle,
}: {
  hrCode: string
  onHrCode: (code: string) => void
  hrCodeBedrijf: string
  inzageRapporten: boolean
  inzageBestanden: boolean
  onToggle: (key: 'hrInzageRapporten' | 'hrInzageBestanden') => void
}) {
  const toggles = [
    { key: 'hrInzageRapporten' as const, label: 'HR mag mijn AI-rapporten inzien', actief: inzageRapporten },
    { key: 'hrInzageBestanden' as const, label: 'HR mag mijn gedeelde bestanden bekijken', actief: inzageBestanden },
  ]
  return (
    <>
      <VitaVeld label="HR-code" sub="Optioneel — koppel aan jouw werkgever" htmlFor="vita-hrcode">
        <VitaInput
          id="vita-hrcode"
          value={hrCode}
          onChange={e => onHrCode(e.target.value)}
          placeholder="Bijv. ABC123"
          maxLength={10}
          autoComplete="off"
        />
        {hrCodeBedrijf && (
          <p style={{ fontSize: 12.5, color: 'var(--mentaforce-primary)', marginTop: 6, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Check size={13} strokeWidth={2.5} aria-hidden /> Gekoppeld aan {hrCodeBedrijf}
          </p>
        )}
        {hrCode.length >= 6 && !hrCodeBedrijf && (
          <p style={{ fontSize: 12.5, color: 'var(--text-4)', marginTop: 6 }}>
            Code niet herkend — controleer met je HR-afdeling.
          </p>
        )}
      </VitaVeld>

      {hrCodeBedrijf && (
        <div className="mf-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
          {toggles.map(opt => (
            <div
              key={opt.key}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 14px', borderRadius: 12,
                background: opt.actief ? 'var(--mentaforce-primary-light)' : 'var(--bg-subtle)',
                border: `1.5px solid ${opt.actief ? 'var(--mentaforce-primary)' : 'var(--border)'}`,
              }}
            >
              <span style={{ fontSize: 13, color: 'var(--text-1)', fontWeight: opt.actief ? 600 : 400, paddingRight: 12 }}>{opt.label}</span>
              <button
                type="button"
                onClick={() => onToggle(opt.key)}
                role="switch"
                aria-checked={opt.actief}
                aria-label={opt.label}
                style={{
                  width: 42, height: 24, borderRadius: 9999, border: 'none', cursor: 'pointer',
                  background: opt.actief ? 'var(--mentaforce-primary)' : 'var(--border-strong)',
                  flexShrink: 0, position: 'relative', transition: 'background 0.2s var(--ease)',
                }}
              >
                <span
                  aria-hidden
                  style={{
                    position: 'absolute', top: 3, left: opt.actief ? 21 : 3, width: 18, height: 18,
                    borderRadius: '50%', background: opt.actief ? 'var(--bg-app)' : 'var(--text-3)',
                    transition: 'left 0.2s var(--ease)',
                  }}
                />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
