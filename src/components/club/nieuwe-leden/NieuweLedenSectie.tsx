import Link from 'next/link'
import { ClipboardCheck, UserPlus } from 'lucide-react'
import type { ClubToegang } from '@/lib/club/toegang'
import { clubPad, type Vestiging } from '@/lib/club/kern/vestiging'
import { kanBewerken } from '@/lib/club/rollen/wie'
import { haalNieuwVanLeden } from '@/lib/club/nieuwe-leden/meldingen'
import { knoppenData } from '@/lib/club/nieuwe-leden/knoppen-data'
import { clubTekst, getTaal } from '@/lib/aiyourgym/taal/server'
import { formatDatum, formatTijd } from '@/lib/aiyourgym/taal/formaat'
import { NIEUWE_LEDEN } from '@/lib/aiyourgym/taal/woorden/club/nieuwe-leden'
import { SectieKop } from '@/components/club/vandaag/secties/SectieKop'
import { NieuweLedenKnoppen } from './NieuweLedenKnoppen'
import { GezienKnop } from './GezienKnop'
import './nieuwe-leden.css'

// "Nieuwe leden" op Vandaag: een klik naar Lid toevoegen of een aanmeldlink,
// en wat leden zelf deden: "Nieuwe aanmelding via link" en "Intake ingevuld".
// Een naam opent de ledenkaart (intake op het tabblad Training); Gezien haalt
// de melding weg voor het hele team.

interface Props {
  t: ClubToegang
  vestiging: Vestiging
}

export async function NieuweLedenSectie({ t, vestiging }: Props) {
  const w = await clubTekst(NIEUWE_LEDEN)
  const taal = await getTaal()
  const bewerken = kanBewerken(t, 'leden')
  const [nieuw, knoppen] = await Promise.all([haalNieuwVanLeden(t.admin, t.userId, vestiging), bewerken ? knoppenData(t.admin, t.organisatie, vestiging) : null])
  const kaart = (id: string, tab?: string) => clubPad(`/leden/${encodeURIComponent(id)}`, vestiging, tab ? { tab } : undefined)
  const wanneer = (op: string) => `${formatDatum(op, taal, 'dagMaand')} ${formatTijd(op, taal)}`
  const items = nieuw ? [
    ...nieuw.aanmeldingen.map((a) => ({ sleutel: `a-${a.lidId}`, lidId: a.lidId, wat: 'aanmelding' as const, naam: a.naam, label: w.vandaag.aanmelding, sub: [w.vandaag.proef, a.abonnement, wanneer(a.op)].filter(Boolean).join(' · '), href: kaart(a.lidId), op: a.op })),
    ...nieuw.intakes.map((i) => ({ sleutel: `i-${i.intakeId}`, lidId: i.lidId, wat: 'intake' as const, naam: i.naam, label: w.vandaag.intake, sub: wanneer(i.op), href: kaart(i.lidId, 'training'), op: i.op })),
  ].sort((a, b) => b.op.localeCompare(a.op)) : []

  return (
    <section id="nieuwe-leden" className="club-vandaag-sectie" aria-labelledby="vandaag-nieuwe-leden">
      <SectieKop id="vandaag-nieuwe-leden" titel={w.vandaag.kop} sub={w.vandaag.sub} links={[]} />
      {knoppen && <NieuweLedenKnoppen {...knoppen} metLijst />}
      {nieuw === null ? (
        <p className="club-melding club-melding--fout" role="status">{w.vandaag.fout}</p>
      ) : items.length === 0 ? (
        <p className="club-hint club-nl-leeg">{w.vandaag.leeg}</p>
      ) : (
        <ul className="club-lijst club-kaart club-nl-meldingen">
          {items.map((m) => (
            <li key={m.sleutel} className="club-rij">
              <span className="club-nl-melding-icoon" data-soort={m.wat} aria-hidden>{m.wat === 'aanmelding' ? <UserPlus size={16} /> : <ClipboardCheck size={16} />}</span>
              <Link href={m.href} className="club-rij-hoofd">
                <span className="club-rij-titel">{m.naam}</span>
                <span className="club-rij-sub"><strong>{m.label}</strong> · {m.sub}</span>
              </Link>
              <GezienKnop lidId={m.lidId} wat={m.wat} label={w.vandaag.gezien} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
