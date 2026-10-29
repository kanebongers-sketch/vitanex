'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { stuur } from '@/components/club/leden/stuur'
import { euro, type Verkoop } from '@/lib/club/betalen/model'
import { LOCALE } from '@/lib/aiyourgym/taal/taal'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { BETALEN } from '@/lib/aiyourgym/taal/woorden/club/betalen'
import { magTerugbetalen } from '@/lib/club/betalen/regels'

// Verkopen en terugbetalingen, nieuwste eerst. Terugbetalen gaat altijd om het
// hele bedrag; Stripe meldt de uitkomst via de webhook, daarna vervalt het tegoed.

export interface VerkoopRegel extends Verkoop {
  lidNaam: string
}

export function VerkopenLijst({ verkopen }: { verkopen: VerkoopRegel[] }) {
  const router = useRouter()
  const [bezig, start] = useTransition()
  const [bericht, setBericht] = useState<{ tekst: string; fout: boolean } | null>(null)
  const taal = useTaal()
  const tb = useTekst(BETALEN)
  const t = tb.verkopen
  const datum = new Intl.DateTimeFormat(LOCALE[taal], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam' })

  function terug(v: VerkoopRegel) {
    if (!window.confirm(t.terugVraag(euro(v.bedragCent, taal), v.lidNaam))) return
    start(async () => {
      const uit = await stuur(`/api/club/betalen/verkopen/${v.id}/terugbetalen`, 'POST')
      setBericht(uit.ok ? { tekst: t.aangevraagd, fout: false } : { tekst: uit.fout, fout: true })
      router.refresh()
    })
  }

  return (
    <section aria-labelledby="betalen-verkopen-kop">
      <h2 id="betalen-verkopen-kop" className="club-betalen-kop">{t.titel}</h2>
      <div aria-live="polite">{bericht && <p className={`club-melding ${bericht.fout ? 'club-melding--fout' : ''}`} role="status">{bericht.tekst}</p>}</div>
      {verkopen.length === 0 ? (
        <p className="club-hint">{t.leeg}</p>
      ) : (
        <div className="club-betalen-tabel-wrap">
          <table className="club-betalen-tabel">
            <thead>
              <tr><th scope="col">{t.wanneer}</th><th scope="col">{t.lid}</th><th scope="col">{t.product}</th><th scope="col">{t.status}</th><th scope="col" className="bedrag">{t.bedrag}</th><th scope="col"><span className="sr-only">{t.actie}</span></th></tr>
            </thead>
            <tbody>
              {verkopen.map((v) => (
                <tr key={v.id}>
                  <td>{datum.format(new Date(v.betaaldOp ?? v.aangemaaktOp))}</td>
                  <td>{v.lidNaam}</td>
                  <td>{v.productNaam}</td>
                  <td>
                    <span className="club-betalen-status" data-status={v.status}>{v.terugbetalingAangevraagd && v.status === 'betaald' ? t.loopt : tb.verkoopStatus[v.status]}</span>
                    {v.terugbetaaldCent > 0 && v.status !== 'terugbetaald' && <span className="club-hint"> {t.terug(euro(v.terugbetaaldCent, taal))}</span>}
                  </td>
                  <td className="bedrag">{euro(v.bedragCent, taal)}</td>
                  <td>
                    {magTerugbetalen(v) && (
                      <button type="button" className="club-knop club-knop--klein" disabled={bezig} onClick={() => terug(v)}>{t.terugbetalen}</button>
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
