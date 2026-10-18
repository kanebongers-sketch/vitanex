'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { stuur } from '@/components/club/leden/stuur'
import { VERKOOP_STATUS_LABEL, euro, type Verkoop } from '@/lib/club/betalen/model'
import { magTerugbetalen } from '@/lib/club/betalen/regels'

// Verkopen en terugbetalingen, nieuwste eerst. Terugbetalen gaat altijd om het
// hele bedrag; Stripe meldt de uitkomst via de webhook, daarna vervalt het tegoed.

export interface VerkoopRegel extends Verkoop {
  lidNaam: string
}

const DATUM = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam' })

export function VerkopenLijst({ verkopen }: { verkopen: VerkoopRegel[] }) {
  const router = useRouter()
  const [bezig, start] = useTransition()
  const [bericht, setBericht] = useState<{ tekst: string; fout: boolean } | null>(null)

  function terug(v: VerkoopRegel) {
    if (!window.confirm(`${euro(v.bedragCent)} terugbetalen aan ${v.lidNaam}? Het tegoed van deze aankoop vervalt.`)) return
    start(async () => {
      const uit = await stuur(`/api/club/betalen/verkopen/${v.id}/terugbetalen`, 'POST')
      setBericht(uit.ok ? { tekst: 'Terugbetaling aangevraagd. Stripe verwerkt hem binnen enkele minuten.', fout: false } : { tekst: uit.fout, fout: true })
      router.refresh()
    })
  }

  return (
    <section aria-labelledby="betalen-verkopen-kop">
      <h2 id="betalen-verkopen-kop" className="club-betalen-kop">Verkopen</h2>
      <div aria-live="polite">{bericht && <p className={`club-melding ${bericht.fout ? 'club-melding--fout' : ''}`} role="status">{bericht.tekst}</p>}</div>
      {verkopen.length === 0 ? (
        <p className="club-hint">Nog geen verkopen.</p>
      ) : (
        <div className="club-betalen-tabel-wrap">
          <table className="club-betalen-tabel">
            <thead>
              <tr><th scope="col">Wanneer</th><th scope="col">Lid</th><th scope="col">Product</th><th scope="col">Status</th><th scope="col" className="bedrag">Bedrag</th><th scope="col"><span className="sr-only">Actie</span></th></tr>
            </thead>
            <tbody>
              {verkopen.map((v) => (
                <tr key={v.id}>
                  <td>{DATUM.format(new Date(v.betaaldOp ?? v.aangemaaktOp))}</td>
                  <td>{v.lidNaam}</td>
                  <td>{v.productNaam}</td>
                  <td>
                    <span className="club-betalen-status" data-status={v.status}>{v.terugbetalingAangevraagd && v.status === 'betaald' ? 'Terugbetaling loopt' : VERKOOP_STATUS_LABEL[v.status]}</span>
                    {v.terugbetaaldCent > 0 && v.status !== 'terugbetaald' && <span className="club-hint"> {euro(v.terugbetaaldCent)} terug</span>}
                  </td>
                  <td className="bedrag">{euro(v.bedragCent)}</td>
                  <td>
                    {magTerugbetalen(v) && (
                      <button type="button" className="club-knop club-knop--klein" disabled={bezig} onClick={() => terug(v)}>Terugbetalen</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
