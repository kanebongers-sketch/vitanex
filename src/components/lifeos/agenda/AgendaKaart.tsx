'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { CalendarPlus } from 'lucide-react'
import { Kaart, NogNiets } from '@/components/lifeos/os/Kaart'
import { haalJson, leesNiets } from '@/lib/lifeos/api/http'
import {
  leesAgendaVandaag,
  naarAfspraakJson,
  naarVrijBlokJson,
  vanAfspraakJson,
  type AfspraakJson,
  type AgendaVandaag,
  type VrijBlokJson,
} from '@/lib/lifeos/agenda/agenda'
import {
  eerstvolgendeAfspraak,
  looptNu,
  vrijeBlokken,
  werkVenster,
} from '@/lib/lifeos/agenda/vrije-blokken'
import { datumSleutel, leesDatumSleutel } from '@/lib/lifeos/datum/datum'
import { Dagoverzicht } from './Dagoverzicht'
import { NieuweAfspraak, type NieuwEventInvoer } from './NieuweAfspraak'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { Knop } from '@/components/lifeos/os/Knop'

/** Alleen de gekoppelde variant; die draagt de events waarop we optimistisch rekenen. */
type GekoppeldeDag = Extract<AgendaVandaag, { gekoppeld: true }>

// Container: haalt op, kent de staten, plaatst de presentatie. Vervangt het
// openen van Google Calendar "om even te kijken".
//
// Drie staten die echt verschillen, plus laden:
//   fout           — er ging iets mis. Weg terug: opnieuw proberen.
//   niet gekoppeld — we mogen niet kijken. Weg terug: koppelen.
//   gekoppeld      — je dag, inclusief wat er vrij is.
// Een lege agenda is géén vierde staat: dat is gewoon een rustige dag.

type Staat =
  | { fase: 'laden' }
  | { fase: 'fout'; bericht: string }
  | { fase: 'ok'; data: AgendaVandaag }

function leesKoppelUrl(ruw: unknown): { url: string } | null {
  if (typeof ruw !== 'object' || ruw === null) return null
  const url = (ruw as { url?: unknown }).url
  return typeof url === 'string' && url.length > 0 ? { url } : null
}

export function AgendaKaart() {
  const [staat, setStaat] = useState<Staat>({ fase: 'laden' })
  const [koppelFout, setKoppelFout] = useState<string | null>(null)
  // Fout van een schrijf-actie (afspraak toevoegen). Los van de laad-fout: een
  // mislukte toevoeging mag het geladen overzicht niet wegvegen.
  const [actieFout, setActieFout] = useState<string | null>(null)

  // De eerste sync: gestart-vlag in een ref (mag geen render veroorzaken),
  // afgerond-vlag in state (bepaalt wél wat we tonen).
  //
  // `syncKlaar` is nodig omdat `laatsteSync` null blijft als je week écht leeg
  // is. Zonder deze vlag is "nog nooit gekeken" niet meer te onderscheiden van
  // "niets gevonden", en zou de kaart eeuwig blijven laden.
  const syncGestart = useRef(false)
  const [syncKlaar, setSyncKlaar] = useState(false)

  // Generatieteller: `laad` wordt vanaf drie plekken aangeroepen (mount, na de
  // eerste sync, en de retry-knop). Zonder deze teller kunnen twee vluchten
  // elkaar inhalen en wint de oudste die toevallig als laatste terugkomt — dan
  // overschrijft verouderde data een verser antwoord. De cleanup hoogt 'm ook
  // op, zodat een vlucht die nog in de lucht is bij unmount niets meer zet.
  const generatie = useRef(0)

  const laad = useCallback((init?: RequestInit): Promise<void> => {
    const mijn = ++generatie.current
    // setState staat in de .then-callback, niet in de effect-body: dat is de
    // vorm die React bedoelt ("setState in een callback zodra een extern
    // systeem iets teruggeeft") en die geen cascaderende render veroorzaakt.
    return haalJson('/api/lifeos/agenda/vandaag', leesAgendaVandaag, init).then((uitkomst) => {
      if (mijn !== generatie.current) return // ingehaald of ontkoppeld
      setStaat(
        uitkomst.ok
          ? { fase: 'ok', data: uitkomst.waarde }
          : { fase: 'fout', bericht: uitkomst.fout },
      )
    })
  }, [])

  /**
   * Verklaart alles wat nu in de lucht is ongeldig. Als cleanup betekent dat:
   * een fetch die tijdens unmount nog loopt, zet straks niets meer.
   *
   * Bewust een eigen functie i.p.v. `generatie.current++` in de cleanup-body:
   * exhaustive-deps waarschuwt daar dat de ref "veranderd kan zijn" — een regel
   * die voor DOM-refs bedoeld is en aanraadt de waarde te kopiëren. Precies het
   * tegenovergestelde van wat hier moet gebeuren. Deze vorm zegt wat het is.
   */
  const verval = useCallback(() => {
    generatie.current++
  }, [])

  useEffect(() => {
    void laad()
    return verval
  }, [laad, verval])

  // Wel gekoppeld, nooit gesynct? Dan is de cache leeg omdat niemand gekeken
  // heeft — niet omdat je dag leeg is. Eerst kijken, dan pas iets beweren.
  useEffect(() => {
    if (staat.fase !== 'ok' || !staat.data.gekoppeld) return
    if (staat.data.laatsteSync !== null || syncGestart.current) return

    syncGestart.current = true
    void (async () => {
      const uitkomst = await haalJson('/api/lifeos/agenda/sync', leesNiets, { method: 'POST' })
      setSyncKlaar(true)
      if (uitkomst.ok) {
        await laad()
      } else {
        setStaat({ fase: 'fout', bericht: uitkomst.fout })
      }
    })()
  }, [staat, laad])

  const opnieuw = useCallback(() => {
    setStaat({ fase: 'laden' })
    void laad()
  }, [laad])

  const koppel = useCallback(async () => {
    setKoppelFout(null)
    const uitkomst = await haalJson('/api/lifeos/agenda/koppel', leesKoppelUrl)
    if (!uitkomst.ok) {
      setKoppelFout(uitkomst.fout)
      return
    }
    window.location.assign(uitkomst.waarde.url)
  }, [])

  /**
   * Voegt een afspraak toe: optimistisch, met rollback én een zichtbare fout.
   *
   * De optimistische stap herberekent `volgende` en de vrije blokken met dezelfde
   * pure functies als de server — geen nagemaakte logica, dus het beeld klopt
   * meteen. Lukt de POST, dan halen we de dag opnieuw op (`no-store`, want
   * /vandaag cachet 60s en zou de verse afspraak kunnen missen) zodat de echte
   * server-id en herberekening de tijdelijke vervangen. Mislukt het, dan draaien
   * we terug naar de snapshot ÉN zeggen we het — nooit stil.
   */
  const voegToe = useCallback(
    async (invoer: NieuwEventInvoer): Promise<{ ok: true } | { ok: false; fout: string }> => {
      if (staat.fase !== 'ok' || !staat.data.gekoppeld) {
        return { ok: false, fout: 'Je agenda is niet gekoppeld.' }
      }

      const terug = staat.data // snapshot voor de rollback
      const tijdelijk: AfspraakJson = {
        id: crypto.randomUUID(),
        titel: invoer.titel,
        startOp: invoer.startOp,
        eindOp: invoer.eindOp,
        heleDag: false,
        locatie: invoer.locatie ?? null,
      }

      setActieFout(null)
      setStaat({ fase: 'ok', data: metNieuweAfspraak(terug, tijdelijk) })

      const uitkomst = await haalJson('/api/lifeos/agenda/events', leesNiets, {
        method: 'POST',
        body: JSON.stringify(invoer),
      })

      if (!uitkomst.ok) {
        setStaat({ fase: 'ok', data: terug })
        setActieFout(`${uitkomst.fout} De afspraak is niet aangemaakt.`)
        return { ok: false, fout: uitkomst.fout }
      }

      await laad({ cache: 'no-store' })
      return { ok: true }
    },
    [staat, laad],
  )

  /**
   * Plant een focusblok in een vrij blok.
   *
   * Bewust NIET optimistisch, anders dan `voegToe`: daar kent de client de exacte
   * tijden al (hij typte ze), hier bepaalt de SERVER waar het blok landt — die
   * herrekent de vrije ruimte uit de cache en kan 'm nét ergens anders neerzetten
   * dan wij denken. Een optimistisch blok op de verkeerde tijd tonen en het daarna
   * zien verspringen is erger dan een halve seconde wachten. Dus: POST, dan de dag
   * opnieuw ophalen (`no-store`, want /vandaag cachet 60s) en het echte antwoord tonen.
   */
  const planBlok = useCallback(
    async (blok: VrijBlokJson): Promise<{ ok: true } | { ok: false; fout: string }> => {
      setActieFout(null)
      const uitkomst = await haalJson('/api/lifeos/agenda/focusblok', leesNiets, {
        method: 'POST',
        body: JSON.stringify({ vanafOp: blok.startOp }),
      })

      if (!uitkomst.ok) return { ok: false, fout: uitkomst.fout }

      await laad({ cache: 'no-store' })
      return { ok: true }
    },
    [laad],
  )

  return (
    <Kaart titel="Je dag" vervangt="Calendar">
      {staat.fase === 'laden' ? <Skelet /> : null}

      {staat.fase === 'fout' ? <Foutmelding bericht={staat.bericht} opnieuw={opnieuw} /> : null}

      {staat.fase === 'ok' && !staat.data.gekoppeld ? (
        <div style={{ display: 'grid', gap: 14, justifyItems: 'start' }}>
          <NogNiets
            wat="Agenda niet gekoppeld"
            waarom="Koppel je Google-agenda: je eerstvolgende afspraak, de vrije blokken waar training of deep work in past, en afspraken toevoegen zonder Google te openen."
          />
          <Knop variant="primair" onClick={() => void koppel()}>
            <CalendarPlus size={14} strokeWidth={2.2} aria-hidden="true" />
            Google Agenda koppelen
          </Knop>
          {koppelFout ? <Foutmelding bericht={koppelFout} /> : null}
        </div>
      ) : null}

      {staat.fase === 'ok' && staat.data.gekoppeld ? (
        staat.data.laatsteSync === null && !syncKlaar ? (
          // Gekoppeld, maar nog niets opgehaald: de sync hierboven loopt. Nu
          // "geen afspraken" tonen zou een leugen zijn over een dag die we niet
          // gelezen hebben. Is de sync wél geweest en is er nog steeds niets,
          // dan is je week gewoon leeg — dat mag hij dan zeggen.
          <Skelet />
        ) : (
          <div style={{ display: 'grid', gap: 16 }}>
            <Dagoverzicht
              volgende={staat.data.volgende}
              loopt={
                staat.data.volgende !== null &&
                looptNu(vanAfspraakJson(staat.data.volgende), new Date())
              }
              vrijeBlokken={staat.data.vrijeBlokken}
              onPlan={planBlok}
            />
            <NieuweAfspraak onToevoegen={voegToe} />
            {actieFout ? <Foutmelding bericht={actieFout} /> : null}
          </div>
        )
      ) : null}
    </Kaart>
  )
}

/**
 * De dag mét een zojuist toegevoegde afspraak — optimistisch, maar met de échte
 * pure functies, niet met een nagemaakte berekening.
 *
 * Valt de afspraak op een andere dag dan we tonen, dan raakt hij dit overzicht
 * niet: we laten het onveranderd (de reload haalt 'm op zodra je naar die dag
 * kijkt). Anders voegen we 'm toe en herberekenen we `volgende` en de vrije
 * blokken precies zoals de server dat zou doen.
 */
function metNieuweAfspraak(data: GekoppeldeDag, nieuw: AfspraakJson): GekoppeldeDag {
  const dag = leesDatumSleutel(data.dag)
  if (!dag || datumSleutel(new Date(nieuw.startOp)) !== data.dag) return data

  const events = [...data.events, nieuw].sort((a, b) => a.startOp.localeCompare(b.startOp))
  const afspraken = events.map(vanAfspraakJson)
  const nu = new Date()
  const isVandaag = data.dag === datumSleutel(nu)
  const volgende = eerstvolgendeAfspraak(afspraken, nu)

  return {
    ...data,
    events,
    volgende: volgende ? naarAfspraakJson(volgende) : null,
    vrijeBlokken: vrijeBlokken(afspraken, werkVenster(dag), isVandaag ? { nu } : {}).map(
      naarVrijBlokJson,
    ),
  }
}

/** Rustige placeholder in navy. Geen spinner-spektakel. */
function Skelet() {
  return (
    <div aria-hidden="true" style={{ display: 'grid', gap: 9 }}>
      <div style={{ height: 30, width: '46%', borderRadius: 6, background: 'var(--bg-raised)' }} />
      <div style={{ height: 13, width: '62%', borderRadius: 4, background: 'var(--bg-raised)' }} />
      <div style={{ height: 13, width: '34%', borderRadius: 4, background: 'var(--bg-raised)' }} />
    </div>
  )
}
