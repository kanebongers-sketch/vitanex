'use client'

import type { CSSProperties, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { CalendarClock, CalendarDays, Dumbbell, House, LifeBuoy, Lock, Plug, Salad, Settings2, Smartphone, Sparkles, TrendingUp, UserRound } from 'lucide-react'
import { GROEPEN as CLUB_GROEPEN, onderdelenVan } from '@/components/club/shell/onderdelen'
import { HULPBALK, type HulpSleutel } from '@/components/club/shell/hulpbalk-items'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { KADERS } from '@/lib/aiyourgym/taal/woorden/website/mockups/kaders'
import { VOORBEELD_ADRES, VOORBEELD_NAAM } from './voorbeeld'

// Kaders voor de productbeelden: een browservenster en een telefoon. De inhoud
// is een tekening van onze eigen schermen in HTML en CSS; voor schermlezers is
// het een afbeelding met een beschrijving (role="img").
// Een clientcomponent, omdat de kaders ook in clientcomponenten staan (zoals de
// coachingdemo); de taal komt uit de context van de pagina (woordenboek KADERS).
// Groepen, onderdelen en tabbladen worden doorgegeven met hun Nederlandse naam
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

// De groepen, het submenu en de hulpbalk komen uit Club zelf, zodat het
// productbeeld altijd het echte menu laat zien.
export type Groep = (typeof CLUB_GROEPEN)[number]['label']

type Teksten = (typeof KADERS)['nl']

const HULP_ICOON: Record<HulpSleutel, LucideIcon> = {
  instellingen: Settings2,
  koppelingen: Plug,
  ledenapp: Smartphone,
  nieuw: Sparkles,
  hulp: LifeBuoy,
}

/** Een onderdeel van het menu in de taal van de pagina, met de naam uit Club als reserve. */
function onderdeelNaam(t: Teksten, sleutel: string, label: string): string {
  const namen: Readonly<Record<string, string | undefined>> = t.onderdelen
  return namen[sleutel] ?? label
}

/** Rij 2 van Club: de groep waar je bent en haar onderdelen over de volle breedte, het actieve gevuld. */
function Submenu({ groep, hier, t }: { groep: Groep; hier?: string; t: Teksten }) {
  const g = CLUB_GROEPEN.find((x) => x.label === groep)
  if (!g) return null
  const items = onderdelenVan(g.sleutel)
  const actief = hier ?? items[0]?.label
  return (
    <div className="aygm-app-sub">
      <span className="aygm-app-sub-groep">{t.groepen[g.sleutel]}</span>
      {items.map((o) => (
        <span key={o.sleutel} data-actief={o.label === actief ? '' : undefined}>
          {onderdeelNaam(t, o.sleutel, o.label)}
        </span>
      ))}
    </div>
  )
}

/** De hulpbalk onderaan elke pagina van Club. */
function Hulpbalk({ t }: { t: Teksten }) {
  return (
    <div className="aygm-hulpbalk">
      {HULPBALK.map((i) => {
        const Icoon = HULP_ICOON[i.sleutel]
        return (
          <span key={i.sleutel}>
            <Icoon aria-hidden />
            {t.hulpbalk[i.sleutel]}
          </span>
        )
      })}
    </div>
  )
}

interface VensterProps {
  actief: Groep
  /** Het onderdeel waar je bent (Nederlandse naam uit het menu); standaard het eerste van de groep. */
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
        <span className="aygm-app-merk">
          <i />
          {VOORBEELD_NAAM}
        </span>
        <span className="aygm-app-groepen">
          {CLUB_GROEPEN.map((g) => (
            <span key={g.sleutel} data-actief={g.label === actief ? '' : undefined}>
              {t.groepen[g.sleutel]}
            </span>
          ))}
        </span>
      </div>
      <Submenu groep={actief} hier={hier} t={t} />
      <div className="aygm-app-inhoud">{children}</div>
      <Hulpbalk t={t} />
    </div>
  )
}

const TABS = [
  { label: 'Home', Icoon: House },
  { label: 'Lessen', Icoon: CalendarDays },
  { label: 'Afspraken', Icoon: CalendarClock },
  { label: 'Schema', Icoon: Dumbbell },
  { label: 'Voeding', Icoon: Salad },
  { label: 'Voortgang', Icoon: TrendingUp },
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
          <span className="aygm-scherm-merk">
            <i />
            {VOORBEELD_NAAM}
          </span>
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
