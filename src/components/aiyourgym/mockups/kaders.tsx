'use client'

import type { CSSProperties, ReactNode } from 'react'
import { CalendarDays, CircleHelp, Dumbbell, House, Lock, Salad, Search, UserRound } from 'lucide-react'
import { PLEKKEN, schermenVan } from '@/components/club/shell/onderdelen'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { KADERS } from '@/lib/aiyourgym/taal/woorden/website/mockups/kaders'
import { KernhalMerk } from './KernhalMerk'
import { VOORBEELD_ADRES } from './voorbeeld'

// Kaders voor de productbeelden: een browservenster en een telefoon. De inhoud
// is een tekening van onze eigen schermen in HTML en CSS; voor schermlezers is
// het een afbeelding met een beschrijving (role="img").
// Een clientcomponent, omdat de kaders ook in clientcomponenten staan (zoals de
// coachingdemo); de taal komt uit de context van de pagina (woordenboek KADERS).
// Plekken, schermen en tabbladen worden doorgegeven met hun Nederlandse naam
// uit Club en in de taal van de pagina getoond.


interface FiguurProps {
  label: string
  children: ReactNode
  bijschrift?: ReactNode
  className?: string
  stijl?: CSSProperties
}

/** Een productbeeld met eerlijk bijschrift: het zijn voorbeeldgegevens. */
export function Figuur({ label, children, bijschrift, className, stijl }: FiguurProps) {
  const t = useTekst(KADERS)
  return (
    <figure className={className ? `aygm-figuur ${className}` : 'aygm-figuur'} style={stijl}>
      <div role="img" aria-label={label} className="aygm">
        {children}
      </div>
      <figcaption className="aygm-bijschrift">
        <span>{t.bijschrift}</span>
        {bijschrift}
      </figcaption>
    </figure>
  )
}

// De plekken en het submenu komen uit Club zelf, zodat het productbeeld altijd
// het echte menu laat zien: vijf plekken bovenin, de schermen van de plek
// eronder. Er is geen hulpbalk meer; zoeken en Hulp staan rechts in de kop.
export type Plek = (typeof PLEKKEN)[number]['label']

type Teksten = (typeof KADERS)['nl']

/** Een scherm van het menu in de taal van de pagina, met de naam uit Club als reserve. */
function schermNaam(t: Teksten, sleutel: string, label: string): string {
  const namen: Readonly<Record<string, string | undefined>> = t.onderdelen
  return namen[sleutel] ?? label
}

/** Rij 2 van Club: de plek waar je bent en haar schermen over de volle breedte, het actieve gevuld. */
function Submenu({ plek, hier, t }: { plek: Plek; hier?: string; t: Teksten }) {
  const p = PLEKKEN.find((x) => x.label === plek)
  if (!p) return null
  const items = schermenVan(p.sleutel)
  const actief = hier ?? items[0]?.label
  return (
    <div className="aygm-app-sub">
      <span className="aygm-app-sub-groep">{t.plekken[p.sleutel]}</span>
      {items.map((o) => (
        <span key={o.sleutel} data-actief={o.label === actief ? '' : undefined}>
          {schermNaam(t, o.sleutel, o.label)}
        </span>
      ))}
    </div>
  )
}

/** Rechts in de kop van Club: zoeken (Ctrl K) en het vraagteken voor Hulp. */
function KopRechts({ t }: { t: Teksten }) {
  return (
    <span className="aygm-app-kop-rechts">
      <span className="aygm-app-zoek">
        <Search aria-hidden />
        {t.zoeken}
        <kbd>Ctrl K</kbd>
      </span>
      <span className="aygm-app-hulp" title={t.hulp}>
        <CircleHelp aria-hidden />
      </span>
    </span>
  )
}

interface VensterProps {
  /** De plek waar je bent (Nederlandse naam: Vandaag, Leden, Rooster, Training of Beheer). */
  actief: Plek
  /** Het scherm waar je bent (Nederlandse naam uit het menu); standaard het eerste van de plek. */
  hier?: string
  children: ReactNode
}

/** Club in een browservenster, met het eigen adres van de sportschool. */
export function Venster({ actief, hier, children }: VensterProps) {
  const t = useTekst(KADERS)
  return (
    <div className="aygm-venster">
      <div className="aygm-venster-balk">
        <div className="aygm-stippen">
          <i />
          <i />
          <i />
        </div>
        <div className="aygm-adres">
          <Lock size={10} aria-hidden />
          {VOORBEELD_ADRES}
        </div>
      </div>
      <div className="aygm-app-kop">
        <KernhalMerk className="aygm-app-merk" />
        <span className="aygm-app-groepen">
          {PLEKKEN.map((p) => (
            <span key={p.sleutel} data-actief={p.label === actief ? '' : undefined}>
              {t.plekken[p.sleutel]}
            </span>
          ))}
        </span>
        <KopRechts t={t} />
      </div>
      <Submenu plek={actief} hier={hier} t={t} />
      <div className="aygm-app-inhoud">{children}</div>
    </div>
  )
}

// De vijf tabbladen van de onderbalk van de ledenapp (src/lib/club/app/tabs.ts):
// Boeken is lessen plus afspraken, Schema is het schema plus de voortgang.
const TABS = [
  { label: 'Home', Icoon: House },
  { label: 'Boeken', Icoon: CalendarDays },
  { label: 'Schema', Icoon: Dumbbell },
  { label: 'Voeding', Icoon: Salad },
  { label: 'Profiel', Icoon: UserRound },
] as const
export type AppTab = (typeof TABS)[number]['label']

interface ToestelProps {
  tab: AppTab
  children: ReactNode
  stijl?: CSSProperties
  className?: string
}

/** De ledenapp op een telefoon, met de tabbladen zoals in Club. */
export function Toestel({ tab, children, stijl, className }: ToestelProps) {
  const t = useTekst(KADERS)
  return (
    <div className={className ? `aygm-toestel ${className}` : 'aygm-toestel'} style={stijl}>
      <div className="aygm-scherm">
        <div className="aygm-status">
          <span>9:41</span>
          <span className="aygm-eiland" />
          <span>5G</span>
        </div>
        <div className="aygm-scherm-inhoud">
          <KernhalMerk className="aygm-scherm-merk" />
          {children}
        </div>
        <div className="aygm-tabs">
          {TABS.map(({ label, Icoon }) => (
            <span key={label} data-actief={label === tab ? '' : undefined}>
              <Icoon aria-hidden />
              {t.tabs[label]}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
