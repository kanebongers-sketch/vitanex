'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, X } from 'lucide-react'
import type { AiFuncties } from '@/lib/club/voeding/dagboek/ai/schakelaar'
import { productVanEigen, type Bron, type EigenProduct, type Favoriet, type Maaltijd, type Product } from '@/lib/club/voeding/dagboek/model'
import type { VoedingDagboekTekst } from '@/lib/aiyourgym/taal/woorden/club/voeding-dagboek'
import { AiPaneel, type AiBron, type AiRegel } from './AiPaneel'
import { EigenProductFormulier, HandmatigFormulier, type HandmatigeInvoer } from './Formulieren'
import { PortieStap, type PortieKeuze } from './PortieStap'
import { ProductRij } from './ProductRij'
import { ZoekPaneel } from './ZoekPaneel'

// Het blad om iets toe te voegen aan een maaltijd. Eerst Snel (recent en
// favorieten, met een plus om in een tik toe te voegen), dan zoeken, scannen,
// eigen producten en zelf invullen. Het tabblad Foto (foto of omschrijving,
// met een voorstel dat het lid bevestigt) alleen als de betaalde AI aan staat;
// anders zie je het niet.

type Tab = 'snel' | 'zoeken' | 'scannen' | 'eigen' | 'handmatig' | 'foto'

export interface ToevoegActies {
  logProduct: (p: Product, keuze: PortieKeuze, bron: Bron) => Promise<boolean>
  logHandmatig: (invoer: HandmatigeInvoer) => Promise<boolean>
  logAi: (regels: AiRegel[], bron: AiBron) => Promise<boolean>
  /** Toestemming voor de AI-schatting geven of intrekken; true als het is opgeslagen. */
  aiToestemming: (aan: boolean) => Promise<boolean>
  wisselFavoriet: (p: Product) => void
  nieuwEigen: (p: EigenProduct) => void
  verwijderEigen: (id: string) => void
}

interface Props {
  maaltijd: Maaltijd
  t: VoedingDagboekTekst
  voor: string | null
  recent: readonly Product[]
  favorieten: readonly Favoriet[]
  eigen: readonly EigenProduct[]
  ai: AiFuncties
  aiToestemmingOp: string | null
  bezig: boolean
  fout: string | null
  acties: ToevoegActies
  onSluit: () => void
}

export function ToevoegBlad({ maaltijd, t, voor, recent, favorieten, eigen, ai, aiToestemmingOp, bezig, fout, acties, onSluit }: Props) {
  const tz = t.toevoegen
  const [tab, setTab] = useState<Tab>(recent.length + favorieten.length > 0 ? 'snel' : 'zoeken')
  const [gekozen, setGekozen] = useState<{ product: Product; bron: Bron } | null>(null)
  const [nieuwBarcode, setNieuwBarcode] = useState<string | null | false>(false)
  const blad = useRef<HTMLDivElement>(null)
  const favorietSleutels = new Set(favorieten.map((f) => f.product.sleutel))
  const naam = t.maaltijd[maaltijd]

  useEffect(() => {
    const toets = (e: KeyboardEvent) => { if (e.key === 'Escape') onSluit() }
    window.addEventListener('keydown', toets)
    blad.current?.focus()
    return () => window.removeEventListener('keydown', toets)
  }, [onSluit])

  const tabs: Tab[] = ['snel', 'zoeken', 'scannen', 'eigen', 'handmatig', ...(ai.foto ? (['foto'] as const) : [])]
  const kies = (product: Product, bron: Bron) => setGekozen({ product, bron })
  const snel = (product: Product, bron: Bron) => void acties.logProduct(product, { gram: product.portieGram ?? 100, maat: null, aantal: null }, bron)

  let inhoud
  if (gekozen) {
    inhoud = (
      <PortieStap
        product={gekozen.product}
        t={t}
        bezig={bezig}
        favoriet={gekozen.product.sleutel ? favorietSleutels.has(gekozen.product.sleutel) : null}
        onFavoriet={() => acties.wisselFavoriet(gekozen.product)}
        onToevoegen={(keuze) => void acties.logProduct(gekozen.product, keuze, gekozen.bron)}
      />
    )
  } else if (nieuwBarcode !== false) {
    inhoud = <EigenProductFormulier t={t} voor={voor} barcode={nieuwBarcode} onKlaar={(p) => { acties.nieuwEigen(p); setNieuwBarcode(false); kies(productVanEigen(p), 'eigen') }} />
  } else if (tab === 'snel') {
    inhoud = (
      <div className="club-vd-paneel">
        {recent.length + favorieten.length === 0 && <p className="club-vd-hint">{tz.snelLeeg}</p>}
        {favorieten.length > 0 && (
          <section aria-label={tz.favorieten}>
            <span className="club-lidapp-label">{tz.favorieten}</span>
            <ul className="club-vd-lijst">
              {favorieten.map((f) => (
                <li key={f.id}><ProductRij product={f.product} t={t} onKies={() => kies(f.product, f.product.sleutel?.startsWith('eigen:') ? 'eigen' : 'zoeken')} onSnel={() => snel(f.product, f.product.sleutel?.startsWith('eigen:') ? 'eigen' : 'zoeken')} extra={f.product.portieGram ? t.portie.gram(f.product.portieGram) : null} /></li>
              ))}
            </ul>
          </section>
        )}
        {recent.length > 0 && (
          <section aria-label={tz.recent}>
            <span className="club-lidapp-label">{tz.recent}</span>
            <ul className="club-vd-lijst">
              {recent.map((p) => (
                <li key={p.sleutel ?? p.naam}><ProductRij product={p} t={t} onKies={() => kies(p, p.sleutel?.startsWith('eigen:') ? 'eigen' : 'zoeken')} onSnel={() => snel(p, p.sleutel?.startsWith('eigen:') ? 'eigen' : 'zoeken')} extra={p.portieGram ? t.portie.gram(p.portieGram) : null} /></li>
              ))}
            </ul>
          </section>
        )}
      </div>
    )
  } else if (tab === 'zoeken' || tab === 'scannen') {
    inhoud = <ZoekPaneel key={tab} t={t} voor={voor} modus={tab} onKies={(p) => kies(p, tab === 'scannen' ? 'barcode' : 'zoeken')} onEigen={(code) => setNieuwBarcode(code)} />
  } else if (tab === 'eigen') {
    inhoud = (
      <div className="club-vd-paneel">
        {eigen.length === 0 && <p className="club-vd-hint">{tz.eigenLeeg}</p>}
        <ul className="club-vd-lijst">
          {eigen.map((p) => (
            <li key={p.id} className="club-vd-eigen">
              <ProductRij product={productVanEigen(p)} t={t} onKies={() => kies(productVanEigen(p), 'eigen')} />
              <button type="button" className="club-vd-x" onClick={() => acties.verwijderEigen(p.id)} aria-label={tz.eigenWeghalen(p.naam)}><X size={16} aria-hidden /></button>
            </li>
          ))}
        </ul>
        <button type="button" className="club-lidapp-knop" onClick={() => setNieuwBarcode(null)}>{tz.eigenNieuw}</button>
      </div>
    )
  } else if (tab === 'handmatig') {
    inhoud = <HandmatigFormulier t={t} bezig={bezig} fout={null} onToevoegen={(i) => void acties.logHandmatig(i)} />
  } else {
    inhoud = <AiPaneel t={t} voor={voor} bezig={bezig} toestemmingOp={aiToestemmingOp} onToestemming={acties.aiToestemming} onOpslaan={(r, bron) => void acties.logAi(r, bron)} />
  }

  const terug = gekozen !== null || nieuwBarcode !== false
  return (
    <div className="club-vd-laag" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) onSluit() }}>
      <div ref={blad} className="club-vd-blad" role="dialog" aria-modal="true" aria-labelledby="vd-blad-kop" tabIndex={-1}>
        <header className="club-vd-blad-kop">
          {terug ? (
            <button type="button" className="club-vd-x" onClick={() => { setGekozen(null); setNieuwBarcode(false) }} aria-label={tz.terug}><ArrowLeft size={20} aria-hidden /></button>
          ) : <span aria-hidden />}
          <h3 id="vd-blad-kop">{nieuwBarcode !== false ? t.eigenProduct.titel : tz.titel(naam)}</h3>
          <button type="button" className="club-vd-x" onClick={onSluit} aria-label={tz.sluiten}><X size={20} aria-hidden /></button>
        </header>
        {!terug && (
          <nav className="club-vd-tabs" aria-label={tz.titel(naam)}>
            {tabs.map((id) => (
              <button key={id} type="button" className={`club-vd-tab${tab === id ? ' is-aan' : ''}`} aria-pressed={tab === id} onClick={() => setTab(id)}>
                {tz.tabs[id]}
              </button>
            ))}
          </nav>
        )}
        {fout && <p className="club-vd-fout" role="alert">{fout}</p>}
        {inhoud}
      </div>
    </div>
  )
}
