import { ArrowRight, Check, Clock3, LifeBuoy, Lock, Save, Sparkles } from 'lucide-react'
import { AANTAL_STAPPEN, STAPPEN, minutenTekst } from '@/lib/club/start/stappen'
import { SOORT_INFO } from '@/lib/club/start/soorten'
import { VOORBEELD_ADRES, VOORBEELD_NAAM } from './kaders'

// De startwizard zoals een nieuwe sportschool hem ziet: de eigen balk (alleen
// de wizard en Hulp, de rest van Club is nog dicht), de kop met de teller en de
// tijd, een segment per stap, de regel "Alvast ingevuld" en de stap Lessen met
// de invoer er direct in. Stappen, titels en teksten komen uit Club zelf.
// Voorbeeldgegevens: de Voorbeeld Gym halverwege, bij stap 5.

const HIER = 5
const LESTYPEN = ['Spinning', 'Bodypump', 'Yoga', 'HIIT'] as const
const WEEK = [
  { dag: 'Ma', les: 'Spinning', tijd: '19:00', zaal: 'Zaal 1' },
  { dag: 'Di', les: 'Yoga', tijd: '09:30', zaal: 'Zaal 2' },
  { dag: 'Wo', les: 'Bodypump', tijd: '19:30', zaal: 'Zaal 1' },
  { dag: 'Do', les: 'HIIT', tijd: '18:30', zaal: 'Zaal 1' },
] as const

export function WizardScherm() {
  const stap = STAPPEN[HIER - 1]
  const over = STAPPEN.slice(HIER - 1).reduce((som, s) => som + s.minuten, 0)
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
          {VOORBEELD_ADRES}/club/start
        </div>
      </div>
      <div className="aygm-app-kop aygm-wiz-balk">
        <span className="aygm-app-merk">
          <i />
          {VOORBEELD_NAAM}
        </span>
        <span className="aygm-wiz-links">
          <span>
            <Sparkles aria-hidden /> Startwizard
          </span>
          <span>
            <LifeBuoy aria-hidden /> Hulp
          </span>
        </span>
      </div>
      <div className="aygm-app-inhoud aygm-wiz">
        <div className="aygm-wiz-kop">
          <div>
            <p className="aygm-boven">
              Startwizard · stap {HIER} van {AANTAL_STAPPEN}
            </p>
            <p className="aygm-wiz-titel">{stap.titel}</p>
            <p className="aygm-wiz-intro">{stap.kort}</p>
          </div>
          <div className="aygm-wiz-stand">
            <p>
              <b className="aygm-getal">{HIER - 1}</b> van {AANTAL_STAPPEN} af
            </p>
            <p className="aygm-wiz-tijd">
              <Clock3 aria-hidden /> {minutenTekst(over)}
            </p>
          </div>
        </div>
        <ol className="aygm-wiz-stappen">
          {STAPPEN.map((s, i) => {
            const nr = i + 1
            return (
              <li key={s.sleutel} data-af={nr < HIER ? '' : undefined} data-hier={nr === HIER ? '' : undefined}>
                <span className="aygm-wiz-bol">{nr < HIER ? <Check aria-hidden /> : nr}</span>
                <span className="aygm-wiz-naam">{s.titel}</span>
              </li>
            )
          })}
        </ol>
        <p className="aygm-wiz-alvast">
          <Sparkles aria-hidden /> Alvast ingevuld voor een {SOORT_INFO.gym.titel.toLowerCase()}, pas aan wat niet klopt.
        </p>
        <div className="aygm-kaart aygm-wiz-invoer">
          <p className="aygm-boven">Lestypen</p>
          <span className="aygm-wiz-chips">
            {LESTYPEN.map((l) => (
              <span key={l} className="aygm-chip aygm-chip--accent">
                <Check aria-hidden /> {l}
              </span>
            ))}
          </span>
          <p className="aygm-boven">Je vaste week</p>
          <div className="aygm-wiz-week">
            {WEEK.map((w) => (
              <span key={w.dag}>
                <b>{w.dag}</b>
                <i>{w.tijd}</i>
                {w.les}
                <i>{w.zaal}</i>
              </span>
            ))}
          </div>
        </div>
        <div className="aygm-wiz-voet">
          <span className="aygm-wiz-voet-links">
            <span className="aygm-knopje aygm-knopje--rand">Vorige</span>
            <span className="aygm-knopje aygm-knopje--rand">
              <Save aria-hidden size={12} /> Opslaan en stoppen
            </span>
          </span>
          <span className="aygm-knopje">
            Klaar, verder <ArrowRight aria-hidden size={12} />
          </span>
        </div>
      </div>
    </div>
  )
}
