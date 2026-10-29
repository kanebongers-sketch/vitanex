'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Trash2 } from 'lucide-react'
import { stuur } from '@/components/club/rooster/vraag'
import { MEDEWERKER_ROLLEN, type MedewerkerRol } from '@/lib/club/kern/medewerker'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { START } from '@/lib/aiyourgym/taal/woorden/club/start'
import type { LoginStaat } from '@/lib/club/medewerker-login/medewerker-login'
import { TeamUitnodiging } from './TeamUitnodiging'

// Een medewerker in stap Team, meteen te bewerken: naam, e-mail, functies en
// vestigingen, met Opslaan zodra er iets verandert. Verwijderen zet de
// medewerker op niet actief (de historie van diensten en lessen blijft
// kloppen), na een tweede klik om te bevestigen. Dezelfde API als Medewerkers.

export interface TeamLid {
  id: string
  naam: string
  email: string | null
  rollen: MedewerkerRol[]
  vestigingen: string[]
  /** De stand van de login (geen, uitgenodigd, verlopen, actief, oud). */
  login: LoginStaat
}

interface TeamRijProps {
  lid: TeamLid
  /** Alle vestigingen van de sportschool. */
  vestigingen: { sleutel: string; naam: string }[]
  /** De vestiging die open staat (de API wil er een bij elke wijziging). */
  vestiging: string
  loginAan: boolean
  linkBasis: string | null
}

function zelfde(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((x) => b.includes(x))
}

/** Een keuze aan of uit zetten in een lijst, zonder de lijst leeg te maken. */
export function wisselIn<T>(lijst: readonly T[], x: T): T[] {
  if (!lijst.includes(x)) return [...lijst, x]
  return lijst.length > 1 ? lijst.filter((y) => y !== x) : [...lijst]
}

export function TeamRij({ lid, vestigingen, vestiging, loginAan, linkBasis }: TeamRijProps) {
  const router = useRouter()
  const [naam, setNaam] = useState(lid.naam)
  const [email, setEmail] = useState(lid.email ?? '')
  const [rollen, setRollen] = useState<MedewerkerRol[]>(lid.rollen.length > 0 ? lid.rollen : ['trainer'])
  const [waar, setWaar] = useState<string[]>(lid.vestigingen.length > 0 ? lid.vestigingen : [vestiging])
  const [bezig, setBezig] = useState(false)
  const [weg, setWeg] = useState(false)
  const [melding, setMelding] = useState<{ ok: boolean; tekst: string } | null>(null)
  const t = useTekst(START).team
  const gewijzigd = naam.trim() !== lid.naam || email.trim() !== (lid.email ?? '') || !zelfde(rollen, lid.rollen) || !zelfde(waar, lid.vestigingen)

  async function opslaan() {
    setBezig(true)
    setMelding(null)
    const uit = await stuur(`/api/club/instellingen/medewerkers/${lid.id}`, 'PATCH', { vestiging, naam: naam.trim(), email: email.trim(), rollen, vestigingen: waar })
    setBezig(false)
    if (!uit.ok) return setMelding({ ok: false, tekst: uit.fout })
    setMelding({ ok: true, tekst: t.opgeslagen })
    router.refresh()
  }

  async function verwijder() {
    if (!weg) return setWeg(true)
    setBezig(true)
    const uit = await stuur(`/api/club/instellingen/medewerkers/${lid.id}`, 'PATCH', { vestiging, actief: false })
    setBezig(false)
    setWeg(false)
    if (!uit.ok) return setMelding({ ok: false, tekst: uit.fout })
    router.refresh()
  }

  return (
    <li className="club-start-teamrij">
      <div className="club-start-teamrij-velden">
        <label className="club-veld">
          <span>{t.naam}</span>
          <input className="club-invoer" maxLength={80} autoComplete="off" value={naam} onChange={(e) => setNaam(e.target.value)} />
        </label>
        <label className="club-veld">
          <span>{t.email}</span>
          <input className="club-invoer" type="email" maxLength={160} autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t.emailNodig} />
        </label>
      </div>
      <fieldset className="club-start-keuzes">
        <legend>{t.functie}</legend>
        {MEDEWERKER_ROLLEN.map((r) => (
          <label key={r} className="club-start-keuze" data-aan={rollen.includes(r) || undefined}>
            <input type="checkbox" checked={rollen.includes(r)} onChange={() => setRollen((oud) => wisselIn(oud, r))} />
            {rollen.includes(r) && <Check aria-hidden size={14} strokeWidth={3} />} {t.rollen[r]}
          </label>
        ))}
      </fieldset>
      {vestigingen.length > 1 && (
        <fieldset className="club-start-keuzes">
          <legend>{t.werktIn}</legend>
          {vestigingen.map((v) => (
            <label key={v.sleutel} className="club-start-keuze" data-aan={waar.includes(v.sleutel) || undefined}>
              <input type="checkbox" checked={waar.includes(v.sleutel)} onChange={() => setWaar((oud) => wisselIn(oud, v.sleutel))} />
              {waar.includes(v.sleutel) && <Check aria-hidden size={14} strokeWidth={3} />} {v.naam}
            </label>
          ))}
        </fieldset>
      )}
      <div className="club-start-teamrij-acties">
        <TeamUitnodiging medewerkerId={lid.id} naam={lid.naam} email={lid.email} staat={lid.login} loginAan={loginAan} linkBasis={linkBasis} />
        <span className="club-start-teamrij-knoppen">
          {gewijzigd && (
            <button type="button" className="club-knop club-knop--primair club-knop--klein" disabled={bezig || !naam.trim()} onClick={() => void opslaan()}>
              {bezig ? t.bezig : t.opslaan}
            </button>
          )}
          <button type="button" className={`club-knop club-knop--klein${weg ? ' club-knop--gevaar' : ' club-knop--stil'}`} disabled={bezig} onClick={() => void verwijder()} onBlur={() => setWeg(false)} aria-label={weg ? t.verwijderZeker(lid.naam) : t.verwijderLabel(lid.naam)}>
            <Trash2 aria-hidden size={14} /> {weg ? t.zeker : t.verwijderen}
          </button>
        </span>
      </div>
      <div aria-live="polite">
        {melding && <p className={`club-melding${melding.ok ? ' club-melding--ok' : ' club-melding--fout'}`} role={melding.ok ? 'status' : 'alert'}>{melding.tekst}</p>}
      </div>
    </li>
  )
}
