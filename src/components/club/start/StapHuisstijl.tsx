'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MAX_NAAM, MAX_SLOGAN } from '@/lib/club/kern/organisatie-invoer'
import { stuur } from '@/components/club/leden/stuur'
import type { HuisstijlWaarden } from '@/components/club/huisstijl/HuisstijlPortaal'
import { LogoBlok } from '@/components/club/huisstijl/LogoBlok'
import { KleurBlok } from '@/components/club/huisstijl/KleurBlok'
import { Voorbeeld } from '@/components/club/huisstijl/Voorbeeld'
import { StartVoet, type StartVoetProps } from './StartVoet'

// Stap 2: naam, logo, accentkleur en licht of donker, met rechts een levend
// voorbeeld van Club en de ledenapp. Zelfde onderdelen en API als het
// huisstijl-portaal; "verder" slaat eerst op als er iets is veranderd.

/** Huisstijl en onderdelen samen naar de API (die wil altijd alles). */
export async function bewaarOrganisatie(w: HuisstijlWaarden): Promise<string | null> {
  const uit = await stuur('/api/club/organisatie', 'PATCH', { ...w, slogan: w.slogan ?? '' })
  return uit.ok ? null : uit.fout
}

interface StapHuisstijlProps {
  organisatie: HuisstijlWaarden
  logoUrl: string | null
  ingebouwdLogo: boolean
  voet: Omit<StartVoetProps, 'voorVerder' | 'primair'>
}

export function StapHuisstijl({ organisatie, logoUrl, ingebouwdLogo, voet }: StapHuisstijlProps) {
  const router = useRouter()
  const [waarden, setWaarden] = useState<HuisstijlWaarden>(organisatie)
  const [fout, setFout] = useState<string | null>(null)
  const gewijzigd = JSON.stringify(waarden) !== JSON.stringify(organisatie)

  function zet<K extends keyof HuisstijlWaarden>(veld: K, waarde: HuisstijlWaarden[K]) {
    setFout(null)
    setWaarden((w) => ({ ...w, [veld]: waarde }))
  }

  async function voorVerder(): Promise<boolean> {
    if (!gewijzigd) return true
    const melding = await bewaarOrganisatie(waarden)
    if (melding) {
      setFout(melding)
      return false
    }
    router.refresh()
    return true
  }

  return (
    <>
      <div className="club-huisstijl club-start-huisstijl">
        <div className="club-huisstijl-velden">
          <section className="club-huisstijl-blok" aria-labelledby="start-merk-kop">
            <h2 id="start-merk-kop" className="club-huisstijl-kop">Naam en logo</h2>
            <label className="club-veld">
              <span>Naam van de sportschool</span>
              <input className="club-invoer" value={waarden.naam} maxLength={MAX_NAAM} onChange={(e) => zet('naam', e.target.value)} />
            </label>
            <label className="club-veld">
              <span>Slogan (mag leeg)</span>
              <input className="club-invoer" value={waarden.slogan ?? ''} maxLength={MAX_SLOGAN} onChange={(e) => zet('slogan', e.target.value || null)} />
            </label>
            <LogoBlok logoUrl={logoUrl} ingebouwd={ingebouwdLogo} naam={waarden.naam} />
          </section>
          <KleurBlok kleur={waarden.kleurAccent} thema={waarden.thema} onKleur={(k) => zet('kleurAccent', k)} onThema={(t) => zet('thema', t)} />
          {fout && <p className="club-melding club-melding--fout" role="alert">{fout}</p>}
        </div>
        <Voorbeeld waarden={waarden} logoUrl={logoUrl} ingebouwdLogo={ingebouwdLogo} />
      </div>
      <StartVoet {...voet} voorVerder={voorVerder} primair={gewijzigd ? 'Opslaan en verder' : undefined} />
    </>
  )
}
