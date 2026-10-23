'use client'

import { useEffect, useRef, useState, type DragEvent } from 'react'
import { useRouter } from 'next/navigation'
import { ImageUp, Pipette } from 'lucide-react'
import { LOGO_TYPES, MAX_LOGO_BYTES, MAX_NAAM } from '@/lib/club/kern/organisatie-invoer'
import { kleurVoorstel, type KleurVoorstel } from '@/lib/club/start/logo-kleur'
import { stuur } from '@/components/club/leden/stuur'
import type { HuisstijlWaarden } from '@/components/club/huisstijl/HuisstijlPortaal'
import { KleurBlok } from '@/components/club/huisstijl/KleurBlok'
import { AdresBlok } from '@/components/club/huisstijl/AdresBlok'
import { kleurUitAfbeelding } from './logo-kleur-browser'
import { LedenappVoorbeeld } from './LedenappVoorbeeld'
import { StartVoet, type StartVoetProps } from './StartVoet'

// Stap 2: logo uploaden, en de accentkleur komt er vanzelf uit (de dominante
// kleur, met de contrastcorrectie van huisstijl.ts). Rechts een levende
// ledenapp. Het logo en het eigen adres worden meteen opgeslagen; naam, kleur
// en thema bij "verder". Zelf een kleur kiezen kan hier ook.

/** Huisstijl en onderdelen samen naar de API (die wil altijd alles). */
export async function bewaarOrganisatie(w: HuisstijlWaarden): Promise<string | null> {
  const uit = await stuur('/api/club/organisatie', 'PATCH', { ...w, slogan: w.slogan ?? '' })
  return uit.ok ? null : uit.fout
}

async function upload(bestand: File): Promise<string | null> {
  const form = new FormData()
  form.append('logo', bestand)
  try {
    const res = await fetch('/api/club/organisatie/logo', { method: 'POST', body: form })
    if (res.ok) return null
    const data: unknown = await res.json().catch(() => null)
    return typeof data === 'object' && data !== null && 'fout' in data && typeof data.fout === 'string' ? data.fout : 'Uploaden lukte niet.'
  } catch {
    return 'Geen verbinding. Probeer het opnieuw.'
  }
}

interface StapHuisstijlProps {
  organisatie: HuisstijlWaarden
  logoUrl: string | null
  ingebouwdLogo: boolean
  /** Het eigen adres (aiyourgym.com/<slug>), of null als het nog niet gekozen is. */
  slug: string | null
  subdomeinen: boolean
  voet: Omit<StartVoetProps, 'voorVerder' | 'primair'>
}

export function StapHuisstijl({ organisatie, logoUrl, ingebouwdLogo, slug, subdomeinen, voet }: StapHuisstijlProps) {
  const router = useRouter()
  const invoer = useRef<HTMLInputElement>(null)
  const [waarden, setWaarden] = useState<HuisstijlWaarden>(organisatie)
  const [voorbeeld, setVoorbeeld] = useState<string | null>(null)
  const [uitLogo, setUitLogo] = useState<KleurVoorstel | 'geen' | null>(null)
  const [bezig, setBezig] = useState(false)
  const [sleept, setSleept] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const gewijzigd = JSON.stringify(waarden) !== JSON.stringify(organisatie)
  const logo = voorbeeld ?? logoUrl

  useEffect(() => () => {
    if (voorbeeld) URL.revokeObjectURL(voorbeeld)
  }, [voorbeeld])

  function zet<K extends keyof HuisstijlWaarden>(veld: K, waarde: HuisstijlWaarden[K]) {
    setFout(null)
    setWaarden((w) => ({ ...w, [veld]: waarde }))
  }

  /** Kleur uit het logo halen en meteen gebruiken. */
  async function haalKleur(bron: Blob | string) {
    const kleur = await kleurUitAfbeelding(bron)
    if (!kleur) return setUitLogo('geen')
    setUitLogo(kleurVoorstel(kleur, waarden.thema))
    zet('kleurAccent', kleur)
  }

  async function kies(bestand: File | undefined) {
    if (!bestand) return
    setFout(null)
    if (!LOGO_TYPES[bestand.type]) return setFout('Kies een PNG, WebP, JPG of SVG.')
    if (bestand.size > MAX_LOGO_BYTES) return setFout('Het logo mag maximaal 1 MB zijn.')
    setBezig(true)
    setVoorbeeld(URL.createObjectURL(bestand))
    const [melding] = await Promise.all([upload(bestand), haalKleur(bestand)])
    setBezig(false)
    if (melding) {
      setVoorbeeld(null)
      return setFout(melding)
    }
    router.refresh()
  }

  function laat(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setSleept(false)
    void kies(e.dataTransfer.files[0])
  }

  async function voorVerder(): Promise<boolean> {
    if (!gewijzigd) return true
    const melding = await bewaarOrganisatie(waarden)
    if (melding) {
      setFout(melding)
      return false
    }
    router.refresh()
    return true
  }

  const voorstel = uitLogo && uitLogo !== 'geen' ? kleurVoorstel(uitLogo.kleur, waarden.thema) : null
  return (
    <>
      <div className="club-start-huisstijl">
        <section className="club-start-blok club-start-huisstijl-logo" aria-labelledby="start-logo-kop">
          <h2 id="start-logo-kop">Je logo</h2>
          <div
            className="club-start-dropzone"
            data-sleept={sleept || undefined}
            onDragOver={(e) => {
              e.preventDefault()
              setSleept(true)
            }}
            onDragLeave={() => setSleept(false)}
            onDrop={laat}
          >
            <div className="club-start-dropzone-logo">
              {logo ? <img src={logo} alt={`Logo van ${waarden.naam}`} /> : ingebouwdLogo ? <span className="club-zacht">Het ingebouwde logo staat er al</span> : <ImageUp aria-hidden size={30} strokeWidth={1.5} />}
            </div>
            <div className="club-start-dropzone-tekst">
              <button type="button" className="club-knop club-knop--primair" disabled={bezig} onClick={() => invoer.current?.click()}>
                <ImageUp aria-hidden size={16} /> {bezig ? 'Bezig...' : logo ? 'Ander logo' : 'Logo uploaden'}
              </button>
              <span className="club-hint">Of sleep het hierheen. PNG of SVG met doorzichtige achtergrond werkt het mooist, maximaal 1 MB.</span>
            </div>
            <input
              ref={invoer}
              type="file"
              accept="image/png,image/webp,image/svg+xml,image/jpeg"
              hidden
              onChange={(e) => {
                void kies(e.target.files?.[0])
                e.target.value = ''
              }}
            />
          </div>
          <div aria-live="polite">
            {voorstel && (
              <p className="club-start-logokleur">
                <span className="club-start-logokleur-staal" style={{ background: voorstel.knop }} aria-hidden />
                <span>
                  <strong>Kleur uit je logo: {voorstel.kleur}</strong>
                  {voorstel.aangepast ? ` Voor genoeg contrast gebruiken we op knoppen ${voorstel.knop}.` : ' Staat overal goed leesbaar.'}
                </span>
              </p>
            )}
            {uitLogo === 'geen' && <p className="club-melding">Je logo heeft geen duidelijke kleur (zwart, wit of grijs). Kies hieronder zelf een accentkleur.</p>}
          </div>
          {logoUrl && !voorbeeld && !uitLogo && (
            <button type="button" className="club-knop club-knop--klein club-start-pipet" onClick={() => void haalKleur(logoUrl)}>
              <Pipette aria-hidden size={14} /> Kleur uit mijn logo halen
            </button>
          )}
          <label className="club-veld">
            <span>Naam van de sportschool</span>
            <input className="club-invoer" value={waarden.naam} maxLength={MAX_NAAM} onChange={(e) => zet('naam', e.target.value)} />
          </label>
          <AdresBlok slug={slug} naam={waarden.naam} subdomeinen={subdomeinen} />
        </section>
        <LedenappVoorbeeld naam={waarden.naam} kleur={waarden.kleurAccent} thema={waarden.thema} logo={logo} />
        <div className="club-start-huisstijl-kleur">
          <KleurBlok kleur={waarden.kleurAccent} thema={waarden.thema} onKleur={(k) => zet('kleurAccent', k)} onThema={(t) => zet('thema', t)} />
          {fout && <p className="club-melding club-melding--fout" role="alert">{fout}</p>}
        </div>
      </div>
      <StartVoet {...voet} voorVerder={voorVerder} primair={gewijzigd ? 'Opslaan en verder' : undefined} />
    </>
  )
}
