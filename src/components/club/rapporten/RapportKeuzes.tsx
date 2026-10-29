'use client'

import { useRouter } from 'next/navigation'
import { useTransition, type FormEvent } from 'react'
import { RAPPORT_GROEPEN, rapportenIn } from '@/lib/club/rapporten/definities'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { RAPPORTEN_TEKST } from '@/lib/aiyourgym/taal/woorden/club/rapporten'
import { ALLE, VESTIGINGEN_PARAM, type MaandKeuze, type RapportKeuze } from '@/lib/club/rapporten/keuze'
import type { VestigingInfo } from '@/lib/club/kern/vestigingen'
import { VESTIGING_PARAM } from '@/lib/club/kern/vestiging'

// De keuzes: rapport, maand en vestigingen. Een gewoon GET-formulier, dus het
// werkt ook zonder JavaScript (knop Toon). Met JavaScript ververst het
// voorbeeld meteen bij elke wijziging; de keuze staat altijd in de URL.

interface Props {
  keuze: RapportKeuze
  vestigingen: readonly VestigingInfo[]
  /** De vestiging van de balk bovenin; blijft in de URL staan. */
  balk: string | null
  maanden: readonly MaandKeuze[]
}

const PAD = '/club/rapporten'

function adresVan(form: HTMLFormElement): string {
  const data = new FormData(form)
  const zoek = new URLSearchParams()
  for (const [k, w] of data) if (typeof w === 'string' && w !== '') zoek.append(k, w)
  // Alles aangevinkt: kort "alle", zodat het adres leesbaar blijft.
  const vs = zoek.getAll(VESTIGINGEN_PARAM)
  const totaal = form.querySelectorAll(`input[name="${VESTIGINGEN_PARAM}"]`).length
  if (totaal > 1 && vs.length === totaal) {
    zoek.delete(VESTIGINGEN_PARAM)
    zoek.append(VESTIGINGEN_PARAM, ALLE)
  }
  return `${PAD}?${zoek.toString()}`
}

export function RapportKeuzes({ keuze, vestigingen, balk, maanden }: Props) {
  const router = useRouter()
  const [bezig, start] = useTransition()
  const t = useTekst(RAPPORTEN_TEKST)
  const opties = maanden.some((m) => m.maand === keuze.maand) ? maanden : [{ maand: keuze.maand, label: keuze.maand }, ...maanden]

  function ververs(form: HTMLFormElement) {
    const adres = adresVan(form)
    start(() => router.replace(adres, { scroll: false }))
  }

  function verstuur(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    ververs(e.currentTarget)
  }

  return (
    <form className="club-rapporten-keuzes" method="get" action={PAD} onSubmit={verstuur} onChange={(e) => ververs(e.currentTarget)} aria-busy={bezig || undefined}>
      {balk && <input type="hidden" name={VESTIGING_PARAM} value={balk} />}

      <fieldset className="club-rapporten-blok">
        <legend className="club-rapporten-legend">
          <span>01</span> {t.keuzes.rapport}
        </legend>
        {RAPPORT_GROEPEN.map((groep) => (
          <div key={groep} className="club-rapporten-groep" role="group" aria-label={t.groepen[groep]}>
            <p className="club-rapporten-groepnaam">{t.groepen[groep]}</p>
            {rapportenIn(groep).map((r) => (
              <label key={r.sleutel} className="club-rapporten-optie">
                <input type="radio" name="rapport" value={r.sleutel} defaultChecked={r.sleutel === keuze.rapport} />
                <span className="club-rapporten-optie-titel">{t.rapporten[r.sleutel].titel}</span>
                <span className="club-rapporten-optie-uitleg">{t.rapporten[r.sleutel].uitleg}</span>
              </label>
            ))}
          </div>
        ))}
      </fieldset>

      <fieldset className="club-rapporten-blok">
        <legend className="club-rapporten-legend">
          <span>02</span> {t.keuzes.maand}
        </legend>
        <label className="club-veld">
          <span className="club-sr">{t.keuzes.kiesMaand}</span>
          <select className="club-invoer club-rapporten-maand" name="maand" defaultValue={keuze.maand}>
            {opties.map((m) => (
              <option key={m.maand} value={m.maand}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
      </fieldset>

      <fieldset className="club-rapporten-blok">
        <legend className="club-rapporten-legend">
          <span>03</span> {t.keuzes.vestigingen}
        </legend>
        <div className="club-rapporten-vestigingen">
          {vestigingen.map((v) => (
            <label key={v.sleutel} className="club-rapporten-vestiging">
              <input type="checkbox" name={VESTIGINGEN_PARAM} value={v.sleutel} defaultChecked={keuze.vestigingen.includes(v.sleutel)} />
              <span>{v.naam}</span>
            </label>
          ))}
        </div>
        <p className="club-hint">{t.keuzes.geenVinkje}</p>
      </fieldset>

      <button type="submit" className="club-knop club-rapporten-toon">
        {bezig ? t.keuzes.bezig : t.keuzes.toon}
      </button>
    </form>
  )
}
