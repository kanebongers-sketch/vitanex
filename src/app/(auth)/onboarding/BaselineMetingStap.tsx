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
import { useVertaling } from '@/lib/i18n/TaalProvider'

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
// De opties zelf gaan als data naar de AI-analyse en blijven Nederlands; wat de
// gebruiker ziet komt uit het woordenboek (zelfde volgorde, zie de *_SLEUTELS).
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

const GEWOONTE_SLEUTELS = ['zitten', 'water', 'cafeine', 'eten', 'scherm', 'roken', 'alcohol', 'ontbijt', 'kantEnKlaar']
const MOTIVATOR_SLEUTELS = ['energie', 'slapen', 'stress', 'afvallen', 'fitter', 'ouder', 'rustiger', 'productiever', 'pijn']

const SLAAP_DUUR_OPTIES = ['<5u', '5-6u', '6-7u', '7-8u', '8-9u', '>9u']
const SLAAP_DUUR_SLEUTELS = ['minder5', 'u5tot6', 'u6tot7', 'u7tot8', 'u8tot9', 'meer9']
const BEWEGING_OPTIES = ['0', '1', '2', '3', '4', '5+']

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
  const { t } = useVertaling()
  const SCHAAL_LABELS = [t('account.baseline.schaal.heelLaag'), t('account.baseline.schaal.laag'), t('account.baseline.schaal.gemiddeld'), t('account.baseline.schaal.goed'), t('account.baseline.schaal.heelGoed')]
  const FREQ_LABELS = [t('account.baseline.schaal.nooit'), t('account.baseline.schaal.zelden'), t('account.baseline.schaal.soms'), t('account.baseline.schaal.vaak'), t('account.baseline.schaal.bijnaAltijd')]
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
      <BlokKop Icon={Activity} titel={t('account.baseline.blok1Kop')} sub={t('account.baseline.blok1Sub')} />

      <VitaVeld label={t('account.baseline.energie')}>
        <VitaSchaal
          legenda={t('account.baseline.energieLegenda')}
          emojis={['😴', '😕', '😐', '😊', '⚡']}
          labels={SCHAAL_LABELS}
          waarde={meting.energie_niveau}
          onKies={v => setMeting(m => ({ ...m, energie_niveau: v }))}
        />
      </VitaVeld>
      <VitaVeld label={t('account.baseline.stemming')}>
        <VitaSchaal
          legenda={t('account.baseline.stemmingLegenda')}
          emojis={['😞', '😔', '😐', '🙂', '😄']}
          labels={SCHAAL_LABELS}
          waarde={meting.stemming}
          onKies={v => setMeting(m => ({ ...m, stemming: v }))}
        />
      </VitaVeld>
      <VitaVeld label={t('account.baseline.plezier')}>
        <VitaSchaal
          legenda={t('account.baseline.plezierLegenda')}
          emojis={['😶', '😕', '😐', '😊', '🤩']}
          labels={SCHAAL_LABELS}
          waarde={meting.interesse_plezier}
          onKies={v => setMeting(m => ({ ...m, interesse_plezier: v }))}
        />
      </VitaVeld>
      <VitaVeld label={t('account.baseline.lichaam')}>
        <VitaSchaal
          legenda={t('account.baseline.lichaamLegenda')}
          emojis={['🥵', '😮‍💨', '😐', '💪', '🔥']}
          labels={SCHAAL_LABELS}
          waarde={meting.lichaam_gevoel}
          onKies={v => setMeting(m => ({ ...m, lichaam_gevoel: v }))}
        />
      </VitaVeld>

      <BlokKop Icon={Moon} titel={t('account.baseline.blok2Kop')} sub={t('account.baseline.blok2Sub')} />

      <VitaVeld label={t('account.baseline.slaap')}>
        <VitaSchaal
          legenda={t('account.baseline.slaapLegenda')}
          emojis={['😫', '😕', '😐', '😊', '🤩']}
          labels={SCHAAL_LABELS}
          waarde={meting.slaap_kwaliteit}
          onKies={v => setMeting(m => ({ ...m, slaap_kwaliteit: v }))}
        />
      </VitaVeld>
      <VitaVeld label={t('account.baseline.slaapDuur')}>
        <VitaChips
          legenda={t('account.baseline.slaapDuurLegenda')}
          opties={SLAAP_DUUR_OPTIES}
          labels={SLAAP_DUUR_SLEUTELS.map(k => t(`account.baseline.slaapDuurOpties.${k}`))}
          geselecteerd={meting.slaap_duur}
          onToggle={(_, i) => setMeting(m => ({ ...m, slaap_duur: i }))}
        />
      </VitaVeld>
      <VitaVeld label={t('account.baseline.slaperig')}>
        <VitaSchaal
          legenda={t('account.baseline.slaperigLegenda')}
          emojis={['🚫', '🙂', '😐', '😪', '😴']}
          labels={[t('account.baseline.schaal.nooit'), t('account.baseline.schaal.zelden'), t('account.baseline.schaal.soms'), t('account.baseline.schaal.vaak'), t('account.baseline.schaal.constant')]}
          waarde={meting.slaperigheid_overdag}
          onKies={v => setMeting(m => ({ ...m, slaperigheid_overdag: v }))}
        />
      </VitaVeld>

      <BlokKop Icon={ShieldCheck} titel={t('account.baseline.blok3Kop')} sub={t('account.baseline.blok3Sub')} />

      <VitaVeld label={t('account.baseline.controle')}>
        <VitaSchaal
          legenda={t('account.baseline.controleLegenda')}
          emojis={['😟', '😕', '😐', '🙂', '😌']}
          labels={FREQ_LABELS}
          waarde={meting.stress_controle}
          onKies={v => setMeting(m => ({ ...m, stress_controle: v }))}
        />
      </VitaVeld>
      <VitaVeld label={t('account.baseline.overweldigd')}>
        <VitaSchaal
          legenda={t('account.baseline.overweldigdLegenda')}
          emojis={['🚫', '😕', '😐', '😓', '😵']}
          labels={FREQ_LABELS}
          waarde={meting.stress_overweldigd}
          onKies={v => setMeting(m => ({ ...m, stress_overweldigd: v }))}
        />
      </VitaVeld>
      <VitaVeld label={t('account.baseline.herstel')}>
        <VitaSchaal
          legenda={t('account.baseline.herstelLegenda')}
          emojis={['🚫', '😕', '😐', '😊', '🧘']}
          labels={FREQ_LABELS}
          waarde={meting.herstel_ontspanning}
          onKies={v => setMeting(m => ({ ...m, herstel_ontspanning: v }))}
        />
      </VitaVeld>

      <BlokKop Icon={Leaf} titel={t('account.baseline.blok4Kop')} sub={t('account.baseline.blok4Sub')} />

      <VitaVeld label={t('account.baseline.beweging')}>
        <VitaChips
          legenda={t('account.baseline.bewegingLegenda')}
          opties={BEWEGING_OPTIES}
          geselecteerd={meting.beweging_dagen}
          onToggle={(_, i) => setMeting(m => ({ ...m, beweging_dagen: i }))}
        />
      </VitaVeld>
      <VitaVeld label={t('account.baseline.voeding')}>
        <VitaSchaal
          legenda={t('account.baseline.voedingLegenda')}
          emojis={['🍔', '🍕', '😐', '🥙', '🥗']}
          labels={SCHAAL_LABELS}
          waarde={meting.voeding_kwaliteit}
          onKies={v => setMeting(m => ({ ...m, voeding_kwaliteit: v }))}
        />
      </VitaVeld>
      <VitaVeld label={t('account.baseline.gewoontes')} sub={t('account.baseline.gewoontesSub')}>
        <VitaChips
          legenda={t('account.baseline.gewoontesLegenda')}
          opties={GEWOONTE_OPTIES}
          labels={GEWOONTE_SLEUTELS.map(k => t(`account.baseline.gewoonte.${k}`))}
          geselecteerd={meting.gewoontes}
          onToggle={toggleGewoonte}
          multi
        />
      </VitaVeld>
      <VitaVeld
        label={t('account.baseline.reden')}
        sub={t('account.baseline.redenSub', { aantal: meting.motivatoren.length })}
      >
        <VitaChips
          legenda={t('account.baseline.redenLegenda')}
          opties={MOTIVATOR_OPTIES}
          labels={MOTIVATOR_SLEUTELS.map(k => t(`account.baseline.motivator.${k}`))}
          geselecteerd={meting.motivatoren}
          onToggle={toggleMotivator}
          multi
          max={3}
        />
      </VitaVeld>
      <VitaVeld label={t('account.baseline.vertrouwen')}>
        <VitaSchaal
          legenda={t('account.baseline.vertrouwenLegenda')}
          emojis={['😟', '😕', '😐', '🙂', '💪']}
          labels={[t('account.baseline.schaal.heelWeinig'), t('account.baseline.schaal.weinig'), t('account.baseline.schaal.redelijk'), t('account.baseline.schaal.veel'), t('account.baseline.schaal.heelVeel')]}
          waarde={meting.zelfvertrouwen_verandering}
          onKies={v => setMeting(m => ({ ...m, zelfvertrouwen_verandering: v }))}
        />
      </VitaVeld>

      {!kanVerder && (
        <p style={{ fontSize: 12.5, color: 'var(--text-3)', textAlign: 'center' }}>
          {t('account.baseline.eersteTwee')}
        </p>
      )}

      <GesprekKnoppen
        onTerug={onTerug}
        onVolgende={onVolgende}
        volgendeLabel={bezig ? t('account.baseline.denkt') : t('account.baseline.analyseer')}
        volgendeDisabled={!kanVerder || bezig}
        bezig={bezig}
        overslaan={{ onClick: onSlaan, label: t('account.baseline.overslaan') }}
      />
    </div>
  )
}
