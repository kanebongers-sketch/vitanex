'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarX2, Check, Info, TriangleAlert } from 'lucide-react'
import type { AppLes } from '@/lib/club/app/data'
import { annulerenZonderGevolg, dagNaamKort, lesKeuze, regelTeksten, vrijePlekken, type AppRegels } from '@/lib/club/app/regels'
import { dagKort, dagSleutel, tijdNl } from '@/lib/club/cijfers/tijd'
import { stuur } from './verzoek'
import { useLedenappApi } from './LedenappApi'
import { LegeStaat } from './LegeStaat'
import { appMelding } from '@/lib/club/lidmaatschappen/koppeling'

/** De melding als het lidmaatschap geen groepslessen heeft: dan kan een strip uitkomst bieden. */
const GEEN_GROEPSLESSEN = appMelding('groepslessen', '')

// Lessen in de ledenapp: de komende 7 dagen, met vrije plekken en een knop die
// boekt, op de wachtlijst zet of annuleert. Boeken en annuleren lopen via de
// API van het rooster-onderdeel (zelfde regels als aan de balie), in /mijn via
// de leden-API (zie LedenappApi.tsx).

interface Props {
  lidId: string
  lessen: AppLes[]
  regels: AppRegels
  nu: string
  /** Betalen in de ledenapp: strippen van het lid en de route om ermee te boeken (alleen in /mijn). */
  strippenkaart?: { saldo: number; url: string }
}

/** "Spinning, morgen om 09:00": welke les het bericht over gaat. */
function lesNaam(les: AppLes, vandaag: string): string {
  const start = new Date(les.start)
  return `${les.naam}, ${dagNaamKort(dagSleutel(start), vandaag).toLowerCase()} om ${tijdNl(start)}`
}

function melding(data: Record<string, unknown>, actie: 'boek' | 'annuleer', wat: string): string {
  if (actie === 'boek') {
    if (data.status === 'wachtlijst') return typeof data.wachtpositie === 'number' ? `Je staat op de wachtlijst voor ${wat} (plek ${data.wachtpositie}). Komt er een plek vrij, dan ben je automatisch geboekt.` : `Je staat op de wachtlijst voor ${wat}.`
    return `Geboekt: ${wat}. Tot dan!`
  }
  const extra = data.doorgeschoven ? ' Je plek gaat naar iemand van de wachtlijst.' : ''
  return data.teLaat === true ? `Afgemeld voor ${wat}. Dit was binnen de annuleertermijn en telt als te laat afgemeld.${extra}` : `Afgemeld voor ${wat}.${extra}`
}

export function LessenTab({ lidId, lessen, regels, nu, strippenkaart }: Props) {
  const router = useRouter()
  const api = useLedenappApi()
  const [bezig, startBezig] = useTransition()
  const [actief, setActief] = useState<string | null>(null)
  const [bevestig, setBevestig] = useState<string | null>(null)
  const [bericht, setBericht] = useState<{ tekst: string; fout: boolean } | null>(null)
  // Na een geweigerde boeking: deze les kan het lid met een strip boeken.
  const [stripLes, setStripLes] = useState<AppLes | null>(null)
  const nuDatum = new Date(nu)
  const vandaag = dagSleutel(nuDatum)
  const dagen = [...new Set(lessen.map((l) => dagSleutel(new Date(l.start))))]

  function boekMetStrip(les: AppLes) {
    if (!strippenkaart) return
    setActief(les.id)
    startBezig(async () => {
      const r = await stuur(strippenkaart.url, 'POST', { lesId: les.id })
      setBericht(r.ok ? { tekst: `Geboekt met je strippenkaart: ${lesNaam(les, vandaag)}. Tot dan!`, fout: false } : { tekst: r.fout, fout: true })
      setStripLes(null)
      if (r.ok) router.refresh()
      setActief(null)
    })
  }

  function actie(les: AppLes, soort: 'boek' | 'annuleer') {
    setActief(les.id)
    setBevestig(null)
    setStripLes(null)
    startBezig(async () => {
      const boek = api.lesBoeken(les.id, lidId)
      const r = soort === 'boek' ? await stuur(boek.url, 'POST', boek.body) : await stuur(api.lesAnnuleren(les.mijn?.reserveringId ?? ''), 'POST')
      if (r.ok) {
        setBericht({ tekst: melding(r.data, soort, lesNaam(les, vandaag)), fout: false })
        router.refresh()
      } else {
        setBericht({ tekst: r.fout, fout: true })
        if (soort === 'boek' && r.fout === GEEN_GROEPSLESSEN && strippenkaart && strippenkaart.saldo > 0) setStripLes(les)
      }
      setActief(null)
    })
  }

  function knop(les: AppLes) {
    const keuze = lesKeuze({ ...les, start: new Date(les.start) }, les.mijn?.status ?? null, nuDatum)
    const laden = bezig && actief === les.id
    if (keuze === 'voorbij' || keuze === 'geannuleerd' || keuze === 'aanwezig') {
      return <span className="club-lidapp-label">{keuze === 'voorbij' ? 'Begonnen' : keuze === 'aanwezig' ? 'Aanwezig' : 'Gaat niet door'}</span>
    }
    const naam = `${les.naam} om ${tijdNl(new Date(les.start))}`
    if (keuze === 'geboekt' || keuze === 'wachtlijst') {
      const gratis = annulerenZonderGevolg(keuze, new Date(les.start), nuDatum, regels)
      if (!gratis && bevestig !== les.id) {
        return (
          <button type="button" className="club-lidapp-knop club-lidapp-knop--stil" onClick={() => setBevestig(les.id)} disabled={bezig} aria-label={`Annuleren: ${naam}`}>
            Annuleren
          </button>
        )
      }
      return (
        <button type="button" className="club-lidapp-knop club-lidapp-knop--stil" onClick={() => actie(les, 'annuleer')} disabled={bezig} aria-label={`${gratis ? 'Annuleren' : 'Toch annuleren'}: ${naam}`}>
          {laden ? 'Bezig...' : gratis ? 'Annuleren' : 'Toch annuleren'}
        </button>
      )
    }
    return (
      <button
        type="button" className={`club-lidapp-knop ${keuze === 'vrij' ? 'club-lidapp-knop--primair' : ''}`} onClick={() => actie(les, 'boek')} disabled={bezig}
        aria-label={`${keuze === 'vrij' ? 'Reserveren' : 'Op de wachtlijst'}: ${naam}`}
      >
        {laden ? 'Bezig...' : keuze === 'vrij' ? 'Reserveren' : 'Wachtlijst'}
      </button>
    )
  }

  return (
    <div className="club-lidapp-tab">
      <h2 className="club-lidapp-kop">Lessen</h2>
      <details className="club-lidapp-regels">
        <summary>
          <Info aria-hidden size={16} /> Regels voor reserveren
        </summary>
        <ul>
          {regelTeksten(regels).map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </details>
      {bericht && (
        <p className={`club-lidapp-bericht ${bericht.fout ? 'club-lidapp-bericht--fout' : ''}`} role={bericht.fout ? 'alert' : 'status'}>
          {bericht.fout ? <TriangleAlert aria-hidden size={18} /> : <Check aria-hidden size={18} />}
          <span>{bericht.tekst}</span>
        </p>
      )}
      {stripLes && strippenkaart && (
        <button type="button" className="club-lidapp-knop club-lidapp-knop--primair club-lidapp-strip" onClick={() => boekMetStrip(stripLes)} disabled={bezig}>
          {bezig && actief === stripLes.id ? 'Bezig...' : `Boek met strippenkaart (${strippenkaart.saldo} over)`}
        </button>
      )}
      {dagen.length === 0 && (
        <LegeStaat Icoon={CalendarX2} titel="Nog geen lessen">
          De komende 7 dagen staan er geen lessen op het rooster. Kijk later nog eens.
        </LegeStaat>
      )}
      {dagen.map((dag) => (
        <section key={dag} className="club-lidapp-dag" aria-label={`${dagNaamKort(dag, vandaag)} ${dagKort(dag)}`}>
          <h3>
            {dagNaamKort(dag, vandaag)} <span>{dagKort(dag)}</span>
          </h3>
          <ul>
            {lessen
              .filter((l) => dagSleutel(new Date(l.start)) === dag)
              .map((les) => {
                const vrij = vrijePlekken(les.capaciteit, les.bezet)
                const bezet = les.capaciteit > 0 ? Math.min(1, les.bezet / les.capaciteit) : 1
                return (
                  <li key={les.id} className="club-lidapp-les" data-mijn={les.mijn?.status}>
                    <time dateTime={les.start}>{tijdNl(new Date(les.start))}</time>
                    <div className="club-lidapp-les-hoofd">
                      <strong>{les.naam}</strong>
                      <span>{[les.instructeur, les.zaal].filter(Boolean).join(' · ')}</span>
                      <span className="club-lidapp-les-plekken">
                        {les.mijn?.status === 'geboekt' && <span className="club-lidapp-chip club-lidapp-chip--merk">Geboekt</span>}
                        {les.mijn?.status === 'wachtlijst' && <span className="club-lidapp-chip club-lidapp-chip--info">{les.mijn.wachtpositie ? `Wachtlijst, plek ${les.mijn.wachtpositie}` : 'Op de wachtlijst'}</span>}
                        <span className={vrij === 0 ? 'club-lidapp-vol' : 'club-lidapp-vrij'}>
                          {vrij > 0 ? `${vrij} ${vrij === 1 ? 'plek' : 'plekken'} vrij` : `Vol${les.wachtlijst > 0 ? `, ${les.wachtlijst} wachtend` : ''}`}
                        </span>
                      </span>
                      <span className="club-lidapp-les-meter" aria-hidden data-vol={vrij === 0 || undefined}>
                        <span style={{ transform: `scaleX(${bezet})` }} />
                      </span>
                      {bevestig === les.id && (
                        <span className="club-lidapp-waarschuwing" role="status">
                          Minder dan {regels.annuleerUren === 1 ? '1 uur' : `${regels.annuleerUren} uur`} voor de les: afmelden telt nu als te laat.
                          <button type="button" className="club-lidapp-tekstknop club-lidapp-houden" onClick={() => setBevestig(null)}>
                            Nee, ik kom wel
                          </button>
                        </span>
                      )}
                    </div>
                    {knop(les)}
                  </li>
                )
              })}
          </ul>
        </section>
      ))}
    </div>
  )
}
