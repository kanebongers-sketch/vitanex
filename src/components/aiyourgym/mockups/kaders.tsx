import type { CSSProperties, ReactNode } from 'react'
import { CalendarClock, CalendarDays, Dumbbell, House, Lock, Salad, TrendingUp, UserRound } from 'lucide-react'

// Kaders voor de productbeelden: een browservenster en een telefoon. De inhoud
// is een tekening van onze eigen schermen in HTML en CSS; voor schermlezers is
// het een afbeelding met een beschrijving (role="img").

export const VOORBEELD_ADRES = 'aiyourgym.com/voorbeeldgym'
export const VOORBEELD_NAAM = 'Voorbeeld Gym'

interface FiguurProps {
  label: string
  children: ReactNode
  bijschrift?: ReactNode
  className?: string
  stijl?: CSSProperties
}

/** Een productbeeld met eerlijk bijschrift: het zijn voorbeeldgegevens. */
export function Figuur({ label, children, bijschrift, className, stijl }: FiguurProps) {
  return (
    <figure className={className ? `aygm-figuur ${className}` : 'aygm-figuur'} style={stijl}>
      <div role="img" aria-label={label} className="aygm">
        {children}
      </div>
      <figcaption className="aygm-bijschrift">
        <span>Schermvoorbeeld met voorbeeldgegevens</span>
        {bijschrift}
      </figcaption>
    </figure>
  )
}

const GROEPEN = ['Werkvloer', 'Leden', 'Planning', 'Coaching', 'Beheer'] as const
export type Groep = (typeof GROEPEN)[number]

interface VensterProps {
  actief: Groep
  children: ReactNode
}

/** Club in een browservenster, met het eigen adres van de sportschool. */
export function Venster({ actief, children }: VensterProps) {
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
          {GROEPEN.map((g) => (
            <span key={g} data-actief={g === actief ? '' : undefined}>
              {g}
            </span>
          ))}
        </span>
      </div>
      <div className="aygm-app-inhoud">{children}</div>
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
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
