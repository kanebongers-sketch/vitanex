'use client'

import { useMemo, useState } from 'react'
import { useVestigingen } from '@/components/club/shell/VestigingenContext'
import { stuur } from '@/components/club/leden/stuur'
import { nederlandseFeestdagen, type FeestdagSleutel } from '@/lib/club/sluiting/feestdagen'
import type { Sluiting, SluitingSoort } from '@/lib/club/sluiting/model'
import { bestaatAl } from '@/lib/club/sluiting/regels'
import { datumKort } from '@/lib/club/sluiting/weergave'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { SLUITING } from '@/lib/aiyourgym/taal/woorden/club/sluiting'

// "Nederlandse feestdagen toevoegen": per feestdag kies je dicht of andere
// tijden. Wat er voor die vestiging(en) al staat, wordt niet dubbel toegevoegd.

interface Keuze {
  aan: boolean
  soort: SluitingSoort
  van: string
  tot: string
}

const DICHT: readonly FeestdagSleutel[] = ['nieuwjaarsdag', 'eerste-kerstdag']

function beginKeuze(sleutel: FeestdagSleutel): Keuze {
  if (DICHT.includes(sleutel)) return { aan: true, soort: 'gesloten', van: '09:00', tot: '14:00' }
  return { aan: true, soort: 'afwijkend', van: '09:00', tot: sleutel === 'koningsdag' ? '16:00' : '14:00' }
}

interface Props {
  jaar: number
  bestaande: readonly Sluiting[]
  onKlaar: (tekst: string, ok?: boolean) => void
}

export function FeestdagenFormulier({ jaar, bestaande, onKlaar }: Props) {
  const vestigingen = useVestigingen()
  const taal = useTaal()
  const t = useTekst(SLUITING).feest
  const alle = useTekst(SLUITING).formulier
  const dagen = useMemo(() => nederlandseFeestdagen(jaar), [jaar])
  const [vestiging, setVestiging] = useState('')
  const [keuzes, setKeuzes] = useState<Record<string, Keuze>>(() => Object.fromEntries(dagen.map((d) => [d.sleutel, beginKeuze(d.sleutel)])))
  const [bezig, setBezig] = useState(false)
  const zet = (sleutel: string, deel: Partial<Keuze>) => setKeuzes((oud) => ({ ...oud, [sleutel]: { ...(oud[sleutel] ?? beginKeuze(sleutel as FeestdagSleutel)), ...deel } }))

  const doel = vestiging || null
  const nieuw = dagen.filter((d) => keuzes[d.sleutel]?.aan && !bestaatAl(d.datum, doel, bestaande))

  async function voegToe() {
    setBezig(true)
    const body = { jaar, vestiging: doel, keuzes: nieuw.map((d) => ({ sleutel: d.sleutel, ...keuzes[d.sleutel] })) }
    const uit = await stuur('/api/club/sluiting/feestdagen', 'POST', body)
    setBezig(false)
    if (!uit.ok) return onKlaar(uit.fout, false)
    const n = (uit.data as { toegevoegd?: number } | null)?.toegevoegd ?? 0
    onKlaar(t.toegevoegd(n))
  }

  return (
    <div className="club-sluiting-form">
      <label className="club-veld">
        <span>{t.voor}</span>
        <select className="club-invoer" value={vestiging} onChange={(e) => setVestiging(e.target.value)}>
          <option value="">{alle.alleVestigingen}</option>
          {vestigingen.map((v) => (
            <option key={v.sleutel} value={v.sleutel}>
              {v.naam}
            </option>
          ))}
        </select>
      </label>

      <ul className="club-sluiting-feestdagen">
        {dagen.map((d) => {
          const k = keuzes[d.sleutel] ?? beginKeuze(d.sleutel)
          const staat = bestaatAl(d.datum, doel, bestaande)
          const naam = t.naam[d.sleutel]
          return (
            <li key={d.sleutel} className={`club-sluiting-feestdag${staat ? ' is-er-al' : ''}`}>
              <label className="club-sluiting-feestnaam">
                <input type="checkbox" checked={k.aan && !staat} disabled={staat} onChange={(e) => zet(d.sleutel, { aan: e.target.checked })} />
                <span>
                  <strong>{naam}</strong>
                  <small>{staat ? t.staatErAl(datumKort(d.datum, taal)) : datumKort(d.datum, taal)}</small>
                </span>
              </label>
              {!staat && k.aan && (
                <div className="club-sluiting-feestkeuze">
                  <select className="club-invoer" aria-label={t.soort(naam)} value={k.soort} onChange={(e) => zet(d.sleutel, { soort: e.target.value === 'afwijkend' ? 'afwijkend' : 'gesloten' })}>
                    <option value="gesloten">{alle.gesloten}</option>
                    <option value="afwijkend">{alle.andereTijden}</option>
                  </select>
                  {k.soort === 'afwijkend' && (
                    <span className="club-sluiting-tijden">
                      <input className="club-invoer" type="time" aria-label={t.openVan(naam)} value={k.van} onChange={(e) => zet(d.sleutel, { van: e.target.value })} />
                      <span aria-hidden>{t.tot}</span>
                      <input className="club-invoer" type="time" aria-label={t.openTot(naam)} value={k.tot} onChange={(e) => zet(d.sleutel, { tot: e.target.value })} />
                    </span>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ul>

      <button type="button" className="club-knop club-knop--primair" disabled={bezig || nieuw.length === 0} onClick={() => void voegToe()}>
        {bezig ? t.bezig : nieuw.length === 0 ? t.allesErAl : t.toevoegen(nieuw.length)}
      </button>
    </div>
  )
}
