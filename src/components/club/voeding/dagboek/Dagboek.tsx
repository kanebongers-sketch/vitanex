'use client'

import { useCallback, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { geldendDoel, maaltijdVoorUur, plusDag, telOp, weekOverzicht } from '@/lib/club/voeding/dagboek/berekeningen'
import type { DagboekStart } from '@/lib/club/voeding/dagboek/app'
import { GEEN_INSTELLINGEN, type DagboekInstellingen, DagboekRegel, EigenProduct, Favoriet, Maaltijd, Product } from '@/lib/club/voeding/dagboek/model'
import { formatDatum } from '@/lib/aiyourgym/taal/formaat'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { VOEDING_DAGBOEK } from '@/lib/aiyourgym/taal/woorden/club/voeding-dagboek'
import { haal, schrijf, voedingUrl } from './api'
import { Maaltijden } from './Maaltijden'
import { KcalRing, MacroRingen } from './Ringen'
import { DagboekInstellingenBlok, StartKaart } from './StartEnInstellingen'
import { ToevoegBlad, type ToevoegActies } from './ToevoegBlad'
import { WeekBalken } from './WeekBalken'
import './dagboek.css'

// Het voedingsdagboek in de ledenapp (geporteerd uit MentaForce /voeding):
// per dag de maaltijden, kcal en macro's in ringen tegen het doel (van de coach
// of eigen), en de week. Snel loggen: + bij een maaltijd, een recent product,
// klaar. Kane kijkt in de voorvertoning alleen mee (alleenLezen).

interface DagboekProps {
  start: DagboekStart
  voor: string | null
  alleenLezen: boolean
  sportschool: string
}

export function Dagboek({ start, voor, alleenLezen, sportschool }: DagboekProps) {
  const t = useTekst(VOEDING_DAGBOEK)
  const taal = useTaal()
  const [dag, setDag] = useState(start.dag)
  const [regels, setRegels] = useState<DagboekRegel[]>(start.regels)
  const [instellingen, setInstellingen] = useState<DagboekInstellingen>(start.instellingen)
  const [recent, setRecent] = useState<Product[]>(start.recent)
  const [favorieten, setFavorieten] = useState<Favoriet[]>(start.favorieten)
  const [eigen, setEigen] = useState<EigenProduct[]>(start.eigen)
  const [blad, setBlad] = useState<Maaltijd | null>(null)
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const [laadFout, setLaadFout] = useState<string | null>(null)

  const { doel, bron: doelBron } = geldendDoel(start.planDoel, instellingen.eigenDoelen)
  const vanDag = useMemo(() => regels.filter((r) => r.datum === dag), [regels, dag])
  const totaal = telOp(vanDag)
  const week = useMemo(() => weekOverzicht(regels, dag), [regels, dag])

  const gaNaar = useCallback(async (nieuw: string) => {
    if (nieuw > start.vandaag) return
    setLaadFout(null)
    const r = await haal<{ regels: DagboekRegel[] }>(voedingUrl(`?dag=${nieuw}`, voor), t.fout, t.fout.laden)
    if (r.ok) {
      setRegels(r.data.regels)
      setDag(nieuw)
    } else setLaadFout(r.fout)
  }, [start.vandaag, voor, t.fout])

  async function post(body: Record<string, unknown>): Promise<DagboekRegel | null> {
    const r = await schrijf<{ regel: DagboekRegel }>(voedingUrl('', voor), 'POST', { datum: dag, maaltijd: blad, ...body }, t.fout, t.fout.opslaan)
    if (!r.ok) {
      setFout(r.fout)
      return null
    }
    return r.data.regel
  }

  async function metBezig(werk: () => Promise<boolean>): Promise<boolean> {
    setBezig(true)
    setFout(null)
    const ok = await werk()
    setBezig(false)
    if (ok) setBlad(null)
    return ok
  }

  const acties: ToevoegActies = {
    logProduct: (p, keuze, bron) => metBezig(async () => {
      const regel = await post({ naam: p.naam, merk: p.merk, gram: keuze.gram, maat: keuze.maat, aantal: keuze.aantal, bron, productSleutel: p.sleutel, per100: p.per100 })
      if (!regel) return false
      setRegels((oud) => [...oud, regel])
      if (p.sleutel) setRecent((oud) => [{ ...p, portieGram: keuze.gram }, ...oud.filter((x) => x.sleutel !== p.sleutel)].slice(0, 12))
      return true
    }),
    logHandmatig: (i) => metBezig(async () => {
      const regel = await post({ naam: i.naam, gram: i.gram, kcal: i.kcal, eiwitG: i.eiwitG, koolhydratenG: i.koolhydratenG, vetG: i.vetG, bron: 'handmatig' })
      if (regel) setRegels((oud) => [...oud, regel])
      return regel !== null
    }),
    logAi: (lijst, bron) => metBezig(async () => {
      for (const item of lijst) {
        const regel = await post({ naam: item.naam, gram: item.gram, bron, per100: item.per100 })
        if (!regel) return false
        setRegels((oud) => [...oud, regel])
      }
      return true
    }),
    aiToestemming: async (aan) => {
      if (alleenLezen) return false
      const r = await schrijf<{ instellingen: DagboekInstellingen }>(voedingUrl('/instellingen', voor), 'POST', { soort: 'ai', aan }, t.fout, t.fout.opslaan)
      if (!r.ok) return false
      setInstellingen(r.data.instellingen)
      return true
    },
    wisselFavoriet: (p) => {
      if (!p.sleutel || alleenLezen) return
      const is = favorieten.some((f) => f.product.sleutel === p.sleutel)
      const sleutel = p.sleutel
      void (async () => {
        const r = is
          ? await schrijf(voedingUrl(`/favorieten?sleutel=${encodeURIComponent(sleutel)}`, voor), 'DELETE', undefined, t.fout, t.fout.opslaan)
          : await schrijf(voedingUrl('/favorieten', voor), 'POST', { productSleutel: sleutel, naam: p.naam, merk: p.merk, per100: p.per100, portieGram: p.portieGram }, t.fout, t.fout.opslaan)
        if (!r.ok) return setFout(r.fout)
        setFavorieten((oud) => (is ? oud.filter((f) => f.product.sleutel !== sleutel) : [{ id: sleutel, product: p }, ...oud]))
      })()
    },
    nieuwEigen: (p) => setEigen((oud) => [...oud, p].sort((a, b) => a.naam.localeCompare(b.naam))),
    verwijderEigen: (id) => {
      void (async () => {
        const r = await schrijf(voedingUrl(`/producten/${id}`, voor), 'DELETE', undefined, t.fout, t.fout.verwijderen)
        if (!r.ok) return setFout(r.fout)
        setEigen((oud) => oud.filter((p) => p.id !== id))
        setFavorieten((oud) => oud.filter((f) => f.product.sleutel !== `eigen:${id}`))
      })()
    },
  }

  async function verwijder(id: string) {
    setFout(null)
    const r = await schrijf(voedingUrl(`/${id}`, voor), 'DELETE', undefined, t.fout, t.fout.verwijderen)
    if (r.ok) setRegels((oud) => oud.filter((x) => x.id !== id))
    else setFout(r.fout)
  }

  if (!instellingen.gestartOp) {
    return <StartKaart t={t} voor={voor} sportschool={sportschool} alleenLezen={alleenLezen} onGestart={setInstellingen} />
  }

  const dagNaam = dag === start.vandaag ? t.dag.vandaag : dag === plusDag(start.vandaag, -1) ? t.dag.gisteren : formatDatum(`${dag}T12:00:00Z`, taal, 'dag')
  const uurNu = Number(new Intl.DateTimeFormat('en-GB', { hour: '2-digit', hourCycle: 'h23', timeZone: 'Europe/Amsterdam' }).format(new Date()))

  return (
    <div className="club-vd">
      {alleenLezen && <p className="club-vd-hint" role="status">{t.voorvertoning}</p>}
      <div className="club-vd-dagkiezer">
        <button type="button" className="club-vd-x" onClick={() => void gaNaar(plusDag(dag, -1))} aria-label={t.dag.vorige}><ChevronLeft size={22} aria-hidden /></button>
        <h3 aria-live="polite">{dagNaam}</h3>
        <button type="button" className="club-vd-x" onClick={() => void gaNaar(plusDag(dag, 1))} disabled={dag >= start.vandaag} aria-label={t.dag.volgende}><ChevronRight size={22} aria-hidden /></button>
      </div>
      {laadFout && <p className="club-vd-fout" role="alert">{laadFout}</p>}

      <section className="club-vd-held" aria-label={t.titel}>
        <KcalRing totaal={totaal} doel={doel} t={t} />
        <MacroRingen totaal={totaal} doel={doel} t={t} />
        <p className="club-vd-doelbron">{t.doel[doelBron]}</p>
      </section>

      {fout && !blad && <p className="club-vd-fout" role="alert">{fout}</p>}
      <Maaltijden regels={vanDag} t={t} alleenLezen={alleenLezen} voorkeur={dag === start.vandaag ? maaltijdVoorUur(uurNu) : null} onToevoegen={(m) => { setFout(null); setBlad(m) }} onVerwijder={(id) => void verwijder(id)} />

      <section className="club-vd-kaart" aria-labelledby="vd-week-kop">
        <h3 id="vd-week-kop" className="club-lidapp-label">{t.week.titel}</h3>
        <WeekBalken week={week} doelKcal={doel?.kcal ?? null} actief={dag} t={t} taal={taal} onKies={(d) => void gaNaar(d)} />
      </section>

      <DagboekInstellingenBlok
        t={t}
        voor={voor}
        instellingen={instellingen}
        heeftPlan={start.planDoel !== null}
        alleenLezen={alleenLezen}
        onWijzig={setInstellingen}
        onGewist={() => { setRegels([]); setRecent([]); setFavorieten([]); setEigen([]); setInstellingen(GEEN_INSTELLINGEN) }}
      />

      {blad && !alleenLezen && (
        <ToevoegBlad maaltijd={blad} t={t} voor={voor} recent={recent} favorieten={favorieten} eigen={eigen} ai={start.ai} aiToestemmingOp={instellingen.aiToestemmingOp} bezig={bezig} fout={fout} acties={acties} onSluit={() => setBlad(null)} />
      )}
    </div>
  )
}
