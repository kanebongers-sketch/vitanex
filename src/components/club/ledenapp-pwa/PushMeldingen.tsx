'use client'

import { useState, useSyncExternalStore } from 'react'
import { Bell, BellOff, Share, SquarePlus, X } from 'lucide-react'
import { VRAAG_WEG_SLEUTEL } from '@/lib/club/push/toestel'
import { usePush } from './usePush'
import './installeer-hulp.css'
import './push-meldingen.css'

// "Meldingen op je telefoon": web push als derde kanaal naast mail en de lijst
// in de app. Twee vormen:
//   profiel  altijd zichtbaar, met aan- en uitzetten en uitleg per toestel;
//   home     een zachte vraag na de eerste boeking, weg te klikken (onthouden).
// Toestemming vraagt de browser pas na een tik op de knop, nooit vanzelf. Zonder
// sleutel (push staat uit of is niet ingesteld) toont dit niets.

export interface PushMeldingenProps {
  /** Publieke VAPID-sleutel, of null als push niet beschikbaar is. */
  sleutel: string | null
  variant: 'profiel' | 'home'
  /** Kane kijkt mee: alles tonen, niets aanzetten. */
  voorvertoning?: boolean
}

function leesWeg(): boolean {
  try {
    return window.localStorage.getItem(VRAAG_WEG_SLEUTEL) === '1'
  } catch {
    return false
  }
}

function bewaarWeg(): void {
  try {
    window.localStorage.setItem(VRAAG_WEG_SLEUTEL, '1')
  } catch {
    // Opslag geblokkeerd: dan is de vraag alleen deze keer weg.
  }
}

const geenAbonnement = () => () => {}

export function PushMeldingen({ sleutel, variant, voorvertoning = false }: PushMeldingenProps) {
  const push = usePush(sleutel)
  const eerderWeg = useSyncExternalStore(geenAbonnement, leesWeg, () => true)
  const [weg, zetWeg] = useState(false)
  if (!sleutel || push.stand === null) return null

  if (variant === 'home') {
    const tonen = push.stand === 'kan' && !push.aan && push.toestemming === 'default' && !eerderWeg && !weg
    if (!tonen) return null
    const sluit = () => {
      bewaarWeg()
      zetWeg(true)
    }
    return (
      <aside className="club-installeer" aria-labelledby="club-push-vraag-kop">
        <span className="club-installeer-teken" aria-hidden>
          <Bell size={20} strokeWidth={1.75} />
        </span>
        <div className="club-installeer-tekst">
          <p id="club-push-vraag-kop" className="club-installeer-kop">
            Een seintje voor je les?
          </p>
          <p className="club-installeer-uitleg">Krijg een melding op je telefoon bij een bevestiging, een wijziging of als je les bijna begint.</p>
          <button type="button" className="club-installeer-knop" onClick={push.aanzetten} disabled={push.bezig || voorvertoning}>
            <Bell size={17} strokeWidth={2} aria-hidden />
            Meldingen aanzetten
          </button>
          {push.fout && (
            <p className="club-push-fout" role="alert">
              {push.fout}
            </p>
          )}
        </div>
        <button type="button" className="club-installeer-sluit" onClick={sluit} aria-label="Niet meer vragen">
          <X size={18} strokeWidth={2} aria-hidden />
        </button>
      </aside>
    )
  }

  return (
    <section className="club-push" aria-labelledby="club-push-kop">
      <div className="club-push-regel">
        <span className="club-push-teken" data-aan={push.aan} aria-hidden>
          {push.aan ? <Bell size={18} strokeWidth={1.75} /> : <BellOff size={18} strokeWidth={1.75} />}
        </span>
        <div className="club-push-tekst">
          <h3 id="club-push-kop">Meldingen op je telefoon</h3>
          <p className="club-push-status" role="status">
            {push.aan ? 'Staan aan op dit toestel.' : 'Staan uit op dit toestel.'}
          </p>
        </div>
      </div>
      <PushUitleg stand={push.stand} />
      {push.stand === 'kan' && (
        <button
          type="button"
          className={push.aan ? 'club-push-knop club-push-knop--uit' : 'club-push-knop'}
          onClick={push.aan ? push.uitzetten : push.aanzetten}
          disabled={push.bezig || voorvertoning}
          aria-busy={push.bezig}
        >
          {push.aan ? 'Meldingen uitzetten' : 'Meldingen aanzetten'}
        </button>
      )}
      {push.stand === 'geweigerd' && push.aan && (
        <button type="button" className="club-push-knop club-push-knop--uit" onClick={push.uitzetten} disabled={push.bezig || voorvertoning}>
          Meldingen uitzetten
        </button>
      )}
      {voorvertoning && <p className="club-push-noot">In de voorvertoning zet je geen meldingen aan; dat doet het lid zelf.</p>}
      {push.fout && (
        <p className="club-push-fout" role="alert">
          {push.fout}
        </p>
      )}
    </section>
  )
}

function PushUitleg({ stand }: { stand: NonNullable<ReturnType<typeof usePush>['stand']> }) {
  if (stand === 'kan') return <p className="club-push-uitleg">Een seintje bij een bevestiging, een wijziging of als je les of afspraak bijna begint. Uitzetten kan altijd.</p>
  if (stand === 'geweigerd') return <p className="club-push-uitleg">Je browser blokkeert meldingen van deze app. Sta ze toe in de instellingen van je browser of telefoon en kom dan terug.</p>
  if (stand === 'geen-ondersteuning') return <p className="club-push-uitleg">Deze browser kan geen meldingen tonen. Je ziet ze wel onder de bel in de app.</p>
  return (
    <div className="club-push-uitleg">
      <p>Op een iPhone of iPad werkt dit alleen als de app op je beginscherm staat (iOS 16.4 of nieuwer):</p>
      <ol className="club-installeer-stappen">
        <li>
          <span className="club-installeer-nr">1</span>
          <span>
            Tik in Safari op <Share size={16} strokeWidth={2} aria-hidden className="club-installeer-icoon" /> <strong>Deel</strong>
          </span>
        </li>
        <li>
          <span className="club-installeer-nr">2</span>
          <span>
            Kies <SquarePlus size={16} strokeWidth={2} aria-hidden className="club-installeer-icoon" /> <strong>Zet op beginscherm</strong>
          </span>
        </li>
        <li>
          <span className="club-installeer-nr">3</span>
          <span>Open de app vanaf je beginscherm en zet hier de meldingen aan.</span>
        </li>
      </ol>
    </div>
  )
}
