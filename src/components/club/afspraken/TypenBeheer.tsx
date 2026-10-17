'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { KLEUR_LABEL, type AfspraakType } from '@/lib/club/afspraken/model'
import { Paneel } from './Paneel'
import { TypeFormulier } from './TypeFormulier'
import type { Persoon } from './AfspraakFormulier'

// De soorten afspraken van de sportschool, met hun duur, buffer en regels.
// Een type weggooien kan niet (oude afspraken verwijzen ernaar): zet hem uit.

interface Props {
  typen: AfspraakType[]
  medewerkers: Persoon[]
}

function regels(t: AfspraakType): string {
  if (!t.appBoekbaar) return 'Alleen via balie of trainer'
  return `App: boeken tot ${t.boekenUrenVooraf} uur, annuleren tot ${t.annulerenUrenVooraf} uur van tevoren`
}

export function TypenBeheer({ typen, medewerkers }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState<AfspraakType | 'nieuw' | null>(null)
  const [melding, setMelding] = useState<string | null>(null)
  const [, startTransition] = useTransition()
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
          <Plus size={16} aria-hidden /> Nieuwe soort
        </button>
        <p className="club-afspraken-melding" role="status" aria-live="polite">{melding}</p>
      </div>
      {typen.length === 0 ? (
        <p className="club-leeg">Nog geen soorten afspraken. Begin met bijvoorbeeld een intake of personal training.</p>
      ) : (
        <ul className="club-afspraken-typen">
          {typen.map((t) => (
            <li key={t.id}>
              <button type="button" className="club-afspraken-type" data-kleur={t.kleur} data-uit={!t.actief || undefined} onClick={() => { setMelding(null); setOpen(t) }}>
                <span className="club-afspraken-typeduur"><strong>{t.duurMin}</strong> min</span>
                <span className="club-afspraken-typetekst">
                  <strong>{t.naam}</strong>
                  <span>{t.bufferMin > 0 ? `${t.bufferMin} min buffer · ` : ''}{regels(t)}</span>
                  <span>{t.medewerkerIds.length === 0 ? 'Elke trainer' : t.medewerkerIds.map((id) => naam.get(id) ?? 'Onbekend').join(', ')}</span>
                </span>
                <span className="club-afspraken-typechips">
                  <span className="club-sr">Kleur {KLEUR_LABEL[t.kleur]}</span>
                  {t.actief ? null : <span className="club-chip club-chip--uit">Uit</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {open ? (
        <Paneel label={open === 'nieuw' ? 'Nieuwe soort afspraak' : `${open.naam} wijzigen`} onSluit={() => setOpen(null)}>
          <TypeFormulier key={open === 'nieuw' ? 'nieuw' : open.id} type={open === 'nieuw' ? null : open} medewerkers={medewerkers} onKlaar={klaar} onSluit={() => setOpen(null)} />
        </Paneel>
      ) : null}
    </>
  )
}
