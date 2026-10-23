'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Mail, Printer, Send, X } from 'lucide-react'
import { haal } from '@/components/club/afspraken/haal'
import { stuur } from '@/components/club/leden/stuur'
import './app-uitnodigen.css'

// "Leden uitnodigen voor de app" boven de ledenlijst. Een venster met de
// keuze van vestigingen en "alleen leden zonder app". Eerst rekent de server
// uit hoeveel mails er zouden gaan (en hoeveel leden geen e-mailadres hebben);
// pas na bevestigen worden ze in de wachtrij gezet. De cron verstuurt ze rustig.

interface VestigingKeuze {
  sleutel: string
  naam: string
}

interface Props {
  vestigingen: VestigingKeuze[]
  /** De vestiging die nu open staat: standaard aangevinkt. */
  huidig: string
  posterHref: string
}

interface Telling {
  teSturen: number
  zonderEmail: number
  heeftApp: number
  afgemeld: number
  demo: number
  blokkade: string | null
}

function getal(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0
}

function leesTelling(d: Record<string, unknown>): Telling {
  return {
    teSturen: getal(d.teSturen), zonderEmail: getal(d.zonderEmail), heeftApp: getal(d.heeftApp), afgemeld: getal(d.afgemeld), demo: getal(d.demo),
    blokkade: typeof d.blokkade === 'string' ? d.blokkade : null,
  }
}

function leden(n: number): string {
  return n === 1 ? '1 lid' : `${n} leden`
}

function TellingLijst({ t, zonderApp }: { t: Telling; zonderApp: boolean }) {
  return (
    <dl className="club-appuit-telling">
      <div className="club-appuit-hoofd"><dt>Krijgen een uitnodiging</dt><dd>{t.teSturen}</dd></div>
      <div><dt>Zonder (geldig) e-mailadres</dt><dd>{t.zonderEmail}</dd></div>
      {zonderApp ? <div><dt>Hebben de app al</dt><dd>{t.heeftApp}</dd></div> : null}
      {t.afgemeld ? <div><dt>Afgemeld voor mail</dt><dd>{t.afgemeld}</dd></div> : null}
      {t.demo ? <div><dt>Demo-leden (nooit mail)</dt><dd>{t.demo}</dd></div> : null}
    </dl>
  )
}

export function UitnodigApp({ vestigingen, huidig, posterHref }: Props) {
  const venster = useRef<HTMLDialogElement>(null)
  const [gekozen, setGekozen] = useState<string[]>([huidig])
  const [zonderApp, setZonderApp] = useState(true)
  const [telling, setTelling] = useState<Telling | null>(null)
  const [laden, setLaden] = useState(false)
  const [bezig, setBezig] = useState(false)
  const [melding, setMelding] = useState<{ tekst: string; fout: boolean } | null>(null)

  const lopend = useRef<AbortController | null>(null)

  useEffect(() => () => lopend.current?.abort(), [])

  /** Laat de server tellen wie een uitnodiging zou krijgen bij deze keuze. */
  function tel(keuze: string[], zonder: boolean) {
    lopend.current?.abort()
    if (keuze.length === 0) {
      setTelling(null)
      setLaden(false)
      return
    }
    const stop = new AbortController()
    lopend.current = stop
    const zoek = new URLSearchParams([...keuze.map((v) => ['v', v]), ['zonder', zonder ? '1' : '0']])
    setLaden(true)
    void haal(`/api/club/leden/app-uitnodigen?${zoek.toString()}`, stop.signal).then((r) => {
      if (stop.signal.aborted) return
      setLaden(false)
      if (r.ok) setTelling(leesTelling(r.data))
      else if (r.fout) setMelding({ tekst: r.fout, fout: true })
    })
  }

  function openen() {
    setMelding(null)
    venster.current?.showModal()
    tel(gekozen, zonderApp)
  }

  function sluiten() {
    venster.current?.close()
  }

  function wissel(sleutel: string) {
    setMelding(null)
    const nieuw = gekozen.includes(sleutel) ? gekozen.filter((v) => v !== sleutel) : [...gekozen, sleutel]
    setGekozen(nieuw)
    tel(nieuw, zonderApp)
  }

  function wisselZonderApp(aan: boolean) {
    setMelding(null)
    setZonderApp(aan)
    tel(gekozen, aan)
  }

  async function verstuur() {
    setBezig(true)
    setMelding(null)
    const r = await stuur('/api/club/leden/app-uitnodigen', 'POST', { vestigingen: gekozen, alleenZonderApp: zonderApp })
    setBezig(false)
    if (!r.ok) {
      setMelding({ tekst: r.fout, fout: true })
      return
    }
    const d = (r.data ?? {}) as Record<string, unknown>
    const gepland = getal(d.gepland)
    const al = getal(d.alVandaag)
    const duur = typeof d.duur === 'string' ? d.duur : ''
    const extra = al ? ` ${leden(al)} kreeg vandaag al een uitnodiging en krijgt er niet nog een.` : ''
    setMelding({ tekst: `${leden(gepland)} uitgenodigd.${extra} ${duur}`.trim(), fout: false })
    setTelling(leesTelling({ ...d, teSturen: 0 }))
  }

  const kan = !bezig && !laden && telling !== null && telling.teSturen > 0 && !telling.blokkade

  return (
    <>
      <button type="button" className="club-knop" onClick={openen}>
        <Mail size={16} aria-hidden /> Leden uitnodigen voor de app
      </button>
      <dialog ref={venster} className="club-appuit" aria-labelledby="club-appuit-kop" onClose={() => lopend.current?.abort()}>
        <header className="club-appuit-kop">
          <div>
            <p className="club-boventitel">Ledenapp</p>
            <h2 id="club-appuit-kop">Leden uitnodigen</h2>
          </div>
          <button type="button" className="club-appuit-sluit" onClick={sluiten} aria-label="Sluiten"><X size={18} aria-hidden /></button>
        </header>
        <p className="club-appuit-uitleg">
          Elk lid krijgt een mail met een persoonlijke link. Daarmee bevestigt het lid zijn e-mailadres, kiest het een wachtwoord en zet het de app op het beginscherm. Per lid hooguit een uitnodiging per dag.
        </p>

        <fieldset className="club-appuit-groep">
          <legend>Vestigingen</legend>
          <div className="club-appuit-keuzes">
            {vestigingen.map((v) => (
              <label key={v.sleutel} className="club-appuit-keuze" data-aan={gekozen.includes(v.sleutel) || undefined}>
                <input type="checkbox" checked={gekozen.includes(v.sleutel)} onChange={() => wissel(v.sleutel)} />
                <span>{v.naam}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <label className="club-appuit-schakel">
          <input type="checkbox" checked={zonderApp} onChange={(e) => wisselZonderApp(e.target.checked)} />
          <span>Alleen leden die de app nog niet gebruiken</span>
        </label>

        <section className="club-appuit-uitkomst" aria-live="polite" data-laden={laden || undefined}>
          {gekozen.length === 0 ? <p className="club-hint">Kies minstens een vestiging.</p> : telling ? <TellingLijst t={telling} zonderApp={zonderApp} /> : <p className="club-hint">Even tellen...</p>}
          {telling?.blokkade ? <p className="club-melding club-melding--fout" role="alert">{telling.blokkade}</p> : null}
          {melding ? <p className={`club-melding ${melding.fout ? 'club-melding--fout' : 'club-melding--ok'}`} role={melding.fout ? 'alert' : 'status'}>{melding.tekst}</p> : null}
        </section>

        <footer className="club-appuit-voet">
          <Link href={posterHref} className="club-knop club-knop--stil" target="_blank" rel="noopener">
            <Printer size={16} aria-hidden /> Poster voor de club
          </Link>
          <button type="button" className="club-knop club-knop--primair" onClick={verstuur} disabled={!kan}>
            <Send size={16} aria-hidden /> {bezig ? 'Bezig...' : telling && telling.teSturen > 0 ? `${leden(telling.teSturen)} uitnodigen` : 'Uitnodigen'}
          </button>
        </footer>
      </dialog>
    </>
  )
}
