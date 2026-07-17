'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { MailPlus } from 'lucide-react'
import { Kaart, NogNiets } from '@/components/lifeos/os/Kaart'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { Knop } from '@/components/lifeos/os/Knop'
import { haalJson } from '@/lib/lifeos/api/http'
import { leesInboxVandaag, type InboxVandaag, type TriageMailJson } from '@/lib/lifeos/inbox/inbox'
import { Triagelijst } from './Triagelijst'
import { useSuggesties } from './useSuggesties'
import { maakActie } from './acties'
import { voerMailActieUit, vraagConcept, type MailActieSoort } from './mail-acties'

// Container: haalt op, kent de staten, plaatst de presentatie. Voor het
// Avond-moment. Vervangt "even Gmail openen om te kijken of er nog iets ligt".
//
// Drie staten die echt verschillen, plus laden:
//   fout           — er ging iets mis. Weg terug: opnieuw proberen.
//   niet gekoppeld — we mogen niet kijken. Weg terug: koppelen.
//   gekoppeld      — de triage.
//
// "Niets vraagt iets van je" is GEEN vierde staat maar een uitkomst van de derde:
// we hebben gekeken en het antwoord is nul. Dat verschil is hier het hele punt.
// Een netwerkfout die als "geen mail" rendert, vertelt Kane dat niemand iets van
// hem wil terwijl er een aanmaning ligt — dat is de duurste bug die deze kaart
// kan hebben, en daarom heeft `fout` een eigen tak die niets over je post beweert.

type Staat =
  | { fase: 'laden' }
  | { fase: 'fout'; bericht: string }
  | { fase: 'ok'; data: InboxVandaag }

function leesKoppelUrl(ruw: unknown): { url: string } | null {
  if (typeof ruw !== 'object' || ruw === null) return null
  const url = (ruw as { url?: unknown }).url
  return typeof url === 'string' && url.length > 0 ? { url } : null
}

/**
 * Stabiele lege lijst voor de suggestie-hook zolang er geen triage is. Eén vaste
 * referentie, zodat een render buiten de gekoppelde staat de hook niet elke keer
 * opnieuw laat vuren.
 */
const GEEN_MAILS: readonly TriageMailJson[] = []

export function InboxKaart() {
  const [staat, setStaat] = useState<Staat>({ fase: 'laden' })
  const [koppelFout, setKoppelFout] = useState<string | null>(null)

  // Generatieteller: `laad` wordt vanaf twee plekken aangeroepen (mount en de
  // retry-knop). Zonder deze teller kunnen twee vluchten elkaar inhalen en wint
  // de oudste die toevallig als laatste terugkomt — dan overschrijft verouderde
  // data een verser antwoord. De cleanup hoogt 'm ook op, zodat een vlucht die
  // bij unmount nog in de lucht is niets meer zet.
  const generatie = useRef(0)

  const laad = useCallback((): Promise<void> => {
    const mijn = ++generatie.current
    return haalJson('/api/lifeos/inbox/vandaag', leesInboxVandaag).then((uitkomst) => {
      if (mijn !== generatie.current) return // ingehaald of ontkoppeld
      setStaat(
        uitkomst.ok
          ? { fase: 'ok', data: uitkomst.waarde }
          : { fase: 'fout', bericht: uitkomst.fout },
      )
    })
  }, [])

  /**
   * Verklaart alles wat nu in de lucht is ongeldig. Als cleanup betekent dat: een
   * fetch die tijdens unmount nog loopt, zet straks niets meer.
   *
   * Bewust een eigen functie i.p.v. `generatie.current++` in de cleanup-body:
   * exhaustive-deps waarschuwt daar dat de ref "veranderd kan zijn" — een regel
   * die voor DOM-refs bedoeld is. Deze vorm zegt wat het is.
   */
  const verval = useCallback(() => {
    generatie.current++
  }, [])

  useEffect(() => {
    void laad()
    return verval
  }, [laad, verval])

  const opnieuw = useCallback(() => {
    setStaat({ fase: 'laden' })
    void laad()
  }, [laad])

  const koppel = useCallback(async () => {
    setKoppelFout(null)
    const uitkomst = await haalJson('/api/lifeos/inbox/koppel', leesKoppelUrl)
    if (!uitkomst.ok) {
      setKoppelFout(uitkomst.fout)
      return
    }
    window.location.assign(uitkomst.waarde.url)
  }, [])

  /**
   * Archiveren / gelezen markeren, en daarna de triage opnieuw ophalen.
   *
   * Bewust NIET optimistisch de regel weghalen. De triage is een LIVE lezing van
   * Gmail (geen cache — zie `vandaag/route.ts`), dus na een geslaagde actie geeft
   * Gmail de mail vanzelf niet meer terug: de lijst klopt dan omdat hij ververst
   * is, niet omdat wij 'm hebben bijgewerkt. Een regel wegvegen die Gmail nog wél
   * teruggeeft, zou een mail laten verdwijnen die er nog ligt — en dat is precies
   * het stille fout-negatief waar deze kaart tegen ontworpen is.
   */
  const mailActie = useCallback(
    async (soort: MailActieSoort, mail: TriageMailJson) => {
      const uitkomst = await voerMailActieUit(soort, mail)
      if (uitkomst.ok) await laad()
      return uitkomst
    },
    [laad],
  )

  /**
   * Vita schrijft een concept. De lijst verandert daar niet van — het concept
   * staat in je Gmail-concepten en de mail ligt nog gewoon in je inbox — dus geen
   * reload. De knop meldt zelf dat het klaarstaat.
   */
  const concept = useCallback((mail: TriageMailJson) => vraagConcept(mail), [])

  // De mails die de triage al ophaalde. Buiten de gekoppelde staat een stabiele
  // lege lijst, zodat de analyse pas vuurt als er ook echt post is. De referentie
  // van `vraagtActie` blijft tussen renders staan (het zit in `staat`), dus de
  // hook vuurt alleen opnieuw bij een verse laadbeurt — precies wat we willen.
  const mails: readonly TriageMailJson[] =
    staat.fase === 'ok' && staat.data.gekoppeld ? staat.data.vraagtActie : GEEN_MAILS
  const { status: analyseStatus, suggestieVoor } = useSuggesties(mails)

  return (
    <Kaart titel="Je inbox" vervangt="Gmail">
      {staat.fase === 'laden' ? <Skelet /> : null}

      {staat.fase === 'fout' ? <Foutmelding bericht={staat.bericht} opnieuw={opnieuw} /> : null}

      {staat.fase === 'ok' && !staat.data.gekoppeld ? (
        <div style={{ display: 'grid', gap: 14, justifyItems: 'start' }}>
          <NogNiets
            wat="Gmail niet gekoppeld"
            waarom="Koppel Gmail: LifeOS zegt je 's avonds welke mails écht iets van je vragen, zodat je de inbox niet meer opent 'om even te kijken'. Het leest alleen afzender en onderwerp — nooit de inhoud. Het kan mails archiveren, als gelezen markeren en concept-antwoorden klaarzetten in je Gmail-concepten. Versturen doe je altijd zelf; dat doet LifeOS nooit."
          />
          <Knop variant="primair" onClick={() => void koppel()}>
            <MailPlus size={14} strokeWidth={2.2} aria-hidden="true" />
            Gmail koppelen
          </Knop>
          {koppelFout ? <Foutmelding bericht={koppelFout} opnieuw={() => void koppel()} /> : null}
        </div>
      ) : null}

      {staat.fase === 'ok' && staat.data.gekoppeld ? (
        <Triagelijst
          mails={staat.data.vraagtActie}
          gescand={staat.data.gescand}
          nietGelezen={staat.data.nietGelezen}
          suggestieVoor={suggestieVoor}
          analyseStatus={analyseStatus}
          onMaak={maakActie}
          onMailActie={mailActie}
          onConcept={concept}
        />
      ) : null}
    </Kaart>
  )
}

/** Rustige placeholder in navy. Geen spinner-spektakel. */
function Skelet() {
  return (
    <div aria-hidden="true" style={{ display: 'grid', gap: 9 }}>
      <div style={{ height: 30, width: '28%', borderRadius: 6, background: 'var(--bg-raised)' }} />
      <div style={{ height: 13, width: '58%', borderRadius: 4, background: 'var(--bg-raised)' }} />
      <div style={{ height: 13, width: '44%', borderRadius: 4, background: 'var(--bg-raised)' }} />
    </div>
  )
}
