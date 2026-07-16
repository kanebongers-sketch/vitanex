'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { haalJson, leesNiets } from '@/lib/lifeos/api/http'
import { datumSleutel } from '@/lib/lifeos/datum/datum'
import {
  leesNotitieAntwoord,
  leesNotitiesAntwoord,
  type NotitieCategorie,
  type Notitie,
} from '@/lib/lifeos/notities/notities'
import { voegTagToe, verwijderTag } from '@/lib/lifeos/notities/tags'

/** Antwoord van /api/lifeos/notities/categoriseer. */
interface CategorieAntwoord {
  categorie: NotitieCategorie | 'onbekend'
}
function leesCategorieAntwoord(ruw: unknown): CategorieAntwoord | null {
  if (typeof ruw !== 'object' || ruw === null) return null
  const c = (ruw as { categorie?: unknown }).categorie
  return typeof c === 'string' ? { categorie: c as NotitieCategorie | 'onbekend' } : null
}

// Alle data-logica van de brain dump. `BrainDumpKaart` tekent alleen nog.
//
// Een eigen hook en geen 280-regels-component: het laden, de optimistische
// updates en de rollback zijn het echte werk hier, en die wil je kunnen lezen
// zonder door JSX heen te scrollen (architecture.md — container/presentational).

export type BrainDumpStaat =
  | { fase: 'laden' }
  | { fase: 'fout'; bericht: string }
  | { fase: 'ok'; notities: Notitie[] }

/** Optimistische regels krijgen een lokaal id tot de server het echte teruggeeft. */
export const TIJDELIJK = 'tijdelijk:'

export function isOnbevestigd(notitie: Notitie): boolean {
  return notitie.id.startsWith(TIJDELIJK)
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
  /** Vraagt de AI om een categorie en past die toe. */
  categoriseer: (notitie: Notitie) => void
  bezigMetCategorie: string | null
}

export function useBrainDump(): BrainDump {
  const [staat, setStaat] = useState<BrainDumpStaat>({ fase: 'laden' })
  const [actieFout, setActieFout] = useState<string | null>(null)
  const [tekst, setTekst] = useState('')
  const [zoek, setZoek] = useState('')
  const [bezigMetCategorie, setBezigMetCategorie] = useState<string | null>(null)

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
  // vlucht die bij unmount nog loopt niets meer zet. Zie Top3Kaart.
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
      setStaat(
        uitkomst.ok
          ? { fase: 'ok', notities: uitkomst.waarde }
          : { fase: 'fout', bericht: uitkomst.fout },
      )
    })
  }, [])

  /** Verklaart alles wat nu in de lucht is ongeldig — zie Top3Kaart. */
  const verval = useCallback(() => {
    generatie.current++
  }, [])

  useEffect(() => {
    dagRef.current = datumSleutel(new Date())
    void laad(bouwQuery(''))
    return verval
  }, [laad, bouwQuery, verval])

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
      notities: [
        ...terug,
        {
          id: tijdelijkId,
          tekst: nieuweTekst,
          soort: 'brain_dump',
          datum: dag,
          // Een nieuwe notitie start zonder tags en zonder categorie — die
          // komen pas als je ze toevoegt of de AI-categorie bevestigt.
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
        const bevestigd = uitkomst.waarde
        setStaat((huidig) =>
          huidig.fase === 'ok'
            ? {
                fase: 'ok',
                notities: huidig.notities.map((n) => (n.id === tijdelijkId ? bevestigd : n)),
              }
            : huidig,
        )
        return
      }

      // Terugdraaien én zeggen. Nooit stil: een idee dat zonder reden uit je
      // brain dump verdwijnt, is de enige onvergeeflijke bug in deze functie.
      setStaat((huidig) =>
        huidig.fase === 'ok'
          ? { fase: 'ok', notities: huidig.notities.filter((n) => n.id !== tijdelijkId) }
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
      setStaat({ fase: 'ok', notities: terug.filter((n) => n.id !== notitie.id) })

      void haalJson(`/api/lifeos/notities/${notitie.id}`, leesNiets, { method: 'DELETE' }).then(
        (uitkomst) => {
          if (!uitkomst.ok) {
            setStaat({ fase: 'ok', notities: terug })
            setActieFout(`${uitkomst.fout} Je notitie staat er nog.`)
          }
        },
      )
    },
    [staat],
  )

  // Vervangt één notitie in de lijst (voor optimistische tag/categorie-updates).
  const vervangNotitie = useCallback((vervangen: Notitie) => {
    setStaat((huidig) =>
      huidig.fase === 'ok'
        ? { fase: 'ok', notities: huidig.notities.map((n) => (n.id === vervangen.id ? vervangen : n)) }
        : huidig,
    )
  }, [])

  const wijzigTag = useCallback(
    (notitie: Notitie, tag: string, actie: 'toevoegen' | 'weghalen') => {
      if (staat.fase !== 'ok' || isOnbevestigd(notitie)) return

      const nieuweTags =
        actie === 'toevoegen' ? voegTagToe(notitie.tags, tag) : verwijderTag(notitie.tags, tag)
      // Niets veranderd (dubbele tag, of tag bestond niet)? Geen zinloze PATCH.
      if (nieuweTags.length === notitie.tags.length && nieuweTags.every((t, i) => t === notitie.tags[i])) {
        return
      }

      setActieFout(null)
      vervangNotitie({ ...notitie, tags: nieuweTags })

      void haalJson(`/api/lifeos/notities/${notitie.id}`, leesNotitieAntwoord, {
        method: 'PATCH',
        body: JSON.stringify({ tags: nieuweTags }),
      }).then((uitkomst) => {
        if (uitkomst.ok) {
          vervangNotitie(uitkomst.waarde) // de server is de waarheid
        } else {
          vervangNotitie(notitie) // terugdraaien
          setActieFout(`${uitkomst.fout} De tag is niet opgeslagen.`)
        }
      })
    },
    [staat, vervangNotitie],
  )

  const categoriseer = useCallback(
    (notitie: Notitie) => {
      if (staat.fase !== 'ok' || isOnbevestigd(notitie)) return

      setActieFout(null)
      setBezigMetCategorie(notitie.id)

      void haalJson('/api/lifeos/notities/categoriseer', leesCategorieAntwoord, {
        method: 'POST',
        body: JSON.stringify({ tekst: notitie.tekst }),
      }).then((uitkomst) => {
        setBezigMetCategorie(null)
        if (!uitkomst.ok) {
          setActieFout(`${uitkomst.fout}`)
          return
        }
        const suggestie = uitkomst.waarde.categorie
        if (suggestie === 'onbekend') {
          // Geen verwijt en geen gok: het model wist het niet. Zeg dat gewoon.
          setActieFout('De AI kon geen categorie kiezen voor deze notitie.')
          return
        }
        // Wél een suggestie: pas 'm toe (optimistisch, met rollback).
        vervangNotitie({ ...notitie, categorie: suggestie })
        void haalJson(`/api/lifeos/notities/${notitie.id}`, leesNotitieAntwoord, {
          method: 'PATCH',
          body: JSON.stringify({ categorie: suggestie }),
        }).then((res) => {
          if (res.ok) vervangNotitie(res.waarde)
          else {
            vervangNotitie(notitie)
            setActieFout(`${res.fout} De categorie is niet opgeslagen.`)
          }
        })
      })
    },
    [staat, vervangNotitie],
  )

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
    categoriseer,
    bezigMetCategorie,
  }
}
