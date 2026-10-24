import { ArrowRight, Check, Clock3, LifeBuoy, Lock, Save, Sparkles } from 'lucide-react'
import { AANTAL_STAPPEN, STAPPEN } from '@/lib/club/start/stappen'
import { getSiteTaal } from '@/lib/aiyourgym/taal/server'
import { WIZARD } from '@/lib/aiyourgym/taal/woorden/website/mockups/schermen'
import { VOORBEELD_ADRES, VOORBEELD_NAAM } from './voorbeeld'

// De startwizard zoals een nieuwe sportschool hem ziet: de eigen balk (alleen
// de wizard en Hulp, de rest van Club is nog dicht), de kop met de teller en de
// tijd, een segment per stap, de regel "Alvast ingevuld" en de stap Lessen met
// de invoer er direct in. Stappen en minuten komen uit Club zelf, de teksten in
// de taal van de pagina (woordenboek WIZARD, stappen in de volgorde van STAPPEN).
// Voorbeeldgegevens: de Voorbeeld Gym halverwege, bij stap 5.

const HIER = 5
const LESTYPEN = ['Spinning', 'Bodypump', 'Yoga', 'HIIT'] as const
/** De vaste week; dag is de index in t.dagen. */
const WEEK = [
  { dag: 0, les: 'Spinning', tijd: '19:00', zaal: 1 },
  { dag: 1, les: 'Yoga', tijd: '09:30', zaal: 2 },
  { dag: 2, les: 'Bodypump', tijd: '19:30', zaal: 1 },
  { dag: 3, les: 'HIIT', tijd: '18:30', zaal: 1 },
] as const

type Teksten = (typeof WIZARD)['nl']

/** "Nog ongeveer 7 minuten", zoals minutenTekst in Club. */
function minutenTekst(minuten: number, t: Teksten): string {
  if (minuten <= 0) return t.alles
  if (minuten === 1) return t.nogMinuut
  return t.nogMinuten(minuten)
}

export async function WizardScherm() {
  const t = WIZARD[await getSiteTaal()]
  const stap = t.stappen[HIER - 1] ?? STAPPEN[HIER - 1]
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
            <Sparkles aria-hidden /> {t.startwizard}
          </span>
          <span>
            <LifeBuoy aria-hidden /> {t.hulp}
          </span>
        </span>
      </div>
      <div className="aygm-app-inhoud aygm-wiz">
        <div className="aygm-wiz-kop">
          <div>
            <p className="aygm-boven">{t.stapVan(HIER, AANTAL_STAPPEN)}</p>
            <p className="aygm-wiz-titel">{stap.titel}</p>
            <p className="aygm-wiz-intro">{stap.kort}</p>
          </div>
          <div className="aygm-wiz-stand">
            <p>
              <b className="aygm-getal">{HIER - 1}</b>
              {t.afNa(AANTAL_STAPPEN)}
            </p>
            <p className="aygm-wiz-tijd">
              <Clock3 aria-hidden /> {minutenTekst(over, t)}
            </p>
          </div>
        </div>
        <ol className="aygm-wiz-stappen">
          {STAPPEN.map((s, i) => {
            const nr = i + 1
            return (
              <li key={s.sleutel} data-af={nr < HIER ? '' : undefined} data-hier={nr === HIER ? '' : undefined}>
                <span className="aygm-wiz-bol">{nr < HIER ? <Check aria-hidden /> : nr}</span>
                <span className="aygm-wiz-naam">{t.stappen[i]?.titel ?? s.titel}</span>
              </li>
            )
          })}
        </ol>
        <p className="aygm-wiz-alvast">
          <Sparkles aria-hidden /> {t.alvast(t.soortGym)}
        </p>
        <div className="aygm-kaart aygm-wiz-invoer">
          <p className="aygm-boven">{t.lestypen}</p>
          <span className="aygm-wiz-chips">
            {LESTYPEN.map((l) => (
              <span key={l} className="aygm-chip aygm-chip--accent">
                <Check aria-hidden /> {l}
              </span>
            ))}
          </span>
          <p className="aygm-boven">{t.vasteWeek}</p>
          <div className="aygm-wiz-week">
            {WEEK.map((w) => (
              <span key={w.dag}>
                <b>{t.dagen[w.dag]}</b>
                <i>{w.tijd}</i>
                {w.les}
                <i>{t.zaal(w.zaal)}</i>
              </span>
            ))}
          </div>
        </div>
        <div className="aygm-wiz-voet">
          <span className="aygm-wiz-voet-links">
            <span className="aygm-knopje aygm-knopje--rand">{t.vorige}</span>
            <span className="aygm-knopje aygm-knopje--rand">
              <Save aria-hidden size={12} /> {t.opslaan}
            </span>
          </span>
          <span className="aygm-knopje">
            {t.verder} <ArrowRight aria-hidden size={12} />
          </span>
        </div>
      </div>
    </div>
  )
}
