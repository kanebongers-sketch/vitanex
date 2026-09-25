// ─── LifeOS — Sportmerk: narrowing op de systeemgrens ───────────────────────
// `unknown` → `Strategie`. Geen cast: klopt de vorm niet, dan is het antwoord
// `null` en toont de kaart een nette fout i.p.v. een half plan. Kern-velden zijn
// verplicht — een product zonder marge of een argument zonder tekst laat de hele
// strategie vallen, want een half plan tonen zou iets onwaars suggereren.

import { getalOfNull, isObject, tekstOfNull } from '@/lib/lifeos/api/http'
import type {
  Argument,
  BerekendeMarge,
  Fase,
  LabelWaarde,
  ProductMetMarge,
  ProductRol,
  Risico,
  Strategie,
  TitelTekst,
} from '@/lib/lifeos/sportmerk/types'

const RISICOS: readonly Risico[] = ['laag', 'middel', 'hoog']
const ROLLEN: readonly ProductRol[] = ['hoofdproduct', 'hoofdaanbod', 'margemotor', 'add-on', 'later', 'reserve', 'vergelijking']

function isRisico(v: unknown): v is Risico {
  return typeof v === 'string' && (RISICOS as readonly string[]).includes(v)
}

function isRol(v: unknown): v is ProductRol {
  return typeof v === 'string' && (ROLLEN as readonly string[]).includes(v)
}

/** Een lijst waarvan élk item moet kloppen; één fout item = `null`. */
function leesLijst<T>(ruw: unknown, lees: (item: unknown) => T | null): T[] | null {
  if (!Array.isArray(ruw)) return null
  const uit: T[] = []
  for (const item of ruw) {
    const gelezen = lees(item)
    if (gelezen === null) return null
    uit.push(gelezen)
  }
  return uit
}

function leesMarge(ruw: unknown): BerekendeMarge | null {
  if (!isObject(ruw)) return null
  const exBtw = getalOfNull(ruw.exBtw)
  const overVoorAds = getalOfNull(ruw.overVoorAds)
  const naAds = getalOfNull(ruw.naAds)
  if (exBtw === null || overVoorAds === null || naAds === null) return null
  return { exBtw, overVoorAds, naAds }
}

function leesProduct(ruw: unknown): ProductMetMarge | null {
  if (!isObject(ruw) || !isObject(ruw.kostprijs)) return null
  const id = tekstOfNull(ruw.id)
  const naam = tekstOfNull(ruw.naam)
  const toelichting = tekstOfNull(ruw.toelichting)
  const prijsInclBtw = getalOfNull(ruw.prijsInclBtw)
  const verzendkosten = getalOfNull(ruw.verzendkosten)
  const min = getalOfNull(ruw.kostprijs.min)
  const max = getalOfNull(ruw.kostprijs.max)
  const marge = leesMarge(ruw.marge)
  if (id === null || naam === null || toelichting === null || marge === null) return null
  if (prijsInclBtw === null || verzendkosten === null || min === null || max === null) return null
  if (!isRol(ruw.rol) || !isRisico(ruw.retourRisico)) return null
  return {
    id,
    naam,
    rol: ruw.rol,
    prijsInclBtw,
    kostprijs: { min, max },
    verzendkosten,
    retourRisico: ruw.retourRisico,
    toelichting,
    marge,
  }
}

function leesArgument(ruw: unknown): Argument | null {
  if (!isObject(ruw)) return null
  const tekst = tekstOfNull(ruw.tekst)
  if (tekst === null) return null
  if (ruw.bron === null) return { tekst, bron: null }
  if (!isObject(ruw.bron)) return null
  const label = tekstOfNull(ruw.bron.label)
  const url = tekstOfNull(ruw.bron.url)
  // Alleen https: een bronlink mag nooit een `javascript:`-href worden.
  if (label === null || url === null || !url.startsWith('https://')) return null
  return { tekst, bron: { label, url } }
}

function leesLabelWaarde(ruw: unknown): LabelWaarde | null {
  if (!isObject(ruw)) return null
  const label = tekstOfNull(ruw.label)
  const waarde = tekstOfNull(ruw.waarde)
  return label === null || waarde === null ? null : { label, waarde }
}

function leesTitelTekst(ruw: unknown): TitelTekst | null {
  if (!isObject(ruw)) return null
  const titel = tekstOfNull(ruw.titel)
  const tekst = tekstOfNull(ruw.tekst)
  return titel === null || tekst === null ? null : { titel, tekst }
}

function leesFase(ruw: unknown): Fase | null {
  if (!isObject(ruw)) return null
  const naam = tekstOfNull(ruw.naam)
  const periode = tekstOfNull(ruw.periode)
  const doel = tekstOfNull(ruw.doel)
  const doorAls = tekstOfNull(ruw.doorAls)
  const herzienAls = tekstOfNull(ruw.herzienAls)
  if (naam === null || periode === null || doel === null || doorAls === null || herzienAls === null) return null
  return { naam, periode, doel, doorAls, herzienAls }
}

function leesRichting(ruw: unknown): Strategie['richting'] | null {
  if (!isObject(ruw)) return null
  const naam = tekstOfNull(ruw.naam)
  const samenvatting = tekstOfNull(ruw.samenvatting)
  const genomenOp = tekstOfNull(ruw.genomenOp)
  return naam === null || samenvatting === null || genomenOp === null ? null : { naam, samenvatting, genomenOp }
}

export function leesStrategie(ruw: unknown): Strategie | null {
  if (!isObject(ruw) || !isObject(ruw.strategie)) return null
  const s = ruw.strategie
  const bijgewerkt = tekstOfNull(s.bijgewerkt)
  const fase = tekstOfNull(s.fase)
  const richting = leesRichting(s.richting)
  const waarom = leesLijst(s.waarom, leesArgument)
  const doelgroep = leesLijst(s.doelgroep, tekstOfNull)
  const aannames = leesLijst(s.aannames, leesLabelWaarde)
  const producten = leesLijst(s.producten, leesProduct)
  const geschrapt = leesLijst(s.geschrapt, leesTitelTekst)
  const risicos = leesLijst(s.risicos, leesTitelTekst)
  const openBeslissingen = leesLijst(s.openBeslissingen, tekstOfNull)
  const volgendeStappen = leesLijst(s.volgendeStappen, tekstOfNull)
  const fasen = leesLijst(s.fasen, leesFase)
  if (bijgewerkt === null || fase === null || richting === null) return null
  if (waarom === null || doelgroep === null || aannames === null || producten === null) return null
  if (geschrapt === null || risicos === null || openBeslissingen === null || volgendeStappen === null) return null
  if (fasen === null) return null
  return {
    bijgewerkt,
    fase,
    richting,
    waarom,
    doelgroep,
    aannames,
    producten,
    geschrapt,
    risicos,
    openBeslissingen,
    volgendeStappen,
    fasen,
  }
}
