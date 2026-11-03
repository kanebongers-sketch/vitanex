'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowDown, ArrowUp, Plus, X } from 'lucide-react'
import type { VestigingInfo } from '@/lib/club/kern/vestigingen'
import type { Rol } from '@/lib/club/rollen/typen'
import { GRENZEN, WERKWIJZE_SOORTEN, type Stap, type Werkwijze, type WerkwijzeSoort } from '@/lib/club/prikbord/typen'
import type { TakenlijstKeuze } from '@/lib/club/prikbord/opslag'
import { stuur } from '@/components/club/leden/stuur'
import { DoelgroepKiezer } from './DoelgroepKiezer'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { PRIKBORD } from '@/lib/aiyourgym/taal/woorden/club/prikbord'

// Een werkwijze schrijven (nieuw) of een nieuwe versie van de stappen maken.
// Bij een nieuwe versie kies je "Belangrijke wijziging": dan krijgt het team
// een mededeling die bevestigd moet worden, met de zin wat er anders is.

interface Props {
  /** Bestaat al: dan wordt dit een nieuwe versie. */
  werkwijze?: Werkwijze
  vestigingen: readonly VestigingInfo[]
  takenlijsten: readonly TakenlijstKeuze[]
  onKlaar: () => void
}

interface StapRij extends Stap {
  sleutel: number
}

let teller = 0
const rijVan = (s: Stap): StapRij => ({ ...s, sleutel: ++teller })

export function WerkwijzeEditor({ werkwijze, vestigingen, takenlijsten, onKlaar }: Props) {
  const tekst = useTekst(PRIKBORD)
  const t = tekst.editor
  const router = useRouter()
  const [titel, setTitel] = useState(werkwijze?.titel ?? '')
  const [soort, setSoort] = useState<WerkwijzeSoort>(werkwijze?.soort ?? 'eigen')
  const [gekozenVestigingen, setVestigingen] = useState<string[]>([])
  const [rollen, setRollen] = useState<Rol[]>([])
  const [takenlijstId, setTakenlijstId] = useState('')
  const [stappen, setStappen] = useState<StapRij[]>(() => (werkwijze?.stappen ?? [{ tekst: '', uitleg: null }]).map(rijVan))
  const [belangrijk, setBelangrijk] = useState(false)
  const [watAnders, setWatAnders] = useState('')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)

  const wijzig = (i: number, deel: Partial<Stap>) => setStappen((nu) => nu.map((s, j) => (j === i ? { ...s, ...deel } : s)))
  const schuif = (i: number, r: -1 | 1) =>
    setStappen((nu) => {
      const j = i + r
      if (j < 0 || j >= nu.length) return nu
      const kopie = [...nu]
      ;[kopie[i], kopie[j]] = [kopie[j], kopie[i]]
      return kopie
    })

  async function bewaar(e: FormEvent) {
    e.preventDefault()
    if (bezig) return
    setBezig(true)
    setFout(null)
    const schoon = stappen.map((s) => ({ tekst: s.tekst, uitleg: s.uitleg || null })).filter((s) => s.tekst.trim() !== '')
    const uit = werkwijze
      ? await stuur(`/api/club/prikbord/werkwijzen/${werkwijze.id}`, 'PATCH', { stappen: schoon, watAnders, belangrijk })
      : await stuur('/api/club/prikbord/werkwijzen', 'POST', { titel, werkwijzeSoort: soort, vestigingen: gekozenVestigingen, rollen, stappen: schoon, takenlijstId: takenlijstId || null })
    setBezig(false)
    if (!uit.ok) return setFout(uit.fout)
    onKlaar()
    router.refresh()
  }

  return (
    <form className="pb-formulier club-kaart club-kaart--vlak" onSubmit={(e) => void bewaar(e)}>
      {!werkwijze ? (
        <>
          <div className="club-formrij">
            <label className="club-veld">
              <span>{t.titel}</span>
              <input className="club-invoer" value={titel} onChange={(e) => setTitel(e.target.value)} maxLength={GRENZEN.titel} required />
            </label>
            <label className="club-veld">
              <span>{t.soort}</span>
              <select className="club-invoer" value={soort} onChange={(e) => setSoort(e.target.value as WerkwijzeSoort)}>
                {WERKWIJZE_SOORTEN.map((s) => (
                  <option key={s} value={s}>
                    {tekst.soorten[s]}
                  </option>
                ))}
              </select>
            </label>
            {takenlijsten.length > 0 ? (
              <label className="club-veld">
                <span>{tekst.werkwijzen.takenlijst}</span>
                <select className="club-invoer" value={takenlijstId} onChange={(e) => setTakenlijstId(e.target.value)}>
                  <option value="">{tekst.werkwijzen.geenTakenlijst}</option>
                  {takenlijsten.map((l) => (
                    <option key={l.id} value={l.id}>
                      {vestigingen.length > 1 ? `${l.naam} · ${vestigingen.find((v) => v.sleutel === l.vestiging)?.naam ?? l.vestiging}` : l.naam}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>
          <DoelgroepKiezer vestigingen={vestigingen} gekozenVestigingen={gekozenVestigingen} gekozenRollen={rollen} onVestigingen={setVestigingen} onRollen={setRollen} />
        </>
      ) : null}
      <ol className="pb-stappen-edit">
        {stappen.map((s, i) => (
          <li key={s.sleutel} className="pb-stap-edit">
            <span className="club-label">{t.stap(i + 1)}</span>
            <input className="club-invoer" aria-label={t.stapTekst} placeholder={t.stapTekst} value={s.tekst} maxLength={GRENZEN.stapTekst} onChange={(e) => wijzig(i, { tekst: e.target.value })} />
            <input className="club-invoer" aria-label={t.stapUitleg} placeholder={t.stapUitleg} value={s.uitleg ?? ''} maxLength={GRENZEN.stapUitleg} onChange={(e) => wijzig(i, { uitleg: e.target.value })} />
            <div className="pb-stap-knoppen">
              <button type="button" className="club-knop club-knop--klein club-knop--stil" aria-label={t.omhoog} onClick={() => schuif(i, -1)} disabled={i === 0}>
                <ArrowUp size={14} aria-hidden />
              </button>
              <button type="button" className="club-knop club-knop--klein club-knop--stil" aria-label={t.omlaag} onClick={() => schuif(i, 1)} disabled={i === stappen.length - 1}>
                <ArrowDown size={14} aria-hidden />
              </button>
              <button type="button" className="club-knop club-knop--klein club-knop--stil" aria-label={t.stapWeg} onClick={() => setStappen((nu) => nu.filter((_, j) => j !== i))} disabled={stappen.length === 1}>
                <X size={14} aria-hidden />
              </button>
            </div>
          </li>
        ))}
      </ol>
      {stappen.length < GRENZEN.stappen ? (
        <button type="button" className="club-knop club-knop--klein" onClick={() => setStappen((nu) => [...nu, rijVan({ tekst: '', uitleg: null })])}>
          <Plus size={14} aria-hidden /> {t.stapErbij}
        </button>
      ) : null}
      {werkwijze ? (
        <>
          <label className="pb-vink">
            <input type="checkbox" checked={belangrijk} onChange={(e) => setBelangrijk(e.target.checked)} />
            <span>
              <b>{t.belangrijk}</b>
              <span className="club-hint">{t.belangrijkUitleg}</span>
            </span>
          </label>
          <label className="club-veld">
            <span>{tekst.werkwijzen.watAnders}</span>
            <input className="club-invoer" value={watAnders} onChange={(e) => setWatAnders(e.target.value)} maxLength={GRENZEN.watAnders} placeholder={t.watAndersPlaats} required={belangrijk} />
          </label>
        </>
      ) : null}
      {fout ? (
        <p className="club-melding club-melding--fout" role="alert">
          {fout}
        </p>
      ) : null}
      <div className="pb-acties">
        <button type="submit" className="club-knop club-knop--primair" disabled={bezig}>
          {bezig ? tekst.formulier.bezig : werkwijze ? t.opslaanVersie(werkwijze.versie + 1) : t.opslaan}
        </button>
        <button type="button" className="club-knop club-knop--stil" onClick={onKlaar}>
          {tekst.formulier.annuleren}
        </button>
      </div>
    </form>
  )
}
