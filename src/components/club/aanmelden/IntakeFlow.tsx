'use client'

import { useState, type ReactNode } from 'react'
import { ArrowLeft, Check, Sparkles } from 'lucide-react'
import { stuur } from '@/components/club/app/verzoek'
import { DOELEN, NIVEAUS, VOORKEUREN, ZONES, type Doel, type Niveau, type Voorkeur, type Zone } from '@/lib/club/training/typen'
import type { ParqSleutel } from '@/lib/club/training/intake'
import { useTaal } from '@/lib/aiyourgym/taal/client'
import { LID_INTAKE } from '@/lib/aiyourgym/taal/woorden/ledenapp/lid-intake'
import { TRAINING_LABELS } from '@/lib/aiyourgym/taal/woorden/club/training-labels'
import { PARQ_SLEUTELS, bouwIntake, gezondheidOpen, kanVerderLichaam, type IntakeKeuze } from '@/lib/club/nieuwe-leden/intake-keuze'
import './aanmelden.css'

// De korte intake van het lid, hoogstens vier schermen: 1 doel, 2 gewicht en
// lengte (met toestemming, over te slaan), 3 gezondheid (ja of nee, uitleg
// alleen bij ja, over te slaan), 4 ervaring en tijd (alles al ingevuld). Grote
// knoppen, een voortgangsbalk, en aan het eind meteen een startschema.

interface Props {
  voornaam: string
  /** Mag het lid een eigen schema maken (pakket Training en het tabblad Schema)? */
  schemaKan: boolean
  /** Waar Later en Naar de app heen gaan. */
  terug: string
  /** De API (met ?voor= in de voorvertoning van Kane). */
  api: string
}

const STAPPEN = 4
const MINUTEN = [30, 45, 60, 90] as const
const DAGEN = [1, 2, 3, 4, 5, 6] as const

function Keuze({ aan, onKies, children, groot = false }: { aan: boolean; onKies: () => void; children: ReactNode; groot?: boolean }) {
  return (
    <button type="button" className={`club-in-keuze${groot ? ' club-in-keuze--groot' : ''}`} aria-pressed={aan} onClick={onKies}>
      {aan && <Check size={16} aria-hidden className="club-in-vink" />}
      {children}
    </button>
  )
}

export function IntakeFlow({ voornaam, schemaKan, terug, api }: Props) {
  const taal = useTaal()
  const t = LID_INTAKE[taal]
  const l = TRAINING_LABELS[taal]
  const [stap, setStap] = useState(1)
  const [k, setK] = useState<IntakeKeuze>({
    doelen: [], gewicht: '', lengte: '', toestemming: false, gezondheid: {}, toelichting: {}, zones: [], niveau: 1, dagen: 3, minuten: 60, voorkeuren: ['sportschool'],
  })
  const [fout, setFout] = useState<string | null>(null)
  const [bezig, setBezig] = useState(false)
  const [klaar, setKlaar] = useState<string | null>(null)
  const zet = (deel: Partial<IntakeKeuze>) => setK((oud) => ({ ...oud, ...deel }))
  const wissel = <T,>(lijst: T[], x: T): T[] => (lijst.includes(x) ? lijst.filter((y) => y !== x) : [...lijst, x])

  function verder(volgende: number) {
    setFout(null)
    if (stap === 1 && k.doelen.length === 0) return setFout(t.fouten.doel)
    if (stap === 2) {
      const lichaam = kanVerderLichaam(k)
      if (lichaam) return setFout(t.fouten[lichaam])
    }
    if (stap === 3 && k.toestemming && gezondheidOpen(k) > 0) return setFout(t.fouten.gezondheid)
    setStap(volgende)
    window.scrollTo({ top: 0 })
  }

  async function opslaan() {
    setBezig(true)
    setFout(null)
    const r = await stuur(api, 'POST', bouwIntake(k))
    setBezig(false)
    if (!r.ok) return setFout(r.fout)
    setKlaar(typeof r.data.start === 'string' ? r.data.start : terug)
  }

  if (klaar) {
    return (
      <section className="club-in-klaar" aria-labelledby="in-klaar-kop">
        <span className="club-in-klaar-icoon" aria-hidden><Check size={28} /></span>
        <h1 id="in-klaar-kop">{t.klaarScherm.kop(voornaam)}</h1>
        <p>{t.klaarScherm.uitleg}</p>
        {schemaKan && (
          <a href={klaar} className="club-lidapp-knop club-lidapp-knop--primair club-lidapp-knop--breed">
            <Sparkles size={18} aria-hidden /> {t.klaarScherm.schema}
          </a>
        )}
        {schemaKan && <p className="club-mijn-veld-hint">{t.klaarScherm.schemaUitleg}</p>}
        <a href={terug} className={schemaKan ? 'club-mijn-inlog-link' : 'club-lidapp-knop club-lidapp-knop--primair club-lidapp-knop--breed'}>{t.klaarScherm.home}</a>
      </section>
    )
  }

  const geenToestemming = !k.toestemming
  return (
    <section className="club-in" aria-labelledby="in-kop">
      <header className="club-in-kop">
        {stap > 1 ? (
          <button type="button" className="club-in-terug" onClick={() => setStap(stap - 1)} aria-label={t.terug}><ArrowLeft size={18} aria-hidden /></button>
        ) : <span />}
        <div className="club-in-balk" role="progressbar" aria-valuemin={1} aria-valuemax={STAPPEN} aria-valuenow={stap} aria-label={t.stap(stap, STAPPEN)}>
          <span style={{ transform: `scaleX(${stap / STAPPEN})` }} />
        </div>
        <a href={terug} className="club-in-later">{t.sluit}</a>
      </header>

      {stap === 1 && (
        <div className="club-in-scherm">
          <h1 id="in-kop">{t.doel.kop}</h1>
          <p>{t.doel.uitleg}</p>
          <div className="club-in-raster">
            {DOELEN.map((d: Doel) => <Keuze key={d} groot aan={k.doelen.includes(d)} onKies={() => zet({ doelen: wissel(k.doelen, d) })}>{l.doel[d]}</Keuze>)}
          </div>
        </div>
      )}

      {stap === 2 && (
        <div className="club-in-scherm">
          <h1 id="in-kop">{t.lichaam.kop}</h1>
          <p>{t.lichaam.uitleg}</p>
          <Toestemming aan={k.toestemming} onZet={(aan) => zet({ toestemming: aan })} tekst={t.lichaam.toestemming} hint={t.lichaam.toestemmingHint} />
          <div className="club-in-maten" aria-disabled={geenToestemming || undefined}>
            <label className="club-in-maat">
              <span>{t.lichaam.gewicht}</span>
              <span className="club-in-maat-veld"><input inputMode="decimal" disabled={geenToestemming} value={k.gewicht} onChange={(e) => zet({ gewicht: e.target.value })} maxLength={5} /> <small>{t.lichaam.kg}</small></span>
            </label>
            <label className="club-in-maat">
              <span>{t.lichaam.lengte}</span>
              <span className="club-in-maat-veld"><input inputMode="numeric" disabled={geenToestemming} value={k.lengte} onChange={(e) => zet({ lengte: e.target.value })} maxLength={3} /> <small>{t.lichaam.cm}</small></span>
            </label>
          </div>
          {geenToestemming && <p className="club-mijn-veld-hint">{t.lichaam.zonder}</p>}
        </div>
      )}

      {stap === 3 && (
        <div className="club-in-scherm">
          <h1 id="in-kop">{t.gezondheid.kop}</h1>
          <p>{t.gezondheid.uitleg}</p>
          {geenToestemming ? (
            <>
              <p className="club-mijn-veld-hint">{t.gezondheid.geenToestemming}</p>
              <Toestemming aan={k.toestemming} onZet={(aan) => zet({ toestemming: aan })} tekst={t.lichaam.toestemming} hint={t.lichaam.toestemmingHint} />
            </>
          ) : (
            <>
              <button type="button" className="club-in-allesnee" onClick={() => zet({ gezondheid: Object.fromEntries(PARQ_SLEUTELS.map((s) => [s, false])) as IntakeKeuze['gezondheid'], toelichting: {}, zones: [] })}>{t.gezondheid.allesNee}</button>
              <ol className="club-in-vragen">
                {PARQ_SLEUTELS.map((s) => (
                  <GezondheidVraag key={s} sleutel={s} vraag={s === 'gewricht' ? t.gezondheid.blessure : l.parq[s]} k={k} zet={zet} />
                ))}
              </ol>
              {gezondheidOpen(k) > 0 && <p className="club-mijn-veld-hint">{t.gezondheid.nogVragen(gezondheidOpen(k))}</p>}
            </>
          )}
        </div>
      )}

      {stap === 4 && (
        <div className="club-in-scherm">
          <h1 id="in-kop">{t.ervaring.kop}</h1>
          <fieldset className="club-in-groep">
            <legend>{t.ervaring.niveau}</legend>
            <div className="club-in-lijst">
              {NIVEAUS.map((n: Niveau) => (
                <Keuze key={n} aan={k.niveau === n} onKies={() => zet({ niveau: n })}><strong>{l.niveau[n]}</strong><small>{t.ervaring.niveauUitleg[n]}</small></Keuze>
              ))}
            </div>
          </fieldset>
          <fieldset className="club-in-groep">
            <legend>{t.ervaring.dagen}</legend>
            <div className="club-in-getallen">
              {DAGEN.map((d) => <Keuze key={d} aan={k.dagen === d} onKies={() => zet({ dagen: d })}>{d}</Keuze>)}
            </div>
          </fieldset>
          <fieldset className="club-in-groep">
            <legend>{t.ervaring.minuten}</legend>
            <div className="club-in-getallen">
              {MINUTEN.map((m) => <Keuze key={m} aan={k.minuten === m} onKies={() => zet({ minuten: m })}>{t.ervaring.min(m)}</Keuze>)}
            </div>
          </fieldset>
          <fieldset className="club-in-groep">
            <legend>{t.ervaring.voorkeur}</legend>
            <div className="club-in-pillen">
              {VOORKEUREN.map((v: Voorkeur) => <Keuze key={v} aan={k.voorkeuren.includes(v)} onKies={() => zet({ voorkeuren: wissel(k.voorkeuren, v) })}>{l.voorkeur[v]}</Keuze>)}
            </div>
          </fieldset>
        </div>
      )}

      <div aria-live="assertive">{fout && <p className="club-mijn-inlog-fout" role="alert">{fout}</p>}</div>
      <footer className="club-in-voet">
        {stap < STAPPEN ? (
          <>
            {(stap === 2 || stap === 3) && (
              <button type="button" className="club-lidapp-knop club-in-overslaan" onClick={() => { if (stap === 3) zet({ gezondheid: {}, toelichting: {}, zones: [] }); setFout(null); setStap(stap + 1) }}>{t.overslaan}</button>
            )}
            <button type="button" className="club-lidapp-knop club-lidapp-knop--primair club-in-verder" onClick={() => verder(stap + 1)}>{t.verder}</button>
          </>
        ) : (
          <button type="button" className="club-lidapp-knop club-lidapp-knop--primair club-lidapp-knop--breed" onClick={() => void opslaan()} disabled={bezig} aria-busy={bezig || undefined}>{bezig ? t.bezig : t.klaar}</button>
        )}
      </footer>
    </section>
  )
}

function Toestemming({ aan, onZet, tekst, hint }: { aan: boolean; onZet: (aan: boolean) => void; tekst: string; hint: string }) {
  return (
    <label className="club-am-akkoord club-in-toestemming">
      <input type="checkbox" checked={aan} onChange={(e) => onZet(e.target.checked)} />
      <span>{tekst}<small>{hint}</small></span>
    </label>
  )
}

function GezondheidVraag({ sleutel, vraag, k, zet }: { sleutel: ParqSleutel; vraag: string; k: IntakeKeuze; zet: (d: Partial<IntakeKeuze>) => void }) {
  const taal = useTaal()
  const t = LID_INTAKE[taal].gezondheid
  const zone = TRAINING_LABELS[taal].zone
  const antwoord = k.gezondheid[sleutel]
  const ja = antwoord === true
  return (
    <li className="club-in-vraag" data-ja={ja || undefined}>
      <p>{vraag}</p>
      <div className="club-in-janee">
        <button type="button" aria-pressed={antwoord === false} onClick={() => zet({ gezondheid: { ...k.gezondheid, [sleutel]: false } })}>{t.nee}</button>
        <button type="button" aria-pressed={ja} onClick={() => zet({ gezondheid: { ...k.gezondheid, [sleutel]: true } })}>{t.ja}</button>
      </div>
      {ja && sleutel === 'gewricht' && (
        <div className="club-in-pillen club-in-zones" role="group" aria-label={t.waar}>
          {ZONES.map((z: Zone) => (
            <button key={z} type="button" className="club-in-keuze" aria-pressed={k.zones.includes(z)} onClick={() => zet({ zones: k.zones.includes(z) ? k.zones.filter((y) => y !== z) : [...k.zones, z] })}>{zone[z]}</button>
          ))}
        </div>
      )}
      {ja && (
        <textarea
          className="club-in-uitleg"
          rows={2}
          maxLength={200}
          aria-label={sleutel === 'bloeddruk' ? t.medicatie : t.toelichting}
          placeholder={sleutel === 'bloeddruk' ? t.medicatie : t.toelichting}
          value={k.toelichting[sleutel] ?? ''}
          onChange={(e) => zet({ toelichting: { ...k.toelichting, [sleutel]: e.target.value } })}
        />
      )}
    </li>
  )
}
