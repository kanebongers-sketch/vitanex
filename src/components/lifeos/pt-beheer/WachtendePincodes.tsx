'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { KeyRound } from 'lucide-react'
import type { WachtendePin } from '@/lib/lifeos/leads/links'
import type { PinActie } from '@/lib/lifeos/leads/leads'
import { clubsLabel } from '@/lib/lifeos/pt-dashboard/clubs'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { pinActie } from '@/components/lifeos/pt/PinGoedkeuren'

// Bovenaan Kane's Team-scherm: wie een pincode koos die op goedkeuring wacht
// (PT'ers, clubmanagers, eigenaren). Keur alleen goed als diegene je dezelfde
// controlecode noemt — anders koos iemand anders de pin op zijn (openbare) link.

const ROL: Record<WachtendePin['rol'], string> = { pt: "PT'er", clubmanager: 'clubmanager', eigenaar: 'eigenaar' }

export function WachtendePincodes({ pins }: { pins: readonly WachtendePin[] }) {
  const router = useRouter()
  const [bezig, setBezig] = useState<string | null>(null)
  const [fout, setFout] = useState<string | null>(null)
  if (pins.length === 0) return null

  async function doe(p: WachtendePin, actie: PinActie) {
    setBezig(p.persoonId)
    setFout(null)
    const f = await pinActie(p.persoonId, actie)
    setBezig(null)
    if (f) setFout(f)
    else router.refresh()
  }

  return (
    <section className="ptd-sectie ptd-kaart kl-pins" aria-labelledby="wacht-kop">
      <div className="ptd-sectiekop">
        <h2 id="wacht-kop"><KeyRound size={18} aria-hidden /> Pincodes goedkeuren · {pins.length}</h2>
        <span>vraag eerst de controlecode na</span>
      </div>
      <ul className="ptd-lijst">
        {pins.map((p) => (
          <li key={p.persoonId} className="ptd-rij">
            <div className="ptd-rij-kop">
              <span className="ptd-naam">
                {p.naam}
                <span className="ptd-zacht"> · {ROL[p.rol]}{p.clubs.length > 0 ? ` ${clubsLabel(p.clubs)}` : ''}</span>
              </span>
              {p.controle ? <span className="ptd-badge">Controlecode <strong className="ptd-controle">{p.controle}</strong></span> : null}
            </div>
            <div className="ptd-acties ptd-acties--rij">
              <button type="button" className="ptd-knop ptd-knop--klein ptd-knop--primair" disabled={bezig !== null} onClick={() => void doe(p, 'goedkeuren')}>Goedkeuren</button>
              <button type="button" className="ptd-knop ptd-knop--klein" disabled={bezig !== null} onClick={() => void doe(p, 'afwijzen')}>Afwijzen</button>
            </div>
          </li>
        ))}
      </ul>
      {fout ? <Foutmelding bericht={fout} /> : null}
    </section>
  )
}
