'use client'

import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { DomeinSectie, Stat, StatRij } from './DomeinSectie'
import { useDomein, type DomeinUitkomst } from './useDomein'
import { DomeinSkelet } from './DomeinSkelet'
import { haalJson, haalJsonGedeeld, isObject, getalOfNull } from '@/lib/lifeos/api/http'
import { leesTakenAntwoord } from '@/lib/lifeos/taken/taken'
import { duurLabel } from '@/lib/lifeos/datum/datum'

// ─── Domein: Productiviteit ─────────────────────────────────────────────────
// Taken en focus. Twee bronnen die allebei al bestonden en waarvan de
// focus-kant nooit werd uitgelezen: `/api/focus/log` (GET) telt je
// focus-minuten van de afgelopen 7 dagen en werd door geen enkel scherm
// aangeroepen.
//
// Let op de rekenrichting bij taken: we tellen wat er ÓPEN staat en wat er
// vandaag áf is. Nadrukkelijk geen "voltooiingspercentage" — dat getal daalt als
// je een taak toevoegt, en dan meet je je eigen ambitie in plaats van je werk.

interface ProductiviteitData {
  open: number
  vandaagKlaar: number
  /** `null` = niet op te halen. Niet: "nul minuten gefocust". */
  focusMinuten: number | null
}

/** Narrowt `GET /api/focus/log` → `totaal_minuten` (7 dagen, pauze/adem eruit). */
function leesFocus(ruw: unknown): { minuten: number } | null {
  if (!isObject(ruw)) return null
  const minuten = getalOfNull(ruw.totaal_minuten)
  return minuten === null ? null : { minuten }
}

/** De dagsleutel van vandaag, in lokale tijd (niet UTC — dat schuift 's nachts). */
function vandaagSleutel(): string {
  const nu = new Date()
  const maand = String(nu.getMonth() + 1).padStart(2, '0')
  const dag = String(nu.getDate()).padStart(2, '0')
  return `${nu.getFullYear()}-${maand}-${dag}`
}

async function haalProductiviteit(): Promise<DomeinUitkomst<ProductiviteitData>> {
  const [taken, focus] = await Promise.all([
    // `alle=1`: inclusief backlog en "ooit". We tellen hier je hele stapel, niet
    // alleen vandaag — dat is juist wat een domein-overzicht moet laten zien.
    // Gedeeld: de cockpit (VangOp, via useTaken) haalt dezelfde lijst ook op.
    haalJsonGedeeld('/api/lifeos/taken?alle=1', leesTakenAntwoord),
    haalJson('/api/focus/log', leesFocus),
  ])

  if (!taken.ok) return { ok: false, fout: taken.fout }

  const vandaag = vandaagSleutel()
  const open = taken.waarde.filter((t) => !t.klaar).length
  // Afgevinkt vandaag: op `klaarOp` (het moment van afvinken), niet op `datum`
  // (de dag waarop je 'm plánde). Een taak van vorige week die je vandaag afrondt
  // telt vandaag — dat is het werk dat je vandaag deed.
  const vandaagKlaar = taken.waarde.filter((t) => t.klaarOp !== null && t.klaarOp.startsWith(vandaag)).length

  return {
    ok: true,
    waarde: { open, vandaagKlaar, focusMinuten: focus.ok ? focus.waarde.minuten : null },
  }
}

export function ProductiviteitDomein() {
  const { staat, opnieuw } = useDomein(haalProductiviteit)

  return (
    <DomeinSectie titel="Productiviteit" definitie="Wat er open staat, wat je afmaakte en waar je focus heen ging.">
      {staat.fase === 'laden' ? <DomeinSkelet statistieken={3} /> : null}
      {staat.fase === 'fout' ? <Foutmelding bericht={staat.bericht} opnieuw={opnieuw} /> : null}
      {staat.fase === 'ok' ? <Inhoud data={staat.data} /> : null}
    </DomeinSectie>
  )
}

function Inhoud({ data }: { data: ProductiviteitData }) {
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <StatRij>
        <Stat waarde={String(data.open)} naam="Taken open" detail="inclusief backlog en “ooit”" />
        <Stat
          waarde={String(data.vandaagKlaar)}
          naam="Vandaag afgevinkt"
          // 0 is hier een échte nul: we weten dat je vandaag niets afvinkte.
          // Dat is iets anders dan een streepje, dat "we weten het niet" zegt.
          detail={data.vandaagKlaar === 0 ? 'nog niets afgerond' : 'afgerond vandaag'}
        />
        <Stat
          waarde={data.focusMinuten === null ? '—' : duurLabel(data.focusMinuten)}
          naam="Focus, 7 dagen"
          detail={data.focusMinuten === null ? 'niet opgehaald' : 'pauzes niet meegeteld'}
        />
      </StatRij>
    </div>
  )
}
