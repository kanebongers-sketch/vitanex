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
import { Loader2, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { DialogRoot, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/Dialog'

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

  // Reset bij openen — via het render-vergelijkingspatroon i.p.v. een effect
  // (zie react.dev: "adjusting state when a prop changes")
  const [vorigeOpen, setVorigeOpen] = useState(open)
  if (open !== vorigeOpen) {
    setVorigeOpen(open)
    if (open) {
      setInvoer('')
      setFase('invoer')
      setFoutTekst(null)
      setBedrijfsnaam('')
      setBedrijfId('')
    }
  }

  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus())
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

  const toonInvoer = fase === 'invoer' || fase === 'valideren' || fase === 'fout'

  return (
    <DialogRoot open={open} onOpenChange={(o) => { if (!o) onSluit() }}>
      <DialogContent
        style={{ width: 'min(92vw, 448px)' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 20, paddingRight: 24 }}>
          <div
            aria-hidden
            style={{
              width: 40, height: 40, borderRadius: 'var(--radius-md)', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--mentaforce-primary)', color: 'var(--bg-app)',
              fontWeight: 700, fontSize: 16,
            }}
          >
            HR
          </div>
          <div>
            <DialogTitle style={{ fontSize: 18, paddingRight: 0, lineHeight: 1.3 }}>Koppel aan werkgever</DialogTitle>
            <DialogDescription style={{ fontSize: 12, marginTop: 2 }}>
              Voer de HR code in die je van je werkgever hebt ontvangen
            </DialogDescription>
          </div>
        </div>

        {/* FASE: invoer / valideren / fout */}
        {toonInvoer && (
          <div>
            <label htmlFor="hr-code-invoer" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: 8 }}>
              HR Code
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="hr-code-invoer"
                ref={inputRef}
                type="text"
                value={invoer}
                onChange={e => handleInvoer(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fase !== 'valideren' && valideerCode()}
                placeholder="FIT-X2K"
                maxLength={7}
                disabled={fase === 'valideren'}
                aria-invalid={fase === 'fout' || undefined}
                aria-describedby={foutTekst ? 'hr-code-fout' : 'hr-code-hint'}
                className="mf-ui-control"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  fontSize: 22,
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  textAlign: 'center',
                  letterSpacing: '0.25em',
                  color: 'var(--text-1)',
                  background: 'var(--bg-subtle)',
                  border: `1px solid ${fase === 'fout' ? 'var(--mf-red)' : invoer.length === 7 ? 'var(--mentaforce-primary)' : 'var(--border-strong)'}`,
                  borderRadius: 'var(--radius-md)',
                  outline: 'none',
                  boxSizing: 'border-box',
                  opacity: fase === 'valideren' ? 0.5 : 1,
                }}
                spellCheck={false}
                autoComplete="off"
              />
              {fase === 'valideren' && (
                <div style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)' }}>
                  <Loader2 size={20} aria-hidden style={{ color: 'var(--mentaforce-primary)', animation: 'mf-spin 0.7s linear infinite' }} />
                </div>
              )}
            </div>

            {foutTekst && (
              <div id="hr-code-fout" role="alert" style={{
                marginTop: 12, borderRadius: 'var(--radius-md)', border: '1px solid var(--mf-red)',
                background: 'var(--mf-red-light)', padding: '10px 14px', fontSize: 14, color: 'var(--mf-red)',
              }}>
                {foutTekst}
              </div>
            )}

            <p id="hr-code-hint" style={{ fontSize: 12, color: 'var(--text-4)', marginTop: 12, textAlign: 'center' }}>
              Je werkgever vindt de HR code op het HR-dashboard van MentaForce.
            </p>

            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <Button variant="secondary" onClick={onSluit}>Annuleren</Button>
              <Button
                onClick={() => {
                  setFoutTekst(null)
                  if (fase === 'fout') setFase('invoer')
                  else valideerCode()
                }}
                loading={fase === 'valideren'}
                disabled={invoer.length < 7}
                style={{ flex: 1 }}
              >
                {fase === 'fout' ? 'Opnieuw proberen' : fase === 'valideren' ? 'Controleren...' : 'Controleer code'}
              </Button>
            </div>
          </div>
        )}

        {/* FASE: bevestig */}
        {fase === 'bevestig' && (
          <div>
            <div style={{
              borderRadius: 'var(--radius-md)', border: '1px solid var(--mentaforce-primary)',
              background: 'var(--mentaforce-primary-light)', padding: 20, marginBottom: 20, textAlign: 'center',
            }}>
              <p style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4, color: 'var(--mentaforce-primary)' }}>
                Bedrijf gevonden
              </p>
              <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)' }}>{bedrijfsnaam}</p>
              <p style={{ fontSize: 14, color: 'var(--text-3)', marginTop: 4 }}>
                Code: <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{invoer}</span>
              </p>
            </div>

            <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 24, lineHeight: 1.6 }}>
              Wil je je account koppelen aan <strong>{bedrijfsnaam}</strong>?
              Je HR-afdeling krijgt toegang tot anonieme welzijnsdata van jouw team — nooit persoonsgebonden inzichten.
            </p>

            <div style={{ display: 'flex', gap: 12 }}>
              <Button variant="secondary" onClick={() => setFase('invoer')}>Terug</Button>
              <Button onClick={koppelAanBedrijf} style={{ flex: 1 }}>
                Ja, koppel mij aan {bedrijfsnaam}
              </Button>
            </div>
          </div>
        )}

        {/* FASE: koppelen (laden) */}
        {fase === 'koppelen' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0', gap: 16 }}>
            <Loader2 size={48} aria-hidden style={{ color: 'var(--mentaforce-primary)', animation: 'mf-spin 0.7s linear infinite' }} />
            <p style={{ fontSize: 14, color: 'var(--text-3)' }}>Koppeling verwerken...</p>
          </div>
        )}

        {/* FASE: klaar */}
        {fase === 'klaar' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0', textAlign: 'center' }}>
            <div
              aria-hidden
              style={{
                width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 20, background: 'var(--mentaforce-primary-light)',
              }}
            >
              <CheckCircle2 size={36} style={{ color: 'var(--mentaforce-primary)' }} />
            </div>
            <h3 style={{ fontWeight: 800, color: 'var(--text-1)', fontSize: 20, marginBottom: 8 }}>Gekoppeld!</h3>
            <p style={{ fontSize: 14, color: 'var(--text-3)', marginBottom: 24 }}>
              Je account is succesvol gekoppeld aan <strong>{bedrijfsnaam}</strong>.
            </p>
            <Button onClick={onSluit} style={{ width: '100%' }}>Sluiten</Button>
          </div>
        )}
      </DialogContent>
    </DialogRoot>
  )
}
