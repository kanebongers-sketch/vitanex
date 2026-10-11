'use client'

import type { ReactNode } from 'react'
import { Check, X, Flame, Pencil } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import {
  type WeekDoel, vandaag, isVandaagGelogd, logVandaag, berekenStreak,
} from '@/lib/doelen/weekdoelen'
import { useVertaling } from '@/lib/i18n/TaalProvider'
import { INTL_LOCALE, type Taal } from '@/lib/i18n/talen'

/** Structureel gelijk aan de entries van CAT in @/lib/doelen/doelen-config. */
export interface CatInfo {
  label: string
  kleur: string
  bg: string
  licht: string
  icon: ReactNode
}

/** Korte dagnaam via Intl (nl: 'ma', 'di', ...). */
function dagLetters(dag: string, taal: Taal): string {
  const kort = new Date(`${dag}T12:00:00`).toLocaleDateString(INTL_LOCALE[taal], { weekday: 'short' }).replace('.', '')
  return taal === 'nl' ? kort.slice(0, 2) : kort
}

interface DoelKaartProps {
  doel: WeekDoel
  cat: CatInfo
  weekDagen: string[]
  /** Eerste nog-niet-gelogde doel van vandaag — springt eruit als volgende stap. */
  isVolgendeStap: boolean
  /** Zojuist afgevinkt in deze sessie — speelt de kleine check-pop. */
  netGelogd: boolean
  /** Weekdoel zojuist behaald (7/7) — badge verschijnt met zachte fade. */
  netBehaald: boolean
  /**
   * Hoe vaak dit doel vórige week gehaald is — alleen doorgegeven als hetzelfde
   * doel toen ook bestond én er echte historie is. undefined = geen vergelijking tonen.
   */
  vorigeWeekGehaald?: number
  onLog: (doel: WeekDoel, gehaald: boolean) => void
  onDetails: (doel: WeekDoel) => void
}

/** Weektrack: 7 dagcellen met daglabel; vandaag krijgt een gestippelde rand zolang er niet gelogd is. */
function WeekTrack({ doel, cat, weekDagen, gelogd, vorigeWeekGehaald }: {
  doel: WeekDoel; cat: CatInfo; weekDagen: string[]; gelogd: boolean; vorigeWeekGehaald?: number
}) {
  const { t, taal } = useVertaling()
  const aantalGehaald = weekDagen.filter(dag => doel.logs.find(l => l.datum === dag)?.gehaald === true).length
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: 'var(--text-4)' }}>{t('vita.doelen.dezeWeek')}</span>
        <span style={{ fontSize: 11, fontVariantNumeric: 'tabular-nums' }}>
          {/* Feitelijke week-op-week-referentie — gedempt, zonder oordeel.
              Alleen aanwezig als dit doel vorige week ook bestond. */}
          {vorigeWeekGehaald !== undefined && (
            <span style={{ color: 'var(--text-4)', fontWeight: 500 }}>{t('vita.doelen.vorigeWeek', { aantal: vorigeWeekGehaald })} · </span>
          )}
          <span style={{ fontWeight: 700, color: cat.kleur }}>{t('vita.doelen.dagenVanZeven', { aantal: aantalGehaald })}</span>
        </span>
      </div>
      <div style={{ display: 'flex', gap: 3 }} role="img" aria-label={t('vita.doelen.weekTrackLabel', { aantal: aantalGehaald })}>
        {weekDagen.map((dag) => {
          const log = doel.logs.find(l => l.datum === dag)
          const isVandaagDag = dag === vandaag()
          const vulling = log?.gehaald === true
            ? cat.kleur
            : log?.gehaald === false
              ? 'color-mix(in srgb, var(--text-4) 26%, transparent)'
              : 'var(--bg-subtle)'
          return (
            <div key={dag} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <div style={{
                width: '100%', height: 18, borderRadius: 4, boxSizing: 'border-box',
                background: vulling,
                border: isVandaagDag && !gelogd ? `1.5px dashed ${cat.kleur}` : '1px solid transparent',
              }} />
              <span aria-hidden style={{
                fontSize: 9, letterSpacing: '0.05em', textTransform: 'uppercase',
                fontWeight: isVandaagDag ? 700 : 500,
                color: isVandaagDag ? 'var(--text-2)' : 'var(--text-4)',
              }}>
                {dagLetters(dag, taal)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function DoelKaart({
  doel, cat, weekDagen, isVolgendeStap, netGelogd, netBehaald, vorigeWeekGehaald, onLog, onDetails,
}: DoelKaartProps) {
  const { t } = useVertaling()
  const gelogd = isVandaagGelogd(doel)
  const gehaaldVandaag = logVandaag(doel)?.gehaald === true
  const streak = berekenStreak(doel, weekDagen)
  const aantalGehaald = weekDagen.filter(dag => doel.logs.find(l => l.datum === dag)?.gehaald === true).length
  const weekBehaald = aantalGehaald >= 7

  const randKleur = gelogd
    ? `color-mix(in srgb, ${cat.kleur} 38%, transparent)`
    : isVolgendeStap
      ? 'color-mix(in srgb, var(--mentaforce-primary) 45%, transparent)'
      : 'var(--border)'

  return (
    <Card className="mf-doel-kaart" style={{
      borderRadius: 20,
      border: `2px solid ${randKleur}`,
      padding: '22px 22px 20px',
      boxShadow: gelogd
        ? `0 4px 20px color-mix(in srgb, ${cat.kleur} 12%, transparent)`
        : 'var(--shadow-card)',
      display: 'flex', flexDirection: 'column', gap: 14,
    }}>
      {/* Vlak badge + status rechts */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: cat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cat.kleur }}>
            {cat.icon}
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: cat.kleur }}>{cat.label}</span>
        </div>
        {gelogd ? (
          <div
            className={netGelogd ? 'mf-doel-pop' : undefined}
            style={{
              width: 26, height: 26, borderRadius: '50%',
              background: gehaaldVandaag ? cat.kleur : 'var(--bg-subtle)',
              border: `2px solid ${gehaaldVandaag ? cat.kleur : 'var(--border)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: gehaaldVandaag ? 'var(--bg-app)' : 'var(--text-3)',
            }}
          >
            {gehaaldVandaag
              ? <Check size={12} strokeWidth={3} aria-hidden />
              : <X size={12} strokeWidth={3} aria-hidden />}
          </div>
        ) : isVolgendeStap ? (
          <span style={{
            fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em',
            color: 'var(--mentaforce-primary)', background: 'var(--mentaforce-primary-light)',
            border: '1px solid var(--mentaforce-primary)', padding: '3px 9px', borderRadius: 100,
          }}>
            {t('vita.doelen.volgendeStap')}
          </span>
        ) : null}
      </div>

      {/* Doel info */}
      <div>
        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4, lineHeight: 1.3 }}>{doel.doel_titel}</p>
        <p style={{ fontSize: 11, color: 'var(--text-4)', lineHeight: 1.5 }}>{doel.doel_beschrijving}</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 6 }}>
          <p style={{ fontSize: 11, color: cat.kleur, fontWeight: 600 }}>
            {doel.target_waarde} {doel.eenheid} · {doel.meetType}
          </p>
          {weekBehaald ? (
            <Badge variant="success" className={netBehaald ? 'mf-fade-in' : undefined}>
              <Check size={11} strokeWidth={3} aria-hidden /> {t('vita.doelen.weekdoelBehaald')}
            </Badge>
          ) : streak > 0 ? (
            <Badge variant="success">
              <Flame size={11} aria-hidden /> {t(streak === 1 ? 'vita.doelen.dagOpRij' : 'vita.doelen.dagenOpRij', { aantal: streak })}
            </Badge>
          ) : null}
        </div>
      </div>

      <WeekTrack doel={doel} cat={cat} weekDagen={weekDagen} gelogd={gelogd} vorigeWeekGehaald={vorigeWeekGehaald} />

      {/* Acties — vaste hoogte zodat afvinken geen layout-shift geeft */}
      {gelogd ? (
        <div style={{
          minHeight: 42, borderRadius: 'var(--radius-md)', padding: '4px 6px 4px 14px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
          background: cat.licht,
        }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: gehaaldVandaag ? cat.kleur : 'var(--text-3)' }}>
            {gehaaldVandaag
              ? <><Check size={14} strokeWidth={3} aria-hidden /> {t('vita.doelen.gehaaldVandaag')}</>
              : <><X size={14} strokeWidth={3} aria-hidden /> {t('vita.doelen.vandaagNietGelukt')}</>}
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDetails(doel)}
            style={{ color: cat.kleur, border: `1px solid color-mix(in srgb, ${cat.kleur} 35%, transparent)` }}
          >
            {t('vita.doelen.aanpassen')}
          </Button>
        </div>
      ) : (
        <div style={{ minHeight: 42, display: 'flex', gap: 8 }}>
          <Button
            onClick={() => onLog(doel, true)}
            leftIcon={<Check size={15} strokeWidth={2.5} aria-hidden />}
            aria-label={t('vita.doelen.labelGehaald', { doel: doel.doel_titel })}
            style={{
              flex: 1, background: cat.kleur, color: 'var(--bg-app)', border: '1px solid transparent',
              boxShadow: `0 4px 12px color-mix(in srgb, ${cat.kleur} 30%, transparent)`,
            }}
          >
            {t('vita.doelen.gehaald')}
          </Button>
          <Button
            variant="ghost"
            onClick={() => onLog(doel, false)}
            aria-label={t('vita.doelen.labelNietGelukt', { doel: doel.doel_titel })}
            style={{ border: '1px solid var(--border-strong)', color: 'var(--text-3)' }}
          >
            {t('vita.doelen.nietGelukt')}
          </Button>
          <Button
            variant="ghost"
            onClick={() => onDetails(doel)}
            aria-label={t('vita.doelen.labelNotitie', { doel: doel.doel_titel })}
            title={t('vita.doelen.logMetNotitie')}
            style={{ border: '1px solid var(--border)', padding: '10px 12px', color: 'var(--text-3)' }}
          >
            <Pencil size={14} aria-hidden />
          </Button>
        </div>
      )}
    </Card>
  )
}
