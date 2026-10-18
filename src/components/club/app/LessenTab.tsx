'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarX2, Check, Info, TriangleAlert } from 'lucide-react'
import type { AppLes } from '@/lib/club/app/data'
import { dagNaamKort, lesKeuze, magGratisAnnuleren, regelTeksten, vrijePlekken, type AppRegels } from '@/lib/club/app/regels'
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

function melding(data: Record<string, unknown>, actie: 'boek' | 'annuleer'): string {
  if (actie === 'boek') {
    if (data.status === 'wachtlijst') return typeof data.wachtpositie === 'number' ? `Je staat op de wachtlijst, plek ${data.wachtpositie}.` : 'Je staat op de wachtlijst.'
    return 'Geboekt. Tot dan!'
  }
  const extra = data.doorgeschoven ? ' Je plek is naar de wachtlijst gegaan.' : ''
  return data.teLaat === true ? `Geannuleerd, maar te laat: dit telt als laat afgemeld.${extra}` : `Geannuleerd.${extra}`
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
      setBericht(r.ok ? { tekst: 'Geboekt met je strippenkaart. Tot dan!', fout: false } : { tekst: r.fout, fout: true })
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
        setBericht({ tekst: melding(r.data, soort), fout: false })
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
    if (keuze === 'voorbij' || keuze === 'geannuleerd') return <span className="club-lidapp-label">{keuze === 'voorbij' ? 'Begonnen' : 'Gaat niet door'}</span>
    if (keuze === 'geboekt' || keuze === 'wachtlijst') {
      const gratis = magGratisAnnuleren(new Date(les.start), nuDatum, regels)
      if (!gratis && bevestig !== les.id) {
        return (
          <button type="button" className="club-lidapp-knop club-lidapp-knop--stil" onClick={() => setBevestig(les.id)} disabled={laden}>
            Annuleren
          </button>
        )
      }
      return (
        <button type="button" className="club-lidapp-knop club-lidapp-knop--stil" onClick={() => actie(les, 'annuleer')} disabled={laden}>
          {laden ? 'Bezig...' : gratis ? 'Annuleren' : 'Toch annuleren'}
        </button>
      )
    }
    return (
      <button type="button" className={`club-lidapp-knop ${keuze === 'vrij' ? 'club-lidapp-knop--primair' : ''}`} onClick={() => actie(les, 'boek')} disabled={laden}>
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
        <p className={`club-lidapp-bericht ${bericht.fout ? 'club-lidapp-bericht--fout' : ''}`} role="status">
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
                        {les.mijn?.status === 'wachtlijst' && <span className="club-lidapp-chip club-lidapp-chip--info">Wachtlijst plek {les.mijn.wachtpositie ?? '?'}</span>}
                        <span className={vrij === 0 ? 'club-lidapp-vol' : 'club-lidapp-vrij'}>
                          {vrij > 0 ? `${vrij} ${vrij === 1 ? 'plek' : 'plekken'} vrij` : `Vol${les.wachtlijst > 0 ? `, ${les.wachtlijst} wachtend` : ''}`}
                        </span>
                      </span>
                      <span className="club-lidapp-les-meter" aria-hidden data-vol={vrij === 0 || undefined}>
                        <span style={{ transform: `scaleX(${bezet})` }} />
                      </span>
                      {bevestig === les.id && <span className="club-lidapp-waarschuwing">Binnen {regels.annuleerUren} uur voor de les: dit telt als te laat.</span>}
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
