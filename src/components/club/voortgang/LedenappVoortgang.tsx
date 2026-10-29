'use client'

import { useState } from 'react'
import { Award, Flame, Ruler } from 'lucide-react'
import { gemiddeldPerWeek, mijlpalen, perWeek, volgendeMijlpaal, wekenOpRij } from '@/lib/club/voortgang/frequentie'
import type { VoortgangData } from '@/lib/club/voortgang/model'
import { beschikbareReeksen, reeksVoor, verschillen, type ReeksSleutel } from '@/lib/club/voortgang/tijdlijn'
import { LegeStaat } from '@/components/club/app/LegeStaat'
import { VoortgangGrafiek } from './VoortgangGrafiek'
import { WeekBalken } from './WeekBalken'
import { datumKort, getal, reeksTekst, verschilTekst } from './weergave'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { VOORTGANG } from '@/lib/aiyourgym/taal/woorden/club/voortgang'
import './voortgang.css'
import { VOOR_LID as VOOR_LID_MATEN } from '@/lib/club/voortgang/lid'

interface LedenappVoortgangProps {
  /** Uit haalVoortgang() op de server. */
  voortgang: VoortgangData
  /** Nu als ISO-tekst. */
  nu: string
}

/** Wat een lid zelf ziet: lichaam en omtrek, geen BMI of hartslag (dat bespreekt de trainer). */
const VOOR_LID: readonly ReeksSleutel[] = VOOR_LID_MATEN

/** Eigen voortgang in de ledenapp: verloop, trainingen per week en mijlpalen. */
export function LedenappVoortgang({ voortgang, nu }: LedenappVoortgangProps) {
  const taal = useTaal()
  const tv = useTekst(VOORTGANG)
  const t = tv.app
  const reeksen = beschikbareReeksen(voortgang.punten).filter((r) => VOOR_LID.includes(r.sleutel)).map((r) => reeksTekst(r, tv))
  const [keuze, setKeuze] = useState<ReeksSleutel>('gewicht_kg')
  const info = reeksen.find((r) => r.sleutel === keuze) ?? reeksen[0]
  const reeks = info ? reeksVoor(voortgang.punten, info.sleutel) : []
  const verschil = verschillen(reeks)

  const datum = new Date(nu)
  const weken = perWeek(voortgang.trainingen, datum, 8)
  const opRij = wekenOpRij(voortgang.trainingen, datum)
  const behaald = mijlpalen(voortgang.totaalTrainingen, opRij, taal).filter((m) => m.behaald)
  const volgende = volgendeMijlpaal(voortgang.totaalTrainingen, taal)

  return (
    <section className="club-voortgang-app" aria-labelledby="lidapp-voortgang-kop">
      <h2 id="lidapp-voortgang-kop" className="club-lidapp-kop">{t.titel}</h2>

      {info && verschil ? (
        <div className="club-voortgang-app-blok">
          <div className="club-voortgang-app-kop">
            <span className="club-lidapp-label">{info.label}</span>
            <span className="club-voortgang-app-getal">
              {getal(verschil.laatste.waarde, taal)}
              <small>{info.eenheid}</small>
            </span>
            <span className="club-voortgang-app-sub">
              {verschil.sindsStart === null
                ? t.eersteMeting(datumKort(verschil.laatste.datum, taal))
                : t.sinds(`${verschilTekst(verschil.sindsStart, taal)} ${info.eenheid}`, datumKort(verschil.start.datum, taal))}
            </span>
          </div>
          {reeksen.length > 1 && (
            <div className="club-voortgang-app-wissel" role="group" aria-label={t.kies}>
              {reeksen.map((r) => (
                <button key={r.sleutel} type="button" aria-pressed={r.sleutel === info.sleutel} onClick={() => setKeuze(r.sleutel)}>
                  {r.kort}
                </button>
              ))}
            </div>
          )}
          <VoortgangGrafiek reeks={reeks} info={info} compact />
        </div>
      ) : (
        <LegeStaat Icoon={Ruler} titel={t.leegTitel}>
          {t.leeg}
        </LegeStaat>
      )}

      <div className="club-voortgang-app-blok">
        <div className="club-voortgang-app-rij">
          <span className="club-lidapp-label">{t.perWeek}</span>
          <span className="club-voortgang-app-reeks">
            <Flame aria-hidden size={15} /> {t.opRij(opRij)}
          </span>
        </div>
        <WeekBalken weken={weken} compact />
        <span className="club-voortgang-app-sub">{t.gemiddeld(getal(gemiddeldPerWeek(weken), taal), voortgang.totaalTrainingen)}</span>
      </div>

      <div className="club-voortgang-app-blok">
        <span className="club-lidapp-label">{t.mijlpalen}</span>
        {volgende && (
          <div className="club-voortgang-app-doel">
            <span>
              {t.volgende} <strong>{volgende.titel}</strong>{t.nog(volgende.nogTeGaan)}
            </span>
            <span className="club-voortgang-app-balk" role="progressbar" aria-label={t.opWeg(volgende.titel)} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(volgende.voortgang * 100)}>
              <span style={{ transform: `scaleX(${volgende.voortgang})` }} />
            </span>
          </div>
        )}
        {behaald.length > 0 ? (
          <ul className="club-voortgang-app-mijlpalen">
            {behaald.map((m) => (
              <li key={m.sleutel}>
                <Award aria-hidden size={15} /> {m.titel}
              </li>
            ))}
          </ul>
        ) : (
          <p className="club-voortgang-app-sub">{t.eerste}</p>
        )}
      </div>
    </section>
  )
}
