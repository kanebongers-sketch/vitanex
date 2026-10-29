'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarX2, Check, Info, TriangleAlert } from 'lucide-react'
import type { AppLes } from '@/lib/club/app/data'
import { annulerenZonderGevolg, dagKortIn, dagNaamKort, lesKeuze, regelTeksten, vrijePlekken, type AppRegels } from '@/lib/club/app/regels'
import { dagSleutel, tijdNl } from '@/lib/club/cijfers/tijd'
import { useTaal } from '@/lib/aiyourgym/taal/client'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { LEDENAPP } from '@/lib/aiyourgym/taal/woorden/ledenapp/app'
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
function lesNaam(les: AppLes, vandaag: string, taal: Taal): string {
  const start = new Date(les.start)
  return LEDENAPP[taal].lessen.lesNaam(les.naam, dagNaamKort(dagSleutel(start), vandaag, taal).toLowerCase(), tijdNl(start))
}

function melding(data: Record<string, unknown>, actie: 'boek' | 'annuleer', wat: string, taal: Taal): string {
  const t = LEDENAPP[taal].lessen
  if (actie === 'boek') {
    if (data.status === 'wachtlijst') return typeof data.wachtpositie === 'number' ? t.wachtlijstPlek(wat, data.wachtpositie) : t.wachtlijstVoor(wat)
    return t.geboektVoor(wat)
  }
  const extra = data.doorgeschoven ? t.doorgeschoven : ''
  return `${data.teLaat === true ? t.afgemeldLaat(wat) : t.afgemeld(wat)}${extra}`
}

export function LessenTab({ lidId, lessen, regels, nu, strippenkaart }: Props) {
  const router = useRouter()
  const api = useLedenappApi()
  const taal = useTaal()
  const t = LEDENAPP[taal].lessen
  const a = LEDENAPP[taal].algemeen
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
      setBericht(r.ok ? { tekst: t.geboektStrip(lesNaam(les, vandaag, taal)), fout: false } : { tekst: r.fout, fout: true })
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
        setBericht({ tekst: melding(r.data, soort, lesNaam(les, vandaag, taal), taal), fout: false })
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
      return <span className="club-lidapp-label">{keuze === 'voorbij' ? t.begonnen : keuze === 'aanwezig' ? t.aanwezig : t.gaatNietDoor}</span>
    }
    const naam = t.lesOm(les.naam, tijdNl(new Date(les.start)))
    if (keuze === 'geboekt' || keuze === 'wachtlijst') {
      const gratis = annulerenZonderGevolg(keuze, new Date(les.start), nuDatum, regels)
      if (!gratis && bevestig !== les.id) {
        return (
          <button type="button" className="club-lidapp-knop club-lidapp-knop--stil" onClick={() => setBevestig(les.id)} disabled={bezig} aria-label={t.actieAria(t.annuleren, naam)}>
            {t.annuleren}
          </button>
        )
      }
      return (
        <button type="button" className="club-lidapp-knop club-lidapp-knop--stil" onClick={() => actie(les, 'annuleer')} disabled={bezig} aria-label={t.actieAria(gratis ? t.annuleren : t.tochAnnuleren, naam)}>
          {laden ? a.bezig : gratis ? t.annuleren : t.tochAnnuleren}
        </button>
      )
    }
    return (
      <button
        type="button" className={`club-lidapp-knop ${keuze === 'vrij' ? 'club-lidapp-knop--primair' : ''}`} onClick={() => actie(les, 'boek')} disabled={bezig}
        aria-label={t.actieAria(keuze === 'vrij' ? t.reserveren : t.opWachtlijst, naam)}
      >
        {laden ? a.bezig : keuze === 'vrij' ? t.reserveren : t.wachtlijst}
      </button>
    )
  }

  return (
    <div className="club-lidapp-tab">
      <h2 className="club-lidapp-kop">{t.kop}</h2>
      <details className="club-lidapp-regels">
        <summary>
          <Info aria-hidden size={16} /> {t.regels}
        </summary>
        <ul>
          {regelTeksten(regels, taal).map((r) => (
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
          {bezig && actief === stripLes.id ? a.bezig : t.boekStrip(strippenkaart.saldo)}
        </button>
      )}
      {dagen.length === 0 && (
        <LegeStaat Icoon={CalendarX2} titel={t.geenLessen}>
          {t.geenLessenUitleg}
        </LegeStaat>
      )}
      {dagen.map((dag) => (
        <section key={dag} className="club-lidapp-dag" aria-label={`${dagNaamKort(dag, vandaag, taal)} ${dagKortIn(dag, taal)}`}>
          <h3>
            {dagNaamKort(dag, vandaag, taal)} <span>{dagKortIn(dag, taal)}</span>
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
                        {les.mijn?.status === 'geboekt' && <span className="club-lidapp-chip club-lidapp-chip--merk">{t.geboekt}</span>}
                        {les.mijn?.status === 'wachtlijst' && <span className="club-lidapp-chip club-lidapp-chip--info">{les.mijn.wachtpositie ? t.wachtlijstPositie(les.mijn.wachtpositie) : t.opWachtlijst}</span>}
                        <span className={vrij === 0 ? 'club-lidapp-vol' : 'club-lidapp-vrij'}>
                          {vrij > 0 ? t.plekkenVrij(vrij) : les.wachtlijst > 0 ? t.volWachtend(les.wachtlijst) : t.vol}
                        </span>
                      </span>
                      <span className="club-lidapp-les-meter" aria-hidden data-vol={vrij === 0 || undefined}>
                        <span style={{ transform: `scaleX(${bezet})` }} />
                      </span>
                      {bevestig === les.id && (
                        <span className="club-lidapp-waarschuwing" role="status">
                          {t.teLaat(regels.annuleerUren)}
                          <button type="button" className="club-lidapp-tekstknop club-lidapp-houden" onClick={() => setBevestig(null)}>
                            {t.ikKomWel}
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
