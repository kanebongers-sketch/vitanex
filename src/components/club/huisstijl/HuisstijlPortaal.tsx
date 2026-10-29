'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Thema } from '@/lib/club/kern/huisstijl'
import type { Module } from '@/lib/club/kern/organisatie'
import { MAX_NAAM, MAX_SLOGAN } from '@/lib/club/kern/organisatie-invoer'
import { stuur } from '@/components/club/leden/stuur'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { HUISSTIJL } from '@/lib/aiyourgym/taal/woorden/club/huisstijl'
import { LogoBlok } from './LogoBlok'
import { KleurBlok } from './KleurBlok'
import { ModulesBlok } from './ModulesBlok'
import { Voorbeeld } from './Voorbeeld'

// Het huisstijl-portaal: alles wat een sportschool zelf aanpast. Het voorbeeld
// rechts verandert direct mee; opslaan zet het voor heel Club door.

export interface HuisstijlWaarden {
  naam: string
  slogan: string | null
  kleurAccent: string
  thema: Thema
  uit: Module[]
}

interface HuisstijlPortaalProps {
  organisatie: HuisstijlWaarden
  logoUrl: string | null
  ingebouwdLogo: boolean
}

export function HuisstijlPortaal({ organisatie, logoUrl, ingebouwdLogo }: HuisstijlPortaalProps) {
  const router = useRouter()
  const [waarden, setWaarden] = useState<HuisstijlWaarden>(organisatie)
  const [bezig, setBezig] = useState(false)
  const [melding, setMelding] = useState<{ ok: boolean; tekst: string } | null>(null)
  const gewijzigd = JSON.stringify(waarden) !== JSON.stringify(organisatie)
  const tekst = useTekst(HUISSTIJL)
  const t = tekst.portaal

  function zet<K extends keyof HuisstijlWaarden>(veld: K, waarde: HuisstijlWaarden[K]) {
    setMelding(null)
    setWaarden((w) => ({ ...w, [veld]: waarde }))
  }

  async function bewaar() {
    setBezig(true)
    const uit = await stuur('/api/club/organisatie', 'PATCH', { ...waarden, slogan: waarden.slogan ?? '' })
    setBezig(false)
    if (!uit.ok) return setMelding({ ok: false, tekst: uit.fout })
    setMelding({ ok: true, tekst: t.opgeslagen })
    router.refresh()
  }

  return (
    <div className="club-huisstijl">
      <div className="club-huisstijl-velden">
        <section className="club-huisstijl-blok" aria-labelledby="merk-kop">
          <h2 id="merk-kop" className="club-huisstijl-kop">{t.naamEnLogo}</h2>
          <label className="club-veld">
            <span>{t.naam}</span>
            <input className="club-invoer" value={waarden.naam} maxLength={MAX_NAAM} onChange={(e) => zet('naam', e.target.value)} />
          </label>
          <label className="club-veld">
            <span>{t.slogan}</span>
            <input className="club-invoer" value={waarden.slogan ?? ''} maxLength={MAX_SLOGAN} onChange={(e) => zet('slogan', e.target.value || null)} />
          </label>
          <LogoBlok logoUrl={logoUrl} ingebouwd={ingebouwdLogo} naam={waarden.naam} />
        </section>

        <KleurBlok kleur={waarden.kleurAccent} thema={waarden.thema} onKleur={(k) => zet('kleurAccent', k)} onThema={(t) => zet('thema', t)} />

        <ModulesBlok uit={waarden.uit} onWijzig={(uit) => zet('uit', uit)} />

        <div className="club-huisstijl-opslaan">
          <button type="button" className="club-knop club-knop--primair club-knop--groot" disabled={!gewijzigd || bezig} onClick={() => void bewaar()}>
            {bezig ? tekst.algemeen.bezig : tekst.algemeen.opslaan}
          </button>
          {gewijzigd && !bezig && (
            <button type="button" className="club-knop club-knop--stil" onClick={() => setWaarden(organisatie)}>
              {t.terugzetten}
            </button>
          )}
          <div className="club-huisstijl-status" role="status" aria-live="polite">
            {melding && <p className={`club-melding ${melding.ok ? 'club-melding--ok' : 'club-melding--fout'}`}>{melding.tekst}</p>}
          </div>
        </div>
      </div>

      <Voorbeeld waarden={waarden} logoUrl={logoUrl} ingebouwdLogo={ingebouwdLogo} />
    </div>
  )
}
