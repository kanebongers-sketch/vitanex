'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { themaVan, type Thema, type Variant } from '@/lib/club/kern/huisstijl'
import type { Module } from '@/lib/club/kern/organisatie'
import type { PakketSleutel } from '@/lib/aiyourgym/pakketten'
import { MAX_NAAM, MAX_SLOGAN } from '@/lib/club/kern/organisatie-invoer'
import { MIN_NAAM } from '@/lib/club/kern/sportschool-naam'
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
  /** Afgeleid van variant (licht of donker). */
  thema: Thema
  kleurTweede: string | null
  kleurTint: string | null
  variant: Variant
  uit: Module[]
}

/** De kleurvelden van het KleurBlok, gekoppeld aan de waarden (portaal en startwizard). */
export function kleurProps(waarden: HuisstijlWaarden, zet: <K extends keyof HuisstijlWaarden>(veld: K, waarde: HuisstijlWaarden[K]) => void) {
  return {
    kleur: waarden.kleurAccent,
    tweede: waarden.kleurTweede,
    tint: waarden.kleurTint,
    variant: waarden.variant,
    onKleur: (k: string) => zet('kleurAccent', k),
    onTweede: (k: string | null) => zet('kleurTweede', k),
    onTint: (k: string | null) => zet('kleurTint', k),
    onVariant: (v: Variant) => {
      zet('variant', v)
      zet('thema', themaVan(v))
    },
  }
}

interface HuisstijlPortaalProps {
  organisatie: HuisstijlWaarden
  logoUrl: string | null
  ingebouwdLogo: boolean
  /** Het adres van de sportschool (aiyourgym.com/<slug>), of null als er nog geen is. Verandert niet mee met de naam. */
  adres: string | null
  /** De afgenomen pakketten: alleen hun onderdelen staan bij de schakelaars. */
  afgenomen?: readonly PakketSleutel[]
}

export function HuisstijlPortaal({ organisatie, logoUrl, ingebouwdLogo, adres, afgenomen }: HuisstijlPortaalProps) {
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
          <label className="club-veld" htmlFor="sportschool-naam">
            <span>{t.naam}</span>
            <input
              id="sportschool-naam"
              className="club-invoer"
              value={waarden.naam}
              required
              minLength={MIN_NAAM}
              maxLength={MAX_NAAM}
              autoComplete="organization"
              aria-describedby="sportschool-naam-uitleg"
              onChange={(e) => zet('naam', e.target.value)}
            />
          </label>
          <div id="sportschool-naam-uitleg" className="club-hint club-huisstijl-naamuitleg">
            <p>{t.naamUitleg}{adres ? ` ${t.naamAdres(adres)}` : ''}</p>
            <p>
              {t.naamBedrijf} <Link href="/club/beheer/bedrijf">{t.naamBedrijfLink}</Link>.
            </p>
          </div>
          <label className="club-veld">
            <span>{t.slogan}</span>
            <input className="club-invoer" value={waarden.slogan ?? ''} maxLength={MAX_SLOGAN} onChange={(e) => zet('slogan', e.target.value || null)} />
          </label>
          <LogoBlok logoUrl={logoUrl} ingebouwd={ingebouwdLogo} naam={waarden.naam} />
        </section>

        <KleurBlok {...kleurProps(waarden, zet)} />

        <ModulesBlok uit={waarden.uit} onWijzig={(uit) => zet('uit', uit)} afgenomen={afgenomen} />

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
