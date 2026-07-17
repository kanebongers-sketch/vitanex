'use client'

import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { DomeinSectie, Stat, StatRij } from './DomeinSectie'
import { useDomein, type DomeinUitkomst } from './useDomein'
import { DomeinSkelet } from './DomeinSkelet'
import { haalJson, isObject, getalOfNull } from '@/lib/lifeos/api/http'
import { ALLE_ACHIEVEMENTS, LEVEL_NAMEN, berekenLevel, xpVoortgang } from '@/lib/xp/xp'

// ─── Domein: Persoonlijke groei ─────────────────────────────────────────────
// XP, level, achievements en je log-reeks. Alles bestond al in MentaForce
// (`/api/xp` op tabel `user_xp`, `/api/streak`) en werd in LifeOS nooit getoond.
//
// ── Over de reeks, want daar zit een regel op ───────────────────────────────
// `lib/lifeos/journal/journal.ts` verbiedt nadrukkelijk een streak — met een
// test erop. Die regel gaat over het JOURNAL: een teller op reflectie laat je
// schrijven om de teller te redden, niet omdat je iets te verwerken hebt.
//
// Deze reeks is een andere: hij telt je stemming-, slaap- en gewoonte-logs
// (zie `/api/streak`), niet je journal. Daarom staat er expliciet bij wát hij
// telt — zonder dat label zou hij naast de journal-kaart alsnog als
// reflectie-streak lezen, en dan had ik het dark pattern via een omweg terug
// ingebouwd. `berekenStreak` is zelf ook bewust vergevend: een dag waarop je nog
// niets logde is een open dag, geen breuk.
//
// Wat hier dus NIET staat: een teller op de journal-kaart eronder. Die houdt
// zijn eigen ene zin ("Gisteren schreef je niet. Geeft niet.").

interface GroeiData {
  /** `null` = je verdiende nog geen XP. Nooit 0 — dat is een score, dit is niets. */
  xp: number | null
  achievements: number
  /** `null` = de reeks was niet op te halen. Niet: "je reeks is 0". */
  streak: number | null
  maandPct: number | null
}

/** Narrowt `GET /api/xp`. Let op: die route stuurt letterlijk `null` als je nog geen XP-rij hebt. */
function leesXp(ruw: unknown): { xp: number | null; achievements: number } | null {
  // JSON `null` = geen rij in `user_xp` = je begon nog niet. Een geldig antwoord,
  // geen kapot antwoord — dus hier géén `return null`, want dat zou `haalJson`
  // als "onverwachte vorm" lezen en er een storing van maken.
  if (ruw === null) return { xp: null, achievements: 0 }
  if (!isObject(ruw)) return null

  const xp = getalOfNull(ruw.xp)
  if (xp === null) return null

  return { xp, achievements: Array.isArray(ruw.achievements) ? ruw.achievements.length : 0 }
}

/** Narrowt `GET /api/streak`. */
function leesStreak(ruw: unknown): { streak: number; maandPct: number | null } | null {
  if (!isObject(ruw)) return null
  const streak = getalOfNull(ruw.streak)
  if (streak === null) return null
  return { streak, maandPct: getalOfNull(ruw.maand_pct) }
}

async function haalGroei(): Promise<DomeinUitkomst<GroeiData>> {
  const [xp, streak] = await Promise.all([
    haalJson('/api/xp', leesXp),
    haalJson('/api/streak', leesStreak),
  ])

  // XP is dragend: zonder dat blok valt er over groei niets te zeggen. De reeks
  // mag wegvallen zonder het domein op storing te zetten.
  if (!xp.ok) return { ok: false, fout: xp.fout }

  return {
    ok: true,
    waarde: {
      xp: xp.waarde.xp,
      achievements: xp.waarde.achievements,
      streak: streak.ok ? streak.waarde.streak : null,
      maandPct: streak.ok ? streak.waarde.maandPct : null,
    },
  }
}

export function GroeiDomein() {
  const { staat, opnieuw } = useDomein(haalGroei)

  return (
    <DomeinSectie titel="Persoonlijke groei" definitie="Je level, je behaalde mijlpalen en hoe consequent je logt.">
      {staat.fase === 'laden' ? <DomeinSkelet statistieken={3} /> : null}
      {staat.fase === 'fout' ? <Foutmelding bericht={staat.bericht} opnieuw={opnieuw} /> : null}
      {staat.fase === 'ok' ? <Inhoud data={staat.data} /> : null}
    </DomeinSectie>
  )
}

function Inhoud({ data }: { data: GroeiData }) {
  // Geen XP = geen level. `berekenLevel(0)` geeft 1 ("Starter") terug, en dat
  // zou hier een niveau tonen dat Kane nooit heeft gehaald.
  const level = data.xp === null ? null : berekenLevel(data.xp)
  const voortgang = data.xp !== null && level !== null ? xpVoortgang(data.xp, level) : null

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <StatRij>
        <Stat
          waarde={level === null ? '—' : String(level)}
          naam={level === null ? 'Fit Level' : `Fit Level · ${LEVEL_NAMEN[level]}`}
          detail={data.xp === null ? 'nog geen XP verdiend' : `${data.xp} XP`}
          // Het merk-accent, niet LEVEL_KLEUREN: die lijst grijpt naar --mf-green
          // /--mf-purple, MentaForce's zeskleurenpalet. LifeOS is navy + cyaan.
          kleur={level === null ? undefined : 'var(--brand)'}
        />
        <Stat
          waarde={data.streak === null ? '—' : String(data.streak)}
          naam="Dagen op rij gelogd"
          // Zeggen wát er geteld wordt. Zonder deze regel leest dit naast de
          // journal-kaart als een reflectie-reeks, en dat is precies wat de
          // journal-regel verbiedt.
          detail={data.streak === null ? 'reeks niet opgehaald' : 'stemming, slaap of gewoontes'}
        />
        <Stat
          waarde={`${data.achievements}`}
          naam="Mijlpalen"
          detail={`van ${ALLE_ACHIEVEMENTS.length} behaald`}
        />
      </StatRij>

      {voortgang !== null && level !== null && level < 10 ? (
        <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.5 }}>
          Nog {voortgang.nodig} XP tot level {level + 1} · {LEVEL_NAMEN[level + 1]}.
        </p>
      ) : null}

      {data.maandPct !== null ? (
        <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.5 }}>
          Deze maand logde je op {data.maandPct}% van de dagen.
        </p>
      ) : null}
    </div>
  )
}
