'use client'

import { useId, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { GRENZEN, SOORTEN, type MeldingSoort } from '@/lib/club/hulp/melding'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { HULP } from '@/lib/aiyourgym/taal/woorden/club/hulp'

// "Vraag of probleem melden": opgeslagen in Club (club_support). Er gaat geen
// mail naar buiten; het antwoord verschijnt bij Mijn meldingen.

type Fouten = Record<string, string>

function foutenUit(json: unknown, standaard: string): { fout: string; fouten: Fouten } {
  const j = (json ?? {}) as { fout?: unknown; fouten?: unknown }
  const fouten = typeof j.fouten === 'object' && j.fouten !== null ? (j.fouten as Fouten) : {}
  return { fout: typeof j.fout === 'string' ? j.fout : standaard, fouten }
}

function Fout({ id, tekst }: { id: string; tekst: string | undefined }) {
  return tekst ? (
    <p id={id} className="club-fout">
      {tekst}
    </p>
  ) : null
}

export function MeldFormulier() {
  const router = useRouter()
  const id = useId()
  const tekst = useTekst(HULP)
  const t = tekst.formulier
  const [soort, setSoort] = useState<MeldingSoort>('vraag')
  const [onderwerp, setOnderwerp] = useState('')
  const [beschrijving, setBeschrijving] = useState('')
  const [pagina, setPagina] = useState('')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const [fouten, setFouten] = useState<Fouten>({})
  const [klaar, setKlaar] = useState(false)

  async function verstuur(e: FormEvent) {
    e.preventDefault()
    setBezig(true)
    setFout(null)
    setFouten({})
    setKlaar(false)
    try {
      const res = await fetch('/api/club/hulp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ soort, onderwerp, beschrijving, pagina }) })
      const json: unknown = await res.json().catch(() => null)
      if (res.ok) {
        setKlaar(true)
        setOnderwerp('')
        setBeschrijving('')
        setPagina('')
        router.refresh()
      } else {
        const f = foutenUit(json, t.mislukt)
        setFout(f.fout)
        setFouten(f.fouten)
      }
    } catch {
      setFout(t.geenVerbinding)
    }
    setBezig(false)
  }

  const foutId = (veld: string) => `${id}-${veld}-fout`
  const beschrijf = (veld: string, extra?: string) => [fouten[veld] ? foutId(veld) : null, extra ?? null].filter(Boolean).join(' ') || undefined

  return (
    <form className="club-hulp-formulier" onSubmit={verstuur} noValidate>
      <fieldset className="club-hulp-soorten">
        <legend className="club-label">{t.soort}</legend>
        <div className="club-segment">
          {SOORTEN.map((s) => (
            <button key={s} type="button" aria-pressed={soort === s} onClick={() => setSoort(s)}>
              {tekst.soort[s]}
            </button>
          ))}
        </div>
        <Fout id={foutId('soort')} tekst={fouten.soort} />
      </fieldset>
      <label className="club-veld">
        <span>{t.onderwerp}</span>
        <input className="club-invoer" value={onderwerp} onChange={(e) => setOnderwerp(e.target.value)} maxLength={GRENZEN.onderwerp.max} required aria-invalid={Boolean(fouten.onderwerp)} aria-describedby={beschrijf('onderwerp')} placeholder={t.onderwerpPlaats} />
        <Fout id={foutId('onderwerp')} tekst={fouten.onderwerp} />
      </label>
      <label className="club-veld">
        <span>{t.beschrijving}</span>
        <textarea className="club-invoer" rows={6} value={beschrijving} onChange={(e) => setBeschrijving(e.target.value)} maxLength={GRENZEN.beschrijving.max} required aria-invalid={Boolean(fouten.beschrijving)} aria-describedby={beschrijf('beschrijving', `${id}-tip`)} placeholder={t.beschrijvingPlaats} />
        <span id={`${id}-tip`} className="club-hint">
          {t.beschrijvingTip}
        </span>
        <Fout id={foutId('beschrijving')} tekst={fouten.beschrijving} />
      </label>
      <label className="club-veld">
        <span>{t.pagina}</span>
        <input className="club-invoer" value={pagina} onChange={(e) => setPagina(e.target.value)} maxLength={GRENZEN.pagina} aria-invalid={Boolean(fouten.pagina)} aria-describedby={beschrijf('pagina', `${id}-pagina-tip`)} placeholder="/club/rooster" />
        <span id={`${id}-pagina-tip`} className="club-hint">
          {t.paginaTip}
        </span>
        <Fout id={foutId('pagina')} tekst={fouten.pagina} />
      </label>
      <div className="club-hulp-verstuur">
        <button type="submit" className="club-knop club-knop--primair" disabled={bezig} aria-busy={bezig}>
          {bezig ? t.bezig : t.versturen}
        </button>
        {klaar && (
          <p className="club-melding club-melding--ok" role="status">
            {t.ontvangen}
          </p>
        )}
        {fout && (
          <p className="club-melding club-melding--fout" role="alert">
            {fout}
          </p>
        )}
      </div>
    </form>
  )
}
