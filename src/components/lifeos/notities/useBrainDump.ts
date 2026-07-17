'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { haalJson, leesNiets } from '@/lib/lifeos/api/http'
import { datumSleutel } from '@/lib/lifeos/datum/datum'
import { leesTitelsAntwoord } from '@/lib/lifeos/notities/links'
import {
  leesNotitieAntwoord,
  leesNotitiesAntwoord,
  type NotitieCategorie,
  type Notitie,
  type NotitieWijziging,
} from '@/lib/lifeos/notities/notities'
import { voegTagToe, verwijderTag } from '@/lib/lifeos/notities/tags'

// Alle data-logica van de brain dump. `BrainDumpKaart` tekent alleen nog.
//
// Een eigen hook en geen 280-regels-component: het laden, de optimistische
// updates en de rollback zijn het echte werk hier, en die wil je kunnen lezen
// zonder door JSX heen te scrollen (architecture.md — container/presentational).

/** Antwoord van /api/lifeos/notities/categoriseer. */
export interface CategorieSuggestieAntwoord {
  categorie: NotitieCategorie | 'onbekend'
  /** 0-1, van het model zelf. */
  vertrouwen: number
  /**
   * Ligt het vertrouwen boven de drempel uit `intentie.ts`? De DREMPEL woont
   * daar, niet hier: één plek die bepaalt wanneer een gok een vraag wordt.
   */
  zeker: boolean
}

function leesCategorieAntwoord(ruw: unknown): CategorieSuggestieAntwoord | null {
  if (typeof ruw !== 'object' || ruw === null) return null
  const o = ruw as Record<string, unknown>
  if (typeof o.categorie !== 'string') return null

  return {
    categorie: o.categorie as NotitieCategorie | 'onbekend',
    // Geen gegokte 1: kent de server geen vertrouwen, dan is het 0 en dus
    // onzeker. Liever te voorzichtig dan een gok die zichzelf zeker noemt.
    vertrouwen: typeof o.vertrouwen === 'number' && Number.isFinite(o.vertrouwen) ? o.vertrouwen : 0,
    zeker: o.zeker === true,
  }
}

export type BrainDumpStaat =
  | { fase: 'laden' }
  | { fase: 'fout'; bericht: string }
  | { fase: 'ok'; notities: Notitie[]; erIsMeer: boolean }

/** Optimistische regels krijgen een lokaal id tot de server het echte teruggeeft. */
export const TIJDELIJK = 'tijdelijk:'

export function isOnbevestigd(notitie: Notitie): boolean {
  return notitie.id.startsWith(TIJDELIJK)
}

/** Een AI-voorstel dat op bevestiging wacht. Nooit stil toegepast. */
export interface CategorieVoorstel {
  notitieId: string
  categorie: NotitieCategorie
  vertrouwen: number
}

export interface BrainDump {
  staat: BrainDumpStaat
  actieFout: string | null
  tekst: string
  zetTekst: (waarde: string) => void
  voegToe: () => void
  haalWeg: (notitie: Notitie) => void
  opnieuw: () => void
  /** Zoektekst. Leeg = de notities van vandaag; gevuld = zoeken over alle dagen. */
  zoek: string
  zetZoek: (waarde: string) => void
  /** Voegt een tag toe of haalt 'm weg (optimistisch, met rollback). */
  wijzigTag: (notitie: Notitie, tag: string, actie: 'toevoegen' | 'weghalen') => void
  /** Wijzigt tekst en/of titel van een bestaande notitie. */
  bewerk: (notitie: Notitie, wijziging: NotitieWijziging) => void
  /** Vraagt de AI om een categorie. Zeker → toepassen; onzeker → voorstel. */
  categoriseer: (notitie: Notitie) => void
  bezigMetCategorie: string | null
  /** Wacht op bevestiging (het model was niet zeker genoeg). */
  voorstel: CategorieVoorstel | null
  bevestigVoorstel: () => void
  verwerpVoorstel: () => void
  /**
   * De titels die bestaan — waarmee de UI een [[verwijzing]] kan duiden.
   *
   * `undefined` = we weten het (nog) niet: nog aan het laden, de call mislukte,
   * of er waren te veel titels. De UI beweert dan van geen enkele verwijzing dat
   * hij niet bestaat. "Ik weet het niet" is een geldig antwoord; gokken niet.
   */
  bestaandeTitels: ReadonlySet<string> | undefined
}

export function useBrainDump(): BrainDump {
  const [staat, setStaat] = useState<BrainDumpStaat>({ fase: 'laden' })
  const [actieFout, setActieFout] = useState<string | null>(null)
  const [tekst, setTekst] = useState('')
  const [zoek, setZoek] = useState('')
  const [bezigMetCategorie, setBezigMetCategorie] = useState<string | null>(null)
  const [voorstel, setVoorstel] = useState<CategorieVoorstel | null>(null)
  // undefined = "ik weet het niet" (nog aan het laden, of het lukte niet). Zie
  // `BrainDump.bestaandeTitels`: dan claimt de UI niets over een verwijzing.
  const [bestaandeTitels, setBestaandeTitels] = useState<Set<string> | undefined>(undefined)

  // De dag in een ref, niet in state: hij stuurt geen render aan, hij bepaalt
  // alleen wát we ophalen. En hij wordt pas ná mount bepaald — `new Date()`
  // tijdens render geeft op de server de servertijd en in de browser de jouwe.
  const dagRef = useRef<string | null>(null)

  // De actuele tekst buiten React om: bij een mislukte POST moeten we weten of
  // je intussen alwéér iets getypt hebt. De closure van `voegToe` weet dat niet
  // — die kent alleen de tekst van het moment van versturen.
  const tekstRef = useRef('')

  // Generatieteller: zonder deze kunnen twee vluchten elkaar inhalen en wint de
  // oudste die toevallig als laatste terugkomt. `verval` hoogt 'm op, zodat een
  // vlucht die bij unmount nog loopt niets meer zet. Zie useTaken.
  const generatie = useRef(0)

  // Bouwt de query: is er een zoekterm, dan zoeken we over ALLE dagen (een idee
  // van vorige week is dan net zo goed vindbaar); anders de notities van vandaag.
  const bouwQuery = useCallback((zoekterm: string): string => {
    const term = zoekterm.trim()
    if (term.length > 0) return `soort=brain_dump&zoek=${encodeURIComponent(term)}`
    const dag = dagRef.current ?? datumSleutel(new Date())
    return `soort=brain_dump&datum=${encodeURIComponent(dag)}`
  }, [])

  const laad = useCallback((query: string): Promise<void> => {
    const mijn = ++generatie.current
    return haalJson(`/api/lifeos/notities?${query}`, leesNotitiesAntwoord).then((uitkomst) => {
      if (mijn !== generatie.current) return // ingehaald of ontkoppeld
      if (!uitkomst.ok) {
        setStaat({ fase: 'fout', bericht: uitkomst.fout })
        return
      }
      const { notities, erIsMeer, onleesbaar } = uitkomst.waarde
      setStaat({ fase: 'ok', notities, erIsMeer })
      // Onleesbare rijen zijn zeldzaam, maar ze stil laten verdwijnen is precies
      // de bug die de tolerante lezer had kunnen introduceren. Dus: zeggen.
      setActieFout(
        onleesbaar > 0
          ? `${onleesbaar} ${onleesbaar === 1 ? 'notitie' : 'notities'} kon niet gelezen worden en ${onleesbaar === 1 ? 'staat' : 'staan'} hier niet bij.`
          : null,
      )
    })
  }, [])

  /**
   * De titels die bestaan, zodat een `[[verwijzing]]` geduid kan worden.
   *
   * Een eigen call en niet afgeleid uit de zichtbare lijst: die bevat alleen
   * vandaag (of je zoekresultaat), en dan zou een verwijzing naar een notitie
   * van vorige week er als "bestaat nog niet" uitzien. Dat is een leugen tegen
   * de gebruiker — en precies het soort dat je niet meer opmerkt.
   *
   * Mislukt de call, dan blijft dit `undefined`: geen foutmelding (je notities
   * doen het gewoon), maar ook geen gok. De verwijzingen krijgen dan de neutrale
   * stijl.
   */
  const laadTitels = useCallback((): Promise<void> => {
    return haalJson('/api/lifeos/notities/titels', leesTitelsAntwoord).then((uitkomst) => {
      setBestaandeTitels(uitkomst.ok ? uitkomst.waarde : undefined)
    })
  }, [])

  /** Verklaart alles wat nu in de lucht is ongeldig — zie useTaken. */
  const verval = useCallback(() => {
    generatie.current++
  }, [])

  useEffect(() => {
    dagRef.current = datumSleutel(new Date())
    void laad(bouwQuery(''))
    void laadTitels()
    return verval
  }, [laad, bouwQuery, laadTitels, verval])

  // Zoeken, gedebounced: pas 300ms ná je laatste toetsaanslag laden we opnieuw,
  // zodat elke letter geen aparte query afvuurt. De generatieteller in `laad`
  // vangt af dat een trage oudere zoekopdracht een verse inhaalt.
  const eersteZoek = useRef(true)
  useEffect(() => {
    if (eersteZoek.current) {
      eersteZoek.current = false
      return // de mount-effect deed de eerste lading al
    }
    const id = setTimeout(() => void laad(bouwQuery(zoek)), 300)
    return () => clearTimeout(id)
  }, [zoek, laad, bouwQuery])

  const opnieuw = useCallback(() => {
    setStaat({ fase: 'laden' })
    void laad(bouwQuery(zoek))
  }, [laad, bouwQuery, zoek])

  const zetTekst = useCallback((waarde: string) => {
    setTekst(waarde)
    tekstRef.current = waarde
  }, [])

  const voegToe = useCallback(() => {
    const dag = dagRef.current
    if (staat.fase !== 'ok' || !dag) return

    const nieuweTekst = tekst.trim()
    if (nieuweTekst.length === 0) return

    const terug = staat.notities // snapshot voor de rollback
    const tijdelijkId = `${TIJDELIJK}${crypto.randomUUID()}`
    const nu = new Date().toISOString()

    // Meteen weg uit je hoofd én meteen leeg veld: de volgende gedachte kan
    // erin zonder dat je op iets wacht.
    setActieFout(null)
    setTekst('')
    tekstRef.current = ''
    setStaat({
      fase: 'ok',
      erIsMeer: staat.erIsMeer,
      notities: [
        ...terug,
        {
          id: tijdelijkId,
          tekst: nieuweTekst,
          soort: 'brain_dump',
          datum: dag,
          // Een nieuwe notitie start zonder titel, tags en categorie — die komen
          // pas als je ze toevoegt of de AI-categorie bevestigt.
          titel: null,
          tags: [],
          categorie: null,
          aangemaaktOp: nu,
          bijgewerktOp: nu,
        },
      ],
    })

    void haalJson('/api/lifeos/notities', leesNotitieAntwoord, {
      method: 'POST',
      body: JSON.stringify({ tekst: nieuweTekst, soort: 'brain_dump', datum: dag }),
    }).then((uitkomst) => {
      if (uitkomst.ok) {
        // De server is de waarheid: het echte id komt daarvandaan, niet van ons.
        const { notitie: bevestigd, waarschuwing } = uitkomst.waarde
        setStaat((huidig) =>
          huidig.fase === 'ok'
            ? {
                ...huidig,
                notities: huidig.notities.map((n) => (n.id === tijdelijkId ? bevestigd : n)),
              }
            : huidig,
        )
        // De notitie staat er, maar de verwijzingen niet. Zeggen — anders mist de
        // grafiek stil een kant.
        if (waarschuwing !== null) setActieFout(waarschuwing)
        return
      }

      // Terugdraaien én zeggen. Nooit stil: een idee dat zonder reden uit je
      // brain dump verdwijnt, is de enige onvergeeflijke bug in deze functie.
      setStaat((huidig) =>
        huidig.fase === 'ok'
          ? { ...huidig, notities: huidig.notities.filter((n) => n.id !== tijdelijkId) }
          : huidig,
      )

      // Je idee mag niet weg zijn omdat ons netwerk het niet deed. Is het veld
      // nog leeg, dan zetten we 'm terug. Typte je alweer verder, dan blijft dát
      // staan (je nieuwe gedachte overschrijven is óók verlies) en zetten we de
      // oude in de foutmelding. Zo is hij in beide gevallen terug te halen.
      if (tekstRef.current.trim().length === 0) {
        setTekst(nieuweTekst)
        tekstRef.current = nieuweTekst
        setActieFout(`${uitkomst.fout} Je notitie is niet opgeslagen — hij staat weer in het veld.`)
      } else {
        setActieFout(`${uitkomst.fout} Niet opgeslagen: "${nieuweTekst}"`)
      }
    })
  }, [staat, tekst])

  const haalWeg = useCallback(
    (notitie: Notitie) => {
      if (staat.fase !== 'ok') return
      // Nog niet bevestigd door de server: er is nog geen echt id om te
      // verwijderen. De POST die loopt zou 'm daarna alsnog terugzetten. De knop
      // staat hiervoor al uit; dit is het tweede slot.
      if (isOnbevestigd(notitie)) return

      const terug = staat.notities
      setActieFout(null)
      setStaat({ ...staat, notities: terug.filter((n) => n.id !== notitie.id) })

      void haalJson(`/api/lifeos/notities/${notitie.id}`, leesNiets, { method: 'DELETE' }).then(
        (uitkomst) => {
          if (!uitkomst.ok) {
            setStaat((huidig) => (huidig.fase === 'ok' ? { ...huidig, notities: terug } : huidig))
            setActieFout(`${uitkomst.fout} Je notitie staat er nog.`)
          }
        },
      )
    },
    [staat],
  )

  // Vervangt één notitie in de lijst (voor optimistische updates).
  const vervangNotitie = useCallback((vervangen: Notitie) => {
    setStaat((huidig) =>
      huidig.fase === 'ok'
        ? { ...huidig, notities: huidig.notities.map((n) => (n.id === vervangen.id ? vervangen : n)) }
        : huidig,
    )
  }, [])

  /**
   * Eén PATCH, optimistisch, met rollback. Alle wijzigingen (tag, categorie,
   * tekst, titel) lopen hierlangs — dat was drie keer bijna-dezelfde code.
   */
  const patch = useCallback(
    (notitie: Notitie, wijziging: NotitieWijziging, optimistisch: Notitie, waarbij: string) => {
      setActieFout(null)
      vervangNotitie(optimistisch)

      void haalJson(`/api/lifeos/notities/${notitie.id}`, leesNotitieAntwoord, {
        method: 'PATCH',
        body: JSON.stringify(wijziging),
      }).then((uitkomst) => {
        if (uitkomst.ok) {
          vervangNotitie(uitkomst.waarde.notitie) // de server is de waarheid
          if (uitkomst.waarde.waarschuwing !== null) setActieFout(uitkomst.waarde.waarschuwing)
          return
        }
        vervangNotitie(notitie) // terugdraaien
        setActieFout(`${uitkomst.fout} ${waarbij}`)
      })
    },
    [vervangNotitie],
  )

  const wijzigTag = useCallback(
    (notitie: Notitie, tag: string, actie: 'toevoegen' | 'weghalen') => {
      if (staat.fase !== 'ok' || isOnbevestigd(notitie)) return

      const nieuweTags =
        actie === 'toevoegen' ? voegTagToe(notitie.tags, tag) : verwijderTag(notitie.tags, tag)
      // Niets veranderd (dubbele tag, of tag bestond niet)? Geen zinloze PATCH.
      if (
        nieuweTags.length === notitie.tags.length &&
        nieuweTags.every((t, i) => t === notitie.tags[i])
      ) {
        return
      }

      patch(notitie, { tags: nieuweTags }, { ...notitie, tags: nieuweTags }, 'De tag is niet opgeslagen.')
    },
    [staat, patch],
  )

  const bewerk = useCallback(
    (notitie: Notitie, wijziging: NotitieWijziging) => {
      if (staat.fase !== 'ok' || isOnbevestigd(notitie)) return

      const tekstAnders = wijziging.tekst !== undefined && wijziging.tekst !== notitie.tekst
      const titelAnders = wijziging.titel !== undefined && wijziging.titel !== notitie.titel
      if (!tekstAnders && !titelAnders) return // niets veranderd: geen PATCH

      const smal: NotitieWijziging = {
        ...(tekstAnders ? { tekst: wijziging.tekst } : {}),
        ...(titelAnders ? { titel: wijziging.titel } : {}),
      }
      patch(notitie, smal, { ...notitie, ...smal }, 'Je wijziging is niet opgeslagen.')

      // Een nieuwe of gewijzigde titel verandert wélke verwijzingen bestaan: een
      // `[[Marge-model]]` elders is vanaf nu geen wens meer. Zonder deze
      // verversing blijft die tot een reload "bestaat nog niet" tonen — precies
      // het moment waarop het systeem zijn belofte moet waarmaken.
      if (titelAnders) void laadTitels()
    },
    [staat, patch, laadTitels],
  )

  const pasCategorieToe = useCallback(
    (notitie: Notitie, categorie: NotitieCategorie) => {
      patch(
        notitie,
        { categorie },
        { ...notitie, categorie },
        'De categorie is niet opgeslagen.',
      )
    },
    [patch],
  )

  /**
   * Vraagt de AI om een categorie.
   *
   * ─── EEN GOK IS EEN VRAAG, GEEN ANTWOORD ──────────────────────────────────
   * Dit paste elke suggestie meteen toe, hoe onzeker het model ook was — het
   * `vertrouwen` werd niet eens meegestuurd. Nu bepaalt de server (met de drempel
   * uit `intentie.ts`) of het zeker genoeg is:
   *
   *   zeker   → toepassen; je ziet het gebeuren en kunt het terugdraaien.
   *   onzeker → als VOORSTEL tonen ("Vita denkt: Idee — toepassen?").
   *
   * Zo schuift een gok van 0.2 je notitie nooit stil in de verkeerde bak.
   */
  const categoriseer = useCallback(
    (notitie: Notitie) => {
      if (staat.fase !== 'ok' || isOnbevestigd(notitie)) return

      setActieFout(null)
      setVoorstel(null)
      setBezigMetCategorie(notitie.id)

      void haalJson('/api/lifeos/notities/categoriseer', leesCategorieAntwoord, {
        method: 'POST',
        body: JSON.stringify({ tekst: notitie.tekst }),
      }).then((uitkomst) => {
        setBezigMetCategorie(null)
        if (!uitkomst.ok) {
          setActieFout(uitkomst.fout)
          return
        }

        const { categorie, vertrouwen, zeker } = uitkomst.waarde
        if (categorie === 'onbekend') {
          // Geen verwijt en geen gok: het model wist het niet. Zeg dat gewoon.
          setActieFout('De AI kon geen categorie kiezen voor deze notitie.')
          return
        }

        if (zeker) pasCategorieToe(notitie, categorie)
        else setVoorstel({ notitieId: notitie.id, categorie, vertrouwen })
      })
    },
    [staat, pasCategorieToe],
  )

  const bevestigVoorstel = useCallback(() => {
    if (staat.fase !== 'ok' || voorstel === null) return
    const notitie = staat.notities.find((n) => n.id === voorstel.notitieId)
    setVoorstel(null)
    if (notitie !== undefined) pasCategorieToe(notitie, voorstel.categorie)
  }, [staat, voorstel, pasCategorieToe])

  const verwerpVoorstel = useCallback(() => setVoorstel(null), [])

  return {
    staat,
    actieFout,
    tekst,
    zetTekst,
    voegToe,
    haalWeg,
    opnieuw,
    zoek,
    zetZoek: setZoek,
    wijzigTag,
    bewerk,
    categoriseer,
    bezigMetCategorie,
    voorstel,
    bevestigVoorstel,
    verwerpVoorstel,
    bestaandeTitels,
  }
}
