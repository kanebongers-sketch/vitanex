'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Minus, Plus } from 'lucide-react'
import { ADD_ONS, BASIS_PAKKET, type PakketSleutel } from '@/lib/aiyourgym/pakketten'
import type { PakketWeg } from '@/lib/aiyourgym/pakket-wijziging'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { PAKKET_NAMEN, pakketInTaal, pakketWeergave } from '@/lib/aiyourgym/taal/woorden/algemeen/pakketten'
import { PAKKETTEN_BEHEER } from '@/lib/aiyourgym/taal/woorden/club/pakketten-beheer'
import { kiesMeldingen } from '@/lib/aiyourgym/taal/woorden/website/meldingen'

// Basis met add-ons in Club, Abonnement (besluit Kane 31-10-2026): de basis
// staat vast bovenaan, zonder knop (niet op te zeggen zolang het abonnement
// loopt). Per add-on de stand en een knop om hem erbij te nemen of op te
// zeggen. De server bepaalt eerlijk hoe het loopt (Stripe, testbetaling of
// een aanvraag) en de pagina zegt dat daarna precies zo.

interface PakkettenBeheerProps {
  afgenomen: readonly PakketSleutel[]
  /** Open aanvragen die Kane nog verwerkt. */
  aanvragen: readonly { pakket: PakketSleutel; actie: 'erbij' | 'opzeggen' }[]
}

type Melding = { soort: 'ok' | 'fout'; tekst: string } | null

function uitkomstTekst(json: unknown, actie: 'erbij' | 'opzeggen', t: (typeof PAKKETTEN_BEHEER)['nl']): string {
  const antwoord = (json ?? {}) as { weg?: unknown }
  const w = antwoord.weg as PakketWeg
  if (w === 'stripe') return t.uitkomst.stripe
  if (w === 'test' || w === 'direct') return t.uitkomst[w]
  return actie === 'erbij' ? t.uitkomst.aanvraagErbij : t.uitkomst.aanvraagOpzeggen
}

export function PakkettenBeheer({ afgenomen, aanvragen }: PakkettenBeheerProps) {
  const router = useRouter()
  const taal = useTaal()
  const t = useTekst(PAKKETTEN_BEHEER)
  const [bezig, setBezig] = useState<PakketSleutel | null>(null)
  const [melding, setMelding] = useState<Melding>(null)

  async function wijzig(pakket: PakketSleutel, actie: 'erbij' | 'opzeggen') {
    if (actie === 'opzeggen' && !window.confirm(t.zekerOpzeggen(pakketInTaal(pakket, taal).naam))) return
    setBezig(pakket)
    setMelding(null)
    try {
      const res = await fetch('/api/aiyourgym/pakketten', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pakket, actie }) })
      const json: unknown = await res.json().catch(() => null)
      if (res.ok) {
        setMelding({ soort: 'ok', tekst: uitkomstTekst(json, actie, t) })
        router.refresh()
      } else {
        setMelding({ soort: 'fout', tekst: kiesMeldingen(json, taal).fout ?? t.fout })
      }
    } catch {
      setMelding({ soort: 'fout', tekst: t.fout })
    }
    setBezig(null)
  }

  return (
    <section className="club-abo-pakketten" aria-labelledby="abo-pakketten">
      <div className="club-abo-pakketten-kop">
        <h2 id="abo-pakketten">{t.kop}</h2>
        <p>{t.uitleg}</p>
        <p className="club-hint">{t.staffel}</p>
      </div>
      <ul className="club-abo-pakketlijst" aria-label={t.basis}>
        <li className="club-abo-pakket" data-afgenomen>
          <div className="club-abo-pakket-tekst">
            <strong>{pakketWeergave(BASIS_PAKKET, taal)}</strong>
            <span>{pakketInTaal(BASIS_PAKKET, taal).voorWie}</span>
            <span className="club-hint">{t.basisVast}</span>
          </div>
          <span className="club-chip club-chip--ok">
            <Check size={13} aria-hidden /> {t.basis}
          </span>
        </li>
      </ul>
      <p className="club-abo-label">{t.addOns}</p>
      <ul className="club-abo-pakketlijst" aria-label={t.addOns}>
        {ADD_ONS.map((p) => {
          const tekst = pakketInTaal(p, taal)
          const heeft = afgenomen.includes(p)
          const open = aanvragen.find((a) => a.pakket === p)
          return (
            <li key={p} className="club-abo-pakket" data-afgenomen={heeft || undefined}>
              <div className="club-abo-pakket-tekst">
                <strong>{tekst.naam}</strong>
                <span>{tekst.voorWie}</span>
              </div>
              <span className={`club-chip ${heeft ? 'club-chip--ok' : 'club-chip--uit'}`}>
                {heeft ? <Check size={13} aria-hidden /> : null} {open ? (open.actie === 'erbij' ? t.aangevraagd : t.opzeggingAangevraagd) : heeft ? t.afgenomen : t.nietAfgenomen}
              </span>
              {open ? null : heeft ? (
                <button type="button" className="club-knop" onClick={() => wijzig(p, 'opzeggen')} disabled={bezig !== null} aria-busy={bezig === p}>
                  <Minus size={15} aria-hidden /> {bezig === p ? t.bezig : t.opzeggen}
                </button>
              ) : (
                <button type="button" className="club-knop club-knop--primair" onClick={() => wijzig(p, 'erbij')} disabled={bezig !== null} aria-busy={bezig === p}>
                  <Plus size={15} aria-hidden /> {bezig === p ? t.bezig : t.erbij}
                </button>
              )}
            </li>
          )
        })}
      </ul>
      {melding && (
        <p className={`club-melding${melding.soort === 'fout' ? ' club-melding--fout' : ''}`} role={melding.soort === 'fout' ? 'alert' : 'status'}>
          {melding.tekst}
        </p>
      )}
      <div className="club-abo-kern">
        <p className="club-abo-label">{t.kern}</p>
        <p>{PAKKET_NAMEN[taal].kern.inbegrepen.join(' · ')}</p>
        <p className="club-hint">{t.betalenNietErin}</p>
      </div>
    </section>
  )
}
