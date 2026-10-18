'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Info } from 'lucide-react'
import type { AppLes } from '@/lib/club/app/data'
import { dagNaamKort, lesKeuze, magGratisAnnuleren, regelTeksten, vrijePlekken, type AppRegels } from '@/lib/club/app/regels'
import { dagKort, dagSleutel, tijdNl } from '@/lib/club/cijfers/tijd'
import { stuur } from './verzoek'
import { useLedenappApi } from './LedenappApi'

// Lessen in de ledenapp: de komende 7 dagen, met vrije plekken en een knop die
// boekt, op de wachtlijst zet of annuleert. Boeken en annuleren lopen via de
// API van het rooster-onderdeel (zelfde regels als aan de balie), in /mijn via
// de leden-API (zie LedenappApi.tsx).

interface Props {
  lidId: string
  lessen: AppLes[]
  regels: AppRegels
  nu: string
}

function melding(data: Record<string, unknown>, actie: 'boek' | 'annuleer'): string {
  if (actie === 'boek') {
    if (data.status === 'wachtlijst') return typeof data.wachtpositie === 'number' ? `Je staat op de wachtlijst, plek ${data.wachtpositie}.` : 'Je staat op de wachtlijst.'
    return 'Geboekt. Tot dan!'
  }
  const extra = data.doorgeschoven ? ' Je plek is naar de wachtlijst gegaan.' : ''
  return data.teLaat === true ? `Geannuleerd, maar te laat: dit telt als laat afgemeld.${extra}` : `Geannuleerd.${extra}`
}

export function LessenTab({ lidId, lessen, regels, nu }: Props) {
  const router = useRouter()
  const api = useLedenappApi()
  const [bezig, startBezig] = useTransition()
  const [actief, setActief] = useState<string | null>(null)
  const [bevestig, setBevestig] = useState<string | null>(null)
  const [bericht, setBericht] = useState<{ tekst: string; fout: boolean } | null>(null)
  const nuDatum = new Date(nu)
  const vandaag = dagSleutel(nuDatum)
  const dagen = [...new Set(lessen.map((l) => dagSleutel(new Date(l.start))))]

  function actie(les: AppLes, soort: 'boek' | 'annuleer') {
    setActief(les.id)
    setBevestig(null)
    startBezig(async () => {
      const boek = api.lesBoeken(les.id, lidId)
      const r = soort === 'boek' ? await stuur(boek.url, 'POST', boek.body) : await stuur(api.lesAnnuleren(les.mijn?.reserveringId ?? ''), 'POST')
      if (r.ok) {
        setBericht({ tekst: melding(r.data, soort), fout: false })
        router.refresh()
      } else {
        setBericht({ tekst: r.fout, fout: true })
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
          {bericht.tekst}
        </p>
      )}
      {dagen.length === 0 && <p className="club-lidapp-leeg">De komende 7 dagen staan er geen lessen op het rooster.</p>}
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
                return (
                  <li key={les.id} className="club-lidapp-les" data-mijn={les.mijn?.status}>
                    <time dateTime={les.start}>{tijdNl(new Date(les.start))}</time>
                    <div className="club-lidapp-les-hoofd">
                      <strong>{les.naam}</strong>
                      <span>{[les.instructeur, les.zaal].filter(Boolean).join(' · ')}</span>
                      <span className={vrij === 0 ? 'club-lidapp-vol' : 'club-lidapp-vrij'}>
                        {les.mijn?.status === 'geboekt' && 'Jij bent geboekt · '}
                        {les.mijn?.status === 'wachtlijst' && `Wachtlijst plek ${les.mijn.wachtpositie ?? '?'} · `}
                        {vrij > 0 ? `${vrij} ${vrij === 1 ? 'plek' : 'plekken'} vrij` : `Vol${les.wachtlijst > 0 ? `, ${les.wachtlijst} wachtend` : ''}`}
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
