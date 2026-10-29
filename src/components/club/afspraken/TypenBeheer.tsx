'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import type { AfspraakType } from '@/lib/club/afspraken/model'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { AFSPRAKEN } from '@/lib/aiyourgym/taal/woorden/club/afspraken'
import { Paneel } from './Paneel'
import { TypeFormulier } from './TypeFormulier'
import type { Persoon } from './AfspraakFormulier'

// De soorten afspraken van de sportschool, met hun duur, buffer en regels.
// Een type weggooien kan niet (oude afspraken verwijzen ernaar): zet hem uit.

interface Props {
  typen: AfspraakType[]
  medewerkers: Persoon[]
}

type TypenTekst = (typeof AFSPRAKEN)['nl']['typen']

function regels(ty: AfspraakType, t: TypenTekst): string {
  if (!ty.appBoekbaar) return t.alleenBalie
  return t.appRegels(ty.boekenUrenVooraf, ty.annulerenUrenVooraf)
}

export function TypenBeheer({ typen, medewerkers }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState<AfspraakType | 'nieuw' | null>(null)
  const [melding, setMelding] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const w = useTekst(AFSPRAKEN)
  const t = w.typen
  const naam = new Map(medewerkers.map((m) => [m.id, m.naam]))

  function klaar(tekst: string) {
    setOpen(null)
    setMelding(tekst)
    startTransition(() => router.refresh())
  }

  return (
    <>
      <div className="club-acties club-afspraken-actiebalk">
        <button type="button" className="club-knop club-knop--primair" onClick={() => { setMelding(null); setOpen('nieuw') }}>
          <Plus size={16} aria-hidden /> {t.nieuw}
        </button>
        <p className="club-afspraken-melding" role="status" aria-live="polite">{melding}</p>
      </div>
      {typen.length === 0 ? (
        <p className="club-leeg">{t.leeg}</p>
      ) : (
        <ul className="club-afspraken-typen">
          {typen.map((ty) => (
            <li key={ty.id}>
              <button type="button" className="club-afspraken-type" data-kleur={ty.kleur} data-uit={!ty.actief || undefined} onClick={() => { setMelding(null); setOpen(ty) }}>
                <span className="club-afspraken-typeduur"><strong>{ty.duurMin}</strong> {t.min}</span>
                <span className="club-afspraken-typetekst">
                  <strong>{ty.naam}</strong>
                  <span>{ty.bufferMin > 0 ? t.buffer(ty.bufferMin) : ''}{regels(ty, t)}</span>
                  <span>{ty.medewerkerIds.length === 0 ? t.elkeTrainer : ty.medewerkerIds.map((id) => naam.get(id) ?? t.onbekend).join(', ')}</span>
                </span>
                <span className="club-afspraken-typechips">
                  <span className="club-sr">{t.kleur(w.kleur[ty.kleur])}</span>
                  {ty.actief ? null : <span className="club-chip club-chip--uit">{t.uit}</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {open ? (
        <Paneel label={open === 'nieuw' ? t.nieuwTitel : t.wijzigen(open.naam)} onSluit={() => setOpen(null)}>
          <TypeFormulier key={open === 'nieuw' ? 'nieuw' : open.id} type={open === 'nieuw' ? null : open} medewerkers={medewerkers} onKlaar={klaar} onSluit={() => setOpen(null)} />
        </Paneel>
      ) : null}
    </>
  )
}
