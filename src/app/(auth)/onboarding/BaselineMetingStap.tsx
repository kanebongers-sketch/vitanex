'use client'

// ════════════════════════════════════════════════════════════════════════════
// BaselineMetingStap — 15 baseline-vragen verdeeld over 4 blokken.
// Onderdeel van het Vita-intakegesprek: Vita stelt de vragen, de gebruiker
// antwoordt via branded schalen en chips (navy + cyan, tokens uit globals.css).
// Exporteert: BaselineMetingStap (component), BaselineMeting (type), LEGE_BASELINE.
// ════════════════════════════════════════════════════════════════════════════

import { type Dispatch, type SetStateAction } from 'react'
import { Activity, Moon, ShieldCheck, Leaf } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { VitaVeld, VitaChips, VitaSchaal, GesprekKnoppen } from './VitaKeuze'

// ─── Types ────────────────────────────────────────────────────────────────────
export interface BaselineMeting {
  energie_niveau: number | null
  stemming: number | null
  interesse_plezier: number | null
  lichaam_gevoel: number | null
  slaap_kwaliteit: number | null
  slaap_duur: number | null
  slaperigheid_overdag: number | null
  stress_controle: number | null
  stress_overweldigd: number | null
  herstel_ontspanning: number | null
  beweging_dagen: number | null
  voeding_kwaliteit: number | null
  gewoontes: string[]
  motivatoren: string[]
  zelfvertrouwen_verandering: number | null
}

export const LEGE_BASELINE: BaselineMeting = {
  energie_niveau: null,
  stemming: null,
  interesse_plezier: null,
  lichaam_gevoel: null,
  slaap_kwaliteit: null,
  slaap_duur: null,
  slaperigheid_overdag: null,
  stress_controle: null,
  stress_overweldigd: null,
  herstel_ontspanning: null,
  beweging_dagen: null,
  voeding_kwaliteit: null,
  gewoontes: [],
  motivatoren: [],
  zelfvertrouwen_verandering: null,
}

// ─── Constanten ───────────────────────────────────────────────────────────────
const GEWOONTE_OPTIES = [
  'Veel zitten', 'Weinig water', 'Veel cafeïne', 'Onregelmatig eten',
  'Veel schermtijd voor slaap', 'Roken', 'Alcohol meerdere keren/week',
  'Skip ontbijt', 'Snelle/kant-en-klaar maaltijden',
]

const MOTIVATOR_OPTIES = [
  'Meer energie', 'Beter slapen', 'Minder stress', 'Afvallen',
  'Fitter/sterker', 'Gezonder ouder worden', 'Mentaal rustiger',
  'Productiever op werk', 'Pijn/klachten verminderen',
]

const SLAAP_DUUR_OPTIES = ['<5u', '5-6u', '6-7u', '7-8u', '8-9u', '>9u']
const BEWEGING_OPTIES = ['0', '1', '2', '3', '4', '5+']

const SCHAAL_LABELS = ['Heel laag', 'Laag', 'Gemiddeld', 'Goed', 'Heel goed']

// ─── Blok-kop met lucide-icoon (geen emoji) ───────────────────────────────────
function BlokKop({ Icon, titel, sub }: { Icon: LucideIcon; titel: string; sub: string }) {
  return (
    <div style={{ marginTop: 4, marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3 }}>
        <span
          aria-hidden
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 30, height: 30, borderRadius: 9,
            background: 'var(--mentaforce-primary-light)', color: 'var(--mentaforce-primary)',
          }}
        >
          <Icon size={16} strokeWidth={1.75} />
        </span>
        <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>{titel}</p>
      </div>
      <p style={{ fontSize: 12.5, color: 'var(--text-3)', paddingLeft: 40 }}>{sub}</p>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// Hoofd component
// ════════════════════════════════════════════════════════════════════════════
export function BaselineMetingStap({
  meting, setMeting, onVolgende, onTerug, onSlaan, bezig,
}: {
  meting: BaselineMeting
  setMeting: Dispatch<SetStateAction<BaselineMeting>>
  onVolgende: () => void
  onTerug: () => void
  onSlaan: () => void
  bezig: boolean
}) {
  const blok1Ingevuld =
    meting.energie_niveau !== null &&
    meting.stemming !== null &&
    meting.interesse_plezier !== null &&
    meting.lichaam_gevoel !== null

  const blok2Ingevuld =
    meting.slaap_kwaliteit !== null &&
    meting.slaap_duur !== null &&
    meting.slaperigheid_overdag !== null

  const kanVerder = blok1Ingevuld && blok2Ingevuld

  function toggleGewoonte(opt: string) {
    setMeting(m => ({
      ...m,
      gewoontes: m.gewoontes.includes(opt)
        ? m.gewoontes.filter(g => g !== opt)
        : [...m.gewoontes, opt],
    }))
  }

  function toggleMotivator(opt: string) {
    setMeting(m => {
      if (m.motivatoren.includes(opt)) {
        return { ...m, motivatoren: m.motivatoren.filter(v => v !== opt) }
      }
      if (m.motivatoren.length >= 3) return m
      return { ...m, motivatoren: [...m.motivatoren, opt] }
    })
  }

  return (
    <div className="mf-animate-up" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <BlokKop Icon={Activity} titel="Hoe voel je je?" sub="Denk aan de afgelopen 2 weken, gemiddeld" />

      <VitaVeld label="Hoeveel energie had je gemiddeld?">
        <VitaSchaal
          legenda="Energie de afgelopen 2 weken"
          emojis={['😴', '😕', '😐', '😊', '⚡']}
          labels={SCHAAL_LABELS}
          waarde={meting.energie_niveau}
          onKies={v => setMeting(m => ({ ...m, energie_niveau: v }))}
        />
      </VitaVeld>
      <VitaVeld label="Hoe was je stemming?">
        <VitaSchaal
          legenda="Stemming de afgelopen 2 weken"
          emojis={['😞', '😔', '😐', '🙂', '😄']}
          labels={SCHAAL_LABELS}
          waarde={meting.stemming}
          onKies={v => setMeting(m => ({ ...m, stemming: v }))}
        />
      </VitaVeld>
      <VitaVeld label="Had je plezier in dingen die je normaal leuk vindt?">
        <VitaSchaal
          legenda="Plezier de afgelopen 2 weken"
          emojis={['😶', '😕', '😐', '😊', '🤩']}
          labels={SCHAAL_LABELS}
          waarde={meting.interesse_plezier}
          onKies={v => setMeting(m => ({ ...m, interesse_plezier: v }))}
        />
      </VitaVeld>
      <VitaVeld label="Hoe voelt je lichaam zich fysiek? (uitgeput → fit)">
        <VitaSchaal
          legenda="Lichaamsgevoel de afgelopen 2 weken"
          emojis={['🥵', '😮‍💨', '😐', '💪', '🔥']}
          labels={SCHAAL_LABELS}
          waarde={meting.lichaam_gevoel}
          onKies={v => setMeting(m => ({ ...m, lichaam_gevoel: v }))}
        />
      </VitaVeld>

      <BlokKop Icon={Moon} titel="Slaap & herstel" sub="De basis onder alles" />

      <VitaVeld label="Hoe goed slaap je doorgaans?">
        <VitaSchaal
          legenda="Slaapkwaliteit"
          emojis={['😫', '😕', '😐', '😊', '🤩']}
          labels={SCHAAL_LABELS}
          waarde={meting.slaap_kwaliteit}
          onKies={v => setMeting(m => ({ ...m, slaap_kwaliteit: v }))}
        />
      </VitaVeld>
      <VitaVeld label="Hoeveel uur slaap je gemiddeld per nacht?">
        <VitaChips
          legenda="Slaapduur per nacht"
          opties={SLAAP_DUUR_OPTIES}
          geselecteerd={meting.slaap_duur}
          onToggle={(_, i) => setMeting(m => ({ ...m, slaap_duur: i }))}
        />
      </VitaVeld>
      <VitaVeld label="Val je overdag soms ongewild in slaap of vecht je tegen vermoeidheid?">
        <VitaSchaal
          legenda="Slaperigheid overdag"
          emojis={['🚫', '🙂', '😐', '😪', '😴']}
          labels={['Nooit', 'Zelden', 'Soms', 'Vaak', 'Constant']}
          waarde={meting.slaperigheid_overdag}
          onKies={v => setMeting(m => ({ ...m, slaperigheid_overdag: v }))}
        />
      </VitaVeld>

      <BlokKop Icon={ShieldCheck} titel="Stress & veerkracht" sub="De afgelopen 2 weken" />

      <VitaVeld label="Hoe vaak had je het gevoel de belangrijke dingen onder controle te hebben?">
        <VitaSchaal
          legenda="Gevoel van controle"
          emojis={['😟', '😕', '😐', '🙂', '😌']}
          labels={['Nooit', 'Zelden', 'Soms', 'Vaak', 'Bijna altijd']}
          waarde={meting.stress_controle}
          onKies={v => setMeting(m => ({ ...m, stress_controle: v }))}
        />
      </VitaVeld>
      <VitaVeld label="Hoe vaak stapelden problemen zich zo op dat je ze niet de baas kon?">
        <VitaSchaal
          legenda="Overweldiging"
          emojis={['🚫', '😕', '😐', '😓', '😵']}
          labels={['Nooit', 'Zelden', 'Soms', 'Vaak', 'Bijna altijd']}
          waarde={meting.stress_overweldigd}
          onKies={v => setMeting(m => ({ ...m, stress_overweldigd: v }))}
        />
      </VitaVeld>
      <VitaVeld label="Lukt het je om écht te ontspannen en te herstellen op een dag?">
        <VitaSchaal
          legenda="Herstel en ontspanning"
          emojis={['🚫', '😕', '😐', '😊', '🧘']}
          labels={['Nooit', 'Zelden', 'Soms', 'Vaak', 'Bijna altijd']}
          waarde={meting.herstel_ontspanning}
          onKies={v => setMeting(m => ({ ...m, herstel_ontspanning: v }))}
        />
      </VitaVeld>

      <BlokKop Icon={Leaf} titel="Leefstijl & gedrag" sub="Wat doe je al?" />

      <VitaVeld label="Op hoeveel dagen per week beweeg je intensief? (zweten / buiten adem)">
        <VitaChips
          legenda="Dagen intensief bewegen per week"
          opties={BEWEGING_OPTIES}
          geselecteerd={meting.beweging_dagen}
          onToggle={(_, i) => setMeting(m => ({ ...m, beweging_dagen: i }))}
        />
      </VitaVeld>
      <VitaVeld label="Hoe gezond eet je doorgaans?">
        <VitaSchaal
          legenda="Voedingskwaliteit"
          emojis={['🍔', '🍕', '😐', '🥙', '🥗']}
          labels={SCHAAL_LABELS}
          waarde={meting.voeding_kwaliteit}
          onKies={v => setMeting(m => ({ ...m, voeding_kwaliteit: v }))}
        />
      </VitaVeld>
      <VitaVeld label="Wat speelt nu mee in jouw dag?" sub="Kies wat past — mag meerdere zijn">
        <VitaChips
          legenda="Gewoontes die meespelen"
          opties={GEWOONTE_OPTIES}
          geselecteerd={meting.gewoontes}
          onToggle={toggleGewoonte}
          multi
        />
      </VitaVeld>
      <VitaVeld
        label="Wat is voor jou de belangrijkste reden om hiermee bezig te zijn?"
        sub={`Kies maximaal 3 (${meting.motivatoren.length}/3)`}
      >
        <VitaChips
          legenda="Jouw motivatoren"
          opties={MOTIVATOR_OPTIES}
          geselecteerd={meting.motivatoren}
          onToggle={toggleMotivator}
          multi
          max={3}
        />
      </VitaVeld>
      <VitaVeld label="Hoeveel vertrouwen heb je dat je dit kunt volhouden?">
        <VitaSchaal
          legenda="Zelfvertrouwen in verandering"
          emojis={['😟', '😕', '😐', '🙂', '💪']}
          labels={['Heel weinig', 'Weinig', 'Redelijk', 'Veel', 'Heel veel']}
          waarde={meting.zelfvertrouwen_verandering}
          onKies={v => setMeting(m => ({ ...m, zelfvertrouwen_verandering: v }))}
        />
      </VitaVeld>

      {!kanVerder && (
        <p style={{ fontSize: 12.5, color: 'var(--text-3)', textAlign: 'center' }}>
          Vul de eerste twee blokken volledig in om verder te gaan
        </p>
      )}

      <GesprekKnoppen
        onTerug={onTerug}
        onVolgende={onVolgende}
        volgendeLabel={bezig ? 'Vita denkt na…' : 'Analyseer mijn startfoto'}
        volgendeDisabled={!kanVerder || bezig}
        bezig={bezig}
        overslaan={{ onClick: onSlaan, label: 'Sla deze vragen over' }}
      />
    </div>
  )
}
