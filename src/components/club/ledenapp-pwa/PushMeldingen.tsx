'use client'

import { useState, useSyncExternalStore } from 'react'
import { Bell, BellOff, Share, SquarePlus, X } from 'lucide-react'
import { VRAAG_WEG_SLEUTEL } from '@/lib/club/push/toestel'
import { usePush } from './usePush'
import { useTaal } from '@/lib/aiyourgym/taal/client'
import { LID_INLOGGEN } from '@/lib/aiyourgym/taal/woorden/ledenapp/inloggen'
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
  /** Merkje van de sessie (pushSessieMerk): het toestel meldt zich alleen opnieuw bij een nieuw merkje. Null = nooit stil melden. */
  merk?: string | null
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

export function PushMeldingen({ sleutel, merk = null, variant, voorvertoning = false }: PushMeldingenProps) {
  const push = usePush(sleutel, voorvertoning ? null : merk)
  const eerderWeg = useSyncExternalStore(geenAbonnement, leesWeg, () => true)
  const [weg, zetWeg] = useState(false)
  const t = LID_INLOGGEN[useTaal()].pwa
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
            {t.seintje}
          </p>
          <p className="club-installeer-uitleg">{t.seintjeUitleg}</p>
          <button type="button" className="club-installeer-knop" onClick={push.aanzetten} disabled={push.bezig || voorvertoning}>
            <Bell size={17} strokeWidth={2} aria-hidden />
            {t.aanzetten}
          </button>
          {push.fout && (
            <p className="club-push-fout" role="alert">
              {push.fout}
            </p>
          )}
        </div>
        <button type="button" className="club-installeer-sluit" onClick={sluit} aria-label={t.nietMeerVragen}>
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
          <h3 id="club-push-kop">{t.kop}</h3>
          <p className="club-push-status" role="status">
            {push.aan ? t.aan : t.uit}
          </p>
        </div>
      </div>
      <PushUitleg stand={push.stand} t={t} />
      {push.stand === 'kan' && (
        <button
          type="button"
          className={push.aan ? 'club-push-knop club-push-knop--uit' : 'club-push-knop'}
          onClick={push.aan ? push.uitzetten : push.aanzetten}
          disabled={push.bezig || voorvertoning}
          aria-busy={push.bezig}
        >
          {push.aan ? t.uitzetten : t.aanzetten}
        </button>
      )}
      {push.stand === 'geweigerd' && push.aan && (
        <button type="button" className="club-push-knop club-push-knop--uit" onClick={push.uitzetten} disabled={push.bezig || voorvertoning}>
          {t.uitzetten}
        </button>
      )}
      {voorvertoning && <p className="club-push-noot">{t.voorvertoning}</p>}
      {push.fout && (
        <p className="club-push-fout" role="alert">
          {push.fout}
        </p>
      )}
    </section>
  )
}

function PushUitleg({ stand, t }: { stand: NonNullable<ReturnType<typeof usePush>['stand']>; t: (typeof LID_INLOGGEN)['nl']['pwa'] }) {
  if (stand === 'kan') return <p className="club-push-uitleg">{t.uitlegKan}</p>
  if (stand === 'geweigerd') return <p className="club-push-uitleg">{t.uitlegGeweigerd}</p>
  if (stand === 'geen-ondersteuning') return <p className="club-push-uitleg">{t.uitlegGeen}</p>
  return (
    <div className="club-push-uitleg">
      <p>{t.uitlegIos}</p>
      <ol className="club-installeer-stappen">
        <li>
          <span className="club-installeer-nr">1</span>
          <span>
            {t.tikSafari} <Share size={16} strokeWidth={2} aria-hidden className="club-installeer-icoon" /> <strong>{t.deel}</strong>
          </span>
        </li>
        <li>
          <span className="club-installeer-nr">2</span>
          <span>
            {t.kies} <SquarePlus size={16} strokeWidth={2} aria-hidden className="club-installeer-icoon" /> <strong>{t.zetOp}</strong>
          </span>
        </li>
        <li>
          <span className="club-installeer-nr">3</span>
          <span>{t.openBeginscherm}</span>
        </li>
      </ol>
    </div>
  )
}
