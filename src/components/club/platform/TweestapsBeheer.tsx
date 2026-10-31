'use client'

import { useState, type FormEvent } from 'react'
import { ShieldCheck, ShieldAlert } from 'lucide-react'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { TWEESTAPS } from '@/lib/aiyourgym/taal/woorden/club/tweestaps'
import { foutTekst } from '@/lib/club/tweestaps/melding'
import { Herstelcodes } from './Herstelcodes'

// Tweestapsverificatie van het master account: instellen met QR en sleutel,
// bevestigen met een code, de herstelcodes een keer tonen, en uitzetten met een
// code. Alle teksten uit het woordenboek TWEESTAPS.

export interface TweestapsStand {
  aan: boolean
  /** Datum (al opgemaakt) waarop het aan ging. */
  sinds: string | null
  herstelOver: number
  /** Sleutel op de server en de tabel bestaat. */
  kanAan: boolean
  probleem: 'geenSleutel' | 'geenTabel' | 'leesFout' | null
}

const API = '/api/club/platform/tweestaps'

type Antwoord = { ok: true; data: Record<string, unknown> } | { ok: false; fout: string }

async function vraag(body: Record<string, string>, taal: Taal): Promise<Antwoord> {
  try {
    const res = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const data: unknown = await res.json().catch(() => null)
    if (res.ok && typeof data === 'object' && data !== null) return { ok: true, data: data as Record<string, unknown> }
    return { ok: false, fout: foutTekst(data, taal) }
  } catch {
    return { ok: false, fout: TWEESTAPS[taal].fouten.verbinding }
  }
}

type Fase =
  | { soort: 'rust' }
  | { soort: 'scannen'; qr: string | null; geheim: string }
  | { soort: 'herstel'; codes: string[] }
  | { soort: 'klaar'; aan: boolean }

export function TweestapsBeheer({ stand }: { stand: TweestapsStand }) {
  const taal = useTaal()
  const t = useTekst(TWEESTAPS)
  const [fase, setFase] = useState<Fase>({ soort: 'rust' })
  const [code, setCode] = useState('')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)

  async function doe(body: Record<string, string>, klaar: (data: Record<string, unknown>) => void) {
    if (bezig) return
    setBezig(true)
    setFout(null)
    const uit = await vraag(body, taal)
    setBezig(false)
    if (!uit.ok) return setFout(uit.fout)
    setCode('')
    klaar(uit.data)
  }

  const start = () =>
    void doe({ actie: 'start' }, (d) => setFase({ soort: 'scannen', qr: typeof d.qr === 'string' ? d.qr : null, geheim: typeof d.geheim === 'string' ? d.geheim : '' }))

  function metCode(actie: 'bevestig' | 'uit', klaar: (data: Record<string, unknown>) => void) {
    return (e: FormEvent) => {
      e.preventDefault()
      if (!code.trim()) return setFout(t.fouten.leeg)
      void doe({ actie, code }, klaar)
    }
  }
  const bevestig = metCode('bevestig', (d) => setFase({ soort: 'herstel', codes: Array.isArray(d.herstelcodes) ? d.herstelcodes.map(String) : [] }))
  const zetUit = metCode('uit', () => setFase({ soort: 'klaar', aan: false }))

  const melding = fout && (
    <p className="club-melding club-melding--fout" role="alert">
      {fout}
    </p>
  )
  const codeVeld = (label: string, numeriek: boolean) => (
    <label className="club-veld">
      <span>{label}</span>
      <input className="club-invoer club-2fa-code" inputMode={numeriek ? 'numeric' : 'text'} autoComplete="one-time-code" maxLength={20} value={code} onChange={(e) => setCode(e.target.value)} />
    </label>
  )

  if (fase.soort === 'herstel') return <Herstelcodes codes={fase.codes} onKlaar={() => setFase({ soort: 'klaar', aan: true })} />
  if (fase.soort === 'klaar') {
    return (
      <section className="club-kaart club-2fa" role="status" data-stand={fase.aan ? 'aan' : 'uit'}>
        <h2 className="club-2fa-kop">
          {fase.aan ? <ShieldCheck size={18} aria-hidden /> : <ShieldAlert size={18} aria-hidden />} {t.pagina.kop}
        </h2>
        <p>{fase.aan ? t.instellen.klaarTekst : t.uitzetten.klaar}</p>
      </section>
    )
  }

  if (stand.aan) {
    return (
      <section className="club-kaart club-2fa" aria-labelledby="tweestaps-kop" data-stand="aan">
        <h2 id="tweestaps-kop" className="club-2fa-kop">
          <ShieldCheck size={18} aria-hidden /> {t.pagina.kop}
        </h2>
        <p>
          {stand.sinds ? `${t.pagina.aan(stand.sinds)} ` : ''}
          {t.pagina.herstelOver(stand.herstelOver)}
        </p>
        <form className="club-2fa-form" onSubmit={zetUit} noValidate>
          <h3>{t.uitzetten.kop}</h3>
          <p className="club-2fa-uitleg">{t.uitzetten.uitleg}</p>
          {codeVeld(t.uitzetten.code, false)}
          <div className="club-acties">
            <button type="submit" className="club-knop" disabled={bezig} aria-busy={bezig}>
              {bezig ? t.instellen.bezig : t.uitzetten.knop}
            </button>
          </div>
          {melding}
        </form>
      </section>
    )
  }

  return (
    <section className="club-kaart club-2fa" aria-labelledby="tweestaps-kop" data-stand="uit">
      <h2 id="tweestaps-kop" className="club-2fa-kop">
        <ShieldAlert size={18} aria-hidden /> {t.pagina.kop}
      </h2>
      <p>{t.pagina.uit}</p>
      {stand.probleem && (
        <p className="club-melding club-melding--fout" role="note">
          {t.pagina[stand.probleem]}
        </p>
      )}
      {stand.kanAan && fase.soort === 'rust' && (
        <div className="club-acties">
          <button type="button" className="club-knop club-knop--primair" onClick={start} disabled={bezig} aria-busy={bezig}>
            {bezig ? t.instellen.bezig : t.instellen.start}
          </button>
        </div>
      )}
      {fase.soort === 'scannen' && (
        <div className="club-2fa-instellen">
          <p>{t.instellen.stap1}</p>
          {/* eslint-disable-next-line @next/next/no-img-element -- QR als data-URL van de server */}
          {fase.qr && <img className="club-2fa-qr" src={fase.qr} alt={t.instellen.qrAlt} width={200} height={200} />}
          <p className="club-2fa-uitleg">{t.instellen.handmatig}</p>
          <code className="club-2fa-geheim">{fase.geheim}</code>
          <form className="club-2fa-form" onSubmit={bevestig} noValidate>
            {codeVeld(t.instellen.stap2, true)}
            <div className="club-acties">
              <button type="submit" className="club-knop club-knop--primair" disabled={bezig} aria-busy={bezig}>
                {bezig ? t.instellen.bezig : t.instellen.bevestig}
              </button>
              <button type="button" className="club-knop" onClick={start} disabled={bezig}>
                {t.instellen.opnieuw}
              </button>
            </div>
          </form>
        </div>
      )}
      {melding}
    </section>
  )
}
