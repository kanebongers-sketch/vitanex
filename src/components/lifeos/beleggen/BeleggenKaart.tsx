'use client'

import { Kaart } from '@/components/lifeos/os/Kaart'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { BEL_CSS } from './stijl'
import { euro, euroMetTeken, procent, richting } from './formaat'
import { useBeleggen } from './useBeleggen'
import { PositieRij } from './PositieRij'
import { Toevoegen } from './Toevoegen'
import { VerloopGrafiek } from './VerloopGrafiek'

// Je beleggingen in één oogopslag: totale waarde, vandaag, winst/verlies, per
// positie, en het verloop. Koersen van Yahoo Finance (± 15 min vertraagd); LifeOS
// koppelt niet aan DEGIRO en handelt niets — dit is een overzicht van wat jij invoert.

const TIJD = new Intl.DateTimeFormat('nl-NL', { weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })

function bedrag(v: string): string | null {
  return v.trim() === '' ? null : v.trim()
}

export function BeleggenKaart() {
  const { staat, actieFout, opnieuw, doe } = useBeleggen()

  return (
    <Kaart titel="Beleggingen" vervangt="DEGIRO-overzicht">
      <style href="bel" precedence="medium">{BEL_CSS}</style>
      {staat.fase === 'laden' ? <div className="bel__skelet" aria-hidden /> : null}
      {staat.fase === 'fout' ? <Foutmelding bericht={staat.bericht} opnieuw={opnieuw} /> : null}
      {staat.fase === 'ok' ? (() => {
        const { totaal, regels, cashEur, historie, koersenVan } = staat.data
        return (
          <div className="bel">
            <div className="bel__cijfers">
              <div className="bel__tegel bel__tegel--groot">
                <span className="bel__label">Totale waarde</span>
                <span className="bel__hoofdgetal">{euro(totaal.waardeEur)}</span>
              </div>
              <div className="bel__tegel">
                <span className="bel__label">Vandaag</span>
                <span className={`bel__getal-m ${richting(totaal.dagEur)}`}>
                  {euroMetTeken(totaal.dagEur)}{totaal.dagPct !== null ? ` (${procent(totaal.dagPct)})` : ''}
                </span>
              </div>
              <div className="bel__tegel">
                <span className="bel__label">Winst / verlies</span>
                {totaal.winstEur !== null && totaal.winstPct !== null ? (
                  <span className={`bel__getal-m ${richting(totaal.winstEur)}`}>{euroMetTeken(totaal.winstEur)} ({procent(totaal.winstPct)})</span>
                ) : (
                  <span className="bel__sub">Vul bij {totaal.zonderAankoop} positie{totaal.zonderAankoop === 1 ? '' : 's'} je GAK in</span>
                )}
              </div>
            </div>

            {actieFout ? <Foutmelding bericht={actieFout} /> : null}

            {regels.length === 0 ? (
              <p className="bel__leeg">Nog geen posities. Voeg ze toe, of importeer je DEGIRO-export.</p>
            ) : (
              <ul className="bel__lijst">
                {regels.map((r) => (
                  <PositieRij
                    key={r.id}
                    r={r}
                    onBewaar={async (id, w) => (await doe(`/api/lifeos/beleggen/${id}`, 'PATCH', { aantal: w.aantal, aankoopprijs: bedrag(w.aankoopprijs), inlegEur: bedrag(w.inlegEur) })).ok}
                    onVerwijder={async (id) => { await doe(`/api/lifeos/beleggen/${id}`, 'DELETE') }}
                  />
                ))}
                {cashEur > 0 ? (
                  <li className="bel__rij">
                    <div className="bel__wie"><p className="bel__naam">Cash bij je broker</p></div>
                    <div className="bel__getal"><p className="bel__waarde">{euro(cashEur)}</p></div>
                    <div className="bel__acties" />
                  </li>
                ) : null}
              </ul>
            )}

            <Toevoegen
              onVoegToe={async (v) => (await doe('/api/lifeos/beleggen', 'POST', { symbool: v.symbool, aantal: v.aantal, aankoopprijs: bedrag(v.aankoopprijs) })).ok}
              onImporteer={async (csv) => {
                const uit = await doe('/api/lifeos/beleggen/import', 'POST', { csv })
                if (!uit.ok || typeof uit.data !== 'object' || uit.data === null) return null
                const d = uit.data as { geimporteerd?: unknown; nietGekoppeld?: unknown }
                const n = Array.isArray(d.geimporteerd) ? d.geimporteerd.length : 0
                const mis = Array.isArray(d.nietGekoppeld) ? d.nietGekoppeld.length : 0
                return `${n} positie${n === 1 ? '' : 's'} ingelezen${mis ? `, ${mis} niet gevonden — voeg die toe via zoeken` : ''}. Vul nu je GAK in.`
              }}
            />

            <VerloopGrafiek punten={historie} />

            <p className="bel__voet">
              Koersen via Yahoo Finance, ± 15 min vertraagd{koersenVan ? ` · bijgewerkt ${TIJD.format(new Date(koersenVan))}` : ''}.
              {regels.some((r) => r.koersValuta !== 'EUR' && r.inlegEur === null) ? ' Dollar-posities zonder ingevulde inleg in € rekenen met de wisselkoers van nu.' : ''}
            </p>
          </div>
        )
      })() : null}
    </Kaart>
  )
}
