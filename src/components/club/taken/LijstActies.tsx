'use client'

import { useState, type FormEvent } from 'react'
import { Copy, Plus } from 'lucide-react'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import { hoortBij, naamVan } from '@/lib/club/kern/vestigingen'
import { useVestigingen } from '@/components/club/shell/VestigingenContext'
import { useBeheer } from './useBeheer'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { TAKEN } from '@/lib/aiyourgym/taal/woorden/club/taken'

// Een nieuwe lijst voor deze vestiging, en de lijsten van de ene vestiging
// kopieren naar een andere (zonder dubbelingen, zonder vinkjes).

export function NieuweLijst({ vestiging }: { vestiging: Vestiging }) {
  const { bezig, fout, stuur } = useBeheer()
  const [naam, setNaam] = useState('')
  const t = useTekst(TAKEN).acties

  async function maak(e: FormEvent) {
    e.preventDefault()
    const r = await stuur('/api/club/taken/lijst', 'POST', { vestiging, naam })
    if (r.ok) setNaam('')
  }

  return (
    <form className="club-kaart club-kaart--vlak club-taken-actieform" onSubmit={maak}>
      <h2>{t.nieuweLijst}</h2>
      <label className="club-veld">
        <span>{t.naam}</span>
        <input className="club-invoer" value={naam} onChange={(e) => setNaam(e.target.value)} maxLength={60} placeholder={t.naamVoorbeeld} required />
      </label>
      <button type="submit" className="club-knop" disabled={bezig || !naam.trim()}>
        <Plus size={16} aria-hidden />
        {t.lijstMaken}
      </button>
      {fout && (
        <p className="club-fout" role="alert">
          {fout}
        </p>
      )}
    </form>
  )
}

function antwoordTekst(data: unknown, naarNaam: string, t: (typeof TAKEN)['nl']['acties']): string {
  const taken = typeof data === 'object' && data !== null && 'taken' in data && typeof data.taken === 'number' ? data.taken : 0
  if (taken === 0) return t.hadAlles(naarNaam)
  return t.gekopieerd(taken, naarNaam)
}

export function KopieerLijsten({ vestiging }: { vestiging: Vestiging }) {
  const { bezig, fout, stuur } = useBeheer()
  const vestigingen = useVestigingen()
  const [van, setVan] = useState<Vestiging>(vestiging)
  const [naar, setNaar] = useState<Vestiging>(vestigingen.find((v) => v.sleutel !== vestiging)?.sleutel ?? vestiging)
  const [klaar, setKlaar] = useState<string | null>(null)
  const t = useTekst(TAKEN).acties

  async function kopieer(e: FormEvent) {
    e.preventDefault()
    setKlaar(null)
    const r = await stuur('/api/club/taken/kopieer', 'POST', { van, naar })
    if (r.ok) setKlaar(antwoordTekst(r.data, naamVan(vestigingen, naar), t))
  }

  return (
    <form className="club-kaart club-kaart--vlak club-taken-actieform" onSubmit={kopieer}>
      <h2>{t.kopieerTitel}</h2>
      <p className="club-hint">{t.kopieerUitleg}</p>
      <div className="club-formrij">
        <label className="club-veld">
          <span>{t.van}</span>
          <select className="club-invoer" value={van} onChange={(e) => hoortBij(vestigingen, e.target.value) && setVan(e.target.value)}>
            {vestigingen.map((v) => (
              <option key={v.sleutel} value={v.sleutel}>
                {v.naam}
              </option>
            ))}
          </select>
        </label>
        <label className="club-veld">
          <span>{t.naar}</span>
          <select className="club-invoer" value={naar} onChange={(e) => hoortBij(vestigingen, e.target.value) && setNaar(e.target.value)}>
            {vestigingen.map((v) => (
              <option key={v.sleutel} value={v.sleutel}>
                {v.naam}
              </option>
            ))}
          </select>
        </label>
      </div>
      <button type="submit" className="club-knop" disabled={bezig || van === naar}>
        <Copy size={16} aria-hidden />
        {bezig ? t.kopieren : t.kopieer}
      </button>
      <div aria-live="polite">
        {klaar && <p className="club-melding club-melding--ok">{klaar}</p>}
        {fout && (
          <p className="club-fout" role="alert">
            {fout}
          </p>
        )}
      </div>
    </form>
  )
}
