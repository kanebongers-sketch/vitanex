'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import { Download, Share, Smartphone, SquarePlus, X } from 'lucide-react'
import { WEG_SLEUTEL, installeerOmgeving, type InstalleerOmgeving } from '@/lib/club/ledenapp-pwa/installeren'
import './installeer-hulp.css'

// "Zet de app op je beginscherm". Android en Chrome: een knop die de eigen
// installeervraag van de browser opent. iPhone en iPad: twee stappen via de
// deelknop. Draait de app al vanaf het beginscherm, of heeft het lid de hulp
// weggeklikt (onthouden in localStorage), dan niets. Kleuren uit de club-
// variabelen (--brand, --brand-inkt, --brand-tekst), dus in de huisstijl van
// de sportschool en goed in donker en licht thema.

interface InstallatieVraag extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export interface InstalleerHulpProps {
  /** De naam van de sportschool, voor de uitleg ("Open Fit Factory met een tik"). */
  naam?: string
}

const STANDALONE = '(display-mode: standalone)'

function leesWeg(): boolean {
  try {
    return window.localStorage.getItem(WEG_SLEUTEL) === '1'
  } catch {
    return false
  }
}

function bewaarWeg(): void {
  try {
    window.localStorage.setItem(WEG_SLEUTEL, '1')
  } catch {
    // Privevenster of opslag geblokkeerd: dan is hij alleen deze keer weg.
  }
}

function leesOmgeving(): InstalleerOmgeving | 'weg' {
  if (leesWeg()) return 'weg'
  const nav = window.navigator as Navigator & { standalone?: boolean }
  return installeerOmgeving({
    userAgent: nav.userAgent,
    platform: nav.platform,
    maxTouchPoints: nav.maxTouchPoints,
    standalone: window.matchMedia(STANDALONE).matches || nav.standalone === true,
  })
}

function abonneer(melden: () => void): () => void {
  const media = window.matchMedia(STANDALONE)
  media.addEventListener('change', melden)
  return () => media.removeEventListener('change', melden)
}

/** De installeervraag van Android en Chrome, als de browser hem aanbiedt. */
function useInstallatieVraag(): [InstallatieVraag | null, () => void] {
  const [vraag, zetVraag] = useState<InstallatieVraag | null>(null)
  useEffect(() => {
    const opVraag = (e: Event) => {
      e.preventDefault()
      zetVraag(e as InstallatieVraag)
    }
    const opGeinstalleerd = () => zetVraag(null)
    window.addEventListener('beforeinstallprompt', opVraag)
    window.addEventListener('appinstalled', opGeinstalleerd)
    return () => {
      window.removeEventListener('beforeinstallprompt', opVraag)
      window.removeEventListener('appinstalled', opGeinstalleerd)
    }
  }, [])
  return [vraag, () => zetVraag(null)]
}

export function InstalleerHulp({ naam }: InstalleerHulpProps) {
  const omgeving = useSyncExternalStore(abonneer, leesOmgeving, () => null)
  const [vraag, vergeetVraag] = useInstallatieVraag()
  const [weg, zetWeg] = useState(false)

  if (weg || omgeving === null || omgeving === 'standalone' || omgeving === 'weg') return null
  if (omgeving !== 'ios' && !vraag) return null

  const sluit = () => {
    bewaarWeg()
    zetWeg(true)
  }

  const installeer = async () => {
    if (!vraag) return
    try {
      await vraag.prompt()
      const keuze = await vraag.userChoice
      if (keuze.outcome === 'accepted') zetWeg(true)
    } catch (fout) {
      console.error('[club-app] installeervraag mislukt', fout instanceof Error ? fout.message : fout)
    } finally {
      // Een installeervraag werkt maar een keer.
      vergeetVraag()
    }
  }

  const app = naam?.trim() || 'de app'

  return (
    <aside className="club-installeer" aria-labelledby="club-installeer-kop">
      <span className="club-installeer-teken" aria-hidden>
        <Smartphone size={20} strokeWidth={1.75} />
      </span>
      <div className="club-installeer-tekst">
        <p id="club-installeer-kop" className="club-installeer-kop">
          Zet de app op je beginscherm
        </p>
        {omgeving === 'ios' ? (
          <ol className="club-installeer-stappen">
            <li>
              <span className="club-installeer-nr">1</span>
              <span>
                Tik op <Share size={16} strokeWidth={2} aria-hidden className="club-installeer-icoon" /> <strong>Deel</strong>
              </span>
            </li>
            <li>
              <span className="club-installeer-nr">2</span>
              <span>
                Kies <SquarePlus size={16} strokeWidth={2} aria-hidden className="club-installeer-icoon" /> <strong>Zet op beginscherm</strong>
              </span>
            </li>
          </ol>
        ) : (
          <>
            <p className="club-installeer-uitleg">Open {app} met een tik, net als een gewone app.</p>
            <button type="button" className="club-installeer-knop" onClick={installeer}>
              <Download size={17} strokeWidth={2} aria-hidden />
              Zet op je beginscherm
            </button>
          </>
        )}
      </div>
      <button type="button" className="club-installeer-sluit" onClick={sluit} aria-label="Niet meer tonen">
        <X size={18} strokeWidth={2} aria-hidden />
      </button>
    </aside>
  )
}
