'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { TabsContent } from '@/components/ui/Tabs'
import { CollapsibleRoot, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/Collapsible'
import { useVertaling } from '@/lib/i18n/TaalProvider'
import { maakKennis, type Intensiteit, type KennisTip } from './kennis-data'

// Labels: mentaal.kennis.intensiteit.<niveau>.
const INTENSITEIT_STIJL: Record<Intensiteit, { bg: string; kleur: string }> = {
  laag: { bg: 'var(--mf-green-light)', kleur: 'var(--mf-green-dark)' },
  gemiddeld: { bg: 'var(--mf-amber-light)', kleur: 'var(--mf-amber-dark)' },
  hoog: { bg: 'var(--mf-red-light)', kleur: 'var(--mf-red)' },
}

function IntensiteitLabel({ niveau }: { niveau: Intensiteit }) {
  const { t } = useVertaling()
  const stijl = INTENSITEIT_STIJL[niveau]
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: stijl.bg, color: stijl.kleur }}>
      {t(`mentaal.kennis.intensiteit.${niveau}`)}
    </span>
  )
}

function IntroKaart({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border p-4 mb-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <p className="text-sm" style={{ color: 'var(--text-2)' }}>{children}</p>
    </div>
  )
}

function SectieKaart({ label, className = '', children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <div className={`rounded-2xl border p-5 ${className}`} style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-4)' }}>{label}</p>
      {children}
    </div>
  )
}

interface AccordionKaartProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  afk: string
  accentKleur?: string
  titel: string
  sub: string
  extra?: ReactNode
  children: ReactNode
}

function AccordionKaart({ open, onOpenChange, afk, accentKleur, titel, sub, extra, children }: AccordionKaartProps) {
  return (
    <CollapsibleRoot open={open} onOpenChange={onOpenChange} className="rounded-2xl border overflow-hidden mf-collapsible-card">
      <CollapsibleTrigger asChild>
        <button type="button" className="mf-acc-trigger w-full px-5 py-4 flex items-center gap-4 text-left transition">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={accentKleur
              ? { background: `color-mix(in srgb, ${accentKleur} 12%, transparent)`, color: accentKleur }
              : { background: 'var(--bg-subtle)', color: 'var(--text-3)' }}
          >
            {afk}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{titel}</p>
            <p className="text-xs" style={{ color: 'var(--text-4)' }}>{sub}</p>
          </div>
          {extra}
          <span className="ml-1" style={{ color: 'var(--text-3)' }}>
            {open ? <ChevronUp size={14} aria-hidden /> : <ChevronDown size={14} aria-hidden />}
          </span>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>{children}</CollapsibleContent>
    </CollapsibleRoot>
  )
}

function StappenLijst({ stappen, badgeStijl }: { stappen: string[]; badgeStijl: { background: string; color: string } }) {
  return (
    <ol className="space-y-2">
      {stappen.map((stap, i) => (
        <li key={stap} className="flex gap-3 items-start">
          <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5" style={badgeStijl}>
            {i + 1}
          </span>
          <p className="text-sm" style={{ color: 'var(--text-2)' }}>{stap}</p>
        </li>
      ))}
    </ol>
  )
}

function TipLijst({ tips }: { tips: KennisTip[] }) {
  return (
    <div style={{ borderTop: '1px solid var(--border)' }}>
      {tips.map(tip => (
        <div key={tip.titel} className="mf-divider-row px-5 py-4">
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-1)' }}>{tip.titel}</p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>{tip.tekst}</p>
        </div>
      ))}
    </div>
  )
}

/**
 * De vier kennistabs (Beweging, Voeding, Slaap, Mentaal). Presentational —
 * puur statische inhoud uit kennis-data.ts, met lokale open/dicht-state voor
 * de accordions. Blijft gemonteerd naast de actieve tab, dus open-state
 * overleeft het wisselen van hoofdtab (zoals voorheen).
 */
export default function KennisSecties() {
  const { t } = useVertaling()
  const kennis = useMemo(() => maakKennis(t), [t])
  const [openOefening, setOpenOefening] = useState<number | null>(null)
  const [openVoedingCat, setOpenVoedingCat] = useState<number | null>(0)
  const [openSlaapSectie, setOpenSlaapSectie] = useState<number | null>(0)
  const [openTechniek, setOpenTechniek] = useState<number | null>(null)

  return (
    <>
      {/* -------------- BEWEGING -------------- */}
      <TabsContent value="beweging" style={{ paddingTop: 0 }}>
        <IntroKaart>
          {t('mentaal.kennis.bewegingIntroVoor')} <strong>{t('mentaal.kennis.bewegingIntroNadruk')}</strong> {t('mentaal.kennis.bewegingIntroNa')}
        </IntroKaart>

        <div className="flex flex-wrap gap-2 mb-4">
          {(Object.keys(INTENSITEIT_STIJL) as Intensiteit[]).map(niveau => {
            const stijl = INTENSITEIT_STIJL[niveau]
            const aantal = kennis.bureauoefeningen.filter(oe => oe.intensiteit === niveau).length
            return (
              <span key={niveau} className="text-xs px-3 py-1.5 rounded-full font-medium" style={{ background: stijl.bg, color: stijl.kleur }}>
                {t('mentaal.kennis.intensiteitAantal', { label: t(`mentaal.kennis.intensiteit.${niveau}`), aantal })}
              </span>
            )
          })}
        </div>

        <div className="space-y-3">
          {kennis.bureauoefeningen.map((oe, idx) => (
            <AccordionKaart
              key={oe.naam}
              open={openOefening === idx}
              onOpenChange={(o) => setOpenOefening(o ? idx : null)}
              afk={oe.afk}
              titel={oe.naam}
              sub={t('mentaal.kennis.subStappen', { duur: oe.duur, aantal: oe.stappen.length })}
              extra={<IntensiteitLabel niveau={oe.intensiteit} />}
            >
              <div className="px-5 pb-5" style={{ borderTop: '1px solid var(--border)' }}>
                <p className="text-xs italic mt-3 mb-3" style={{ color: 'var(--text-3)' }}>{oe.waarom}</p>
                <StappenLijst stappen={oe.stappen} badgeStijl={{ background: 'var(--mentaforce-primary-light)', color: 'var(--mentaforce-primary)' }} />
              </div>
            </AccordionKaart>
          ))}
        </div>

        <SectieKaart label={t('mentaal.kennis.schemaTitel')} className="mt-5">
          {kennis.bewegingsschema.map(rij => (
            <div key={rij.tijd} className="mf-divider-row flex gap-3 items-center py-2">
              <span className="text-xs font-bold w-12 flex-shrink-0" style={{ color: 'var(--text-4)' }}>{rij.tijd}</span>
              <p className="text-sm" style={{ color: 'var(--text-2)' }}>{rij.actie}</p>
            </div>
          ))}
        </SectieKaart>
      </TabsContent>

      {/* -------------- VOEDING -------------- */}
      <TabsContent value="voeding" style={{ paddingTop: 0 }}>
        <IntroKaart>
          {t('mentaal.kennis.voedingIntro')}
        </IntroKaart>

        <div className="space-y-3">
          {kennis.voedingCategorieen.map((cat, idx) => (
            <AccordionKaart
              key={cat.titel}
              open={openVoedingCat === idx}
              onOpenChange={(o) => setOpenVoedingCat(o ? idx : null)}
              afk={cat.afk}
              accentKleur={cat.kleur}
              titel={cat.titel}
              sub={t('mentaal.kennis.subTips', { aantal: cat.tips.length })}
            >
              <TipLijst tips={cat.tips} />
            </AccordionKaart>
          ))}
        </div>

        <SectieKaart label={t('mentaal.kennis.dagritmeTitel')} className="mt-5">
          {kennis.voedingDagritme.map(blok => (
            <div key={blok.tijd} className="mb-4 last:mb-0">
              <p className="text-xs font-bold mb-2" style={{ color: blok.kleur }}>{blok.tijd}</p>
              {blok.items.map(item => (
                <div key={item} className="flex items-center gap-2 py-1">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: blok.kleur }} />
                  <p className="text-sm" style={{ color: 'var(--text-2)' }}>{item}</p>
                </div>
              ))}
            </div>
          ))}
        </SectieKaart>
      </TabsContent>

      {/* -------------- SLAAP -------------- */}
      <TabsContent value="slaap" style={{ paddingTop: 0 }}>
        <div className="grid grid-cols-3 gap-3 mb-5">
          {kennis.slaapFeiten.map(feit => (
            <div key={feit.label} className="rounded-2xl border p-4 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <p className="text-sm font-bold mb-0.5" style={{ color: feit.kleur }}>{feit.waarde}</p>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>{feit.label}</p>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          {kennis.slaapSecties.map((sectie, idx) => (
            <AccordionKaart
              key={sectie.titel}
              open={openSlaapSectie === idx}
              onOpenChange={(o) => setOpenSlaapSectie(o ? idx : null)}
              afk={sectie.afk}
              accentKleur={sectie.kleur}
              titel={sectie.titel}
              sub={t('mentaal.kennis.subTips', { aantal: sectie.items.length })}
            >
              <TipLijst tips={sectie.items} />
            </AccordionKaart>
          ))}
        </div>

        <SectieKaart label={t('mentaal.kennis.winddownTitel')} className="mt-5">
          {kennis.winddownRoutine.map(stap => (
            <div key={stap.tijd} className="mf-divider-row flex gap-3 items-start py-2">
              <span className="text-xs font-bold w-16 flex-shrink-0 mt-0.5" style={{ color: stap.kleur }}>{stap.tijd}</span>
              <p className="text-sm" style={{ color: 'var(--text-2)' }}>{stap.actie}</p>
            </div>
          ))}
        </SectieKaart>
      </TabsContent>

      {/* -------------- MENTAAL -------------- */}
      <TabsContent value="mentaal" style={{ paddingTop: 0 }}>
        <IntroKaart>
          {t('mentaal.kennis.mentaalIntro')}
        </IntroKaart>

        <div className="space-y-3">
          {kennis.mentaalTechnieken.map((tech, idx) => (
            <AccordionKaart
              key={tech.naam}
              open={openTechniek === idx}
              onOpenChange={(o) => setOpenTechniek(o ? idx : null)}
              afk={tech.afk}
              accentKleur={tech.kleur}
              titel={tech.naam}
              sub={t('mentaal.kennis.subStappen', { duur: tech.duur, aantal: tech.stappen.length })}
              extra={
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `color-mix(in srgb, ${tech.kleur} 12%, transparent)`, color: tech.kleur }}>
                  {tech.duur}
                </span>
              }
            >
              <div className="px-5 pb-5" style={{ borderTop: '1px solid var(--border)' }}>
                <p className="text-xs italic mt-3 mb-3" style={{ color: 'var(--text-3)' }}>{tech.beschrijving}</p>
                <StappenLijst stappen={tech.stappen} badgeStijl={{ background: `color-mix(in srgb, ${tech.kleur} 12%, transparent)`, color: tech.kleur }} />
              </div>
            </AccordionKaart>
          ))}
        </div>

        <SectieKaart label={t('mentaal.kennis.signalenTitel')} className="mt-5">
          <p className="text-xs mb-3" style={{ color: 'var(--text-4)' }}>{t('mentaal.kennis.signalenIntro')}</p>
          <div className="grid grid-cols-2 gap-2">
            {kennis.stressSignalen.map(signaal => (
              <div key={signaal} className="flex items-center gap-2 py-1.5">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--mf-red)' }} />
                <p className="text-xs" style={{ color: 'var(--text-2)' }}>{signaal}</p>
              </div>
            ))}
          </div>
        </SectieKaart>
      </TabsContent>
    </>
  )
}
