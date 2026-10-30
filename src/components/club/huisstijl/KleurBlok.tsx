'use client'

import { HEX, MIN_CONTRAST_ACCENT, MIN_CONTRAST_VLAK, VARIANTEN, VARIANT_BASIS, basisVoor, bruikbaarAccent, themaVan, type Variant } from '@/lib/club/kern/huisstijl'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { HUISSTIJL } from '@/lib/aiyourgym/taal/woorden/club/huisstijl'
import { KleurKiezer } from './KleurKiezer'

// De huisstijl in drie kleuren plus een thema (besluit Kane 30-10-2026):
// hoofdkleur (knoppen, actief, focus), tweede kleur (grafieken, tellers,
// voortgang) en een achtergrondtint. Is het contrast van de hoofdkleur te laag,
// dan zeggen we dat eerlijk en laten we zien welke kleur de app gebruikt.

const STARTKLEUREN = [
  { kleur: '#B58E5C', naam: 'brons' },
  { kleur: '#E8A33F', naam: 'amber' },
  { kleur: '#E5484D', naam: 'rood' },
  { kleur: '#FF6B3D', naam: 'oranje' },
  { kleur: '#30A46C', naam: 'groen' },
  { kleur: '#3E63DD', naam: 'blauw' },
  { kleur: '#8E4EC6', naam: 'paars' },
  { kleur: '#12A594', naam: 'petrol' },
] as const

const TINTEN = [
  { kleur: '#C8A27A', naam: 'warm' },
  { kleur: '#8FA3B8', naam: 'koel' },
  { kleur: '#6E9C7E', naam: 'groen' },
  { kleur: '#5B7BD5', naam: 'blauw' },
  { kleur: '#9277C4', naam: 'paars' },
  { kleur: '#C46B6B', naam: 'rood' },
] as const

interface KleurBlokProps {
  kleur: string
  tweede: string | null
  tint: string | null
  variant: Variant
  onKleur: (kleur: string) => void
  onTweede: (kleur: string | null) => void
  onTint: (kleur: string | null) => void
  onVariant: (variant: Variant) => void
}

export function KleurBlok({ kleur, tweede, tint, variant, onKleur, onTweede, onTint, onVariant }: KleurBlokProps) {
  const t = useTekst(HUISSTIJL).kleur
  const geldigeTint = tint && HEX.test(tint) ? tint : null
  const basis = basisVoor(variant, geldigeTint)
  const geldig = HEX.test(kleur)
  const vlak = geldig ? bruikbaarAccent(kleur, basis, MIN_CONTRAST_VLAK) : null
  const tekst = geldig ? bruikbaarAccent(kleur, basis, MIN_CONTRAST_ACCENT) : null
  const lichter = themaVan(variant) === 'donker'
  const startkleuren = STARTKLEUREN.map((s) => ({ kleur: s.kleur, naam: t.namen[s.naam] }))
  const ongeldigeTweede = tweede !== null && !HEX.test(tweede)
  const ongeldigeTint = tint !== null && !HEX.test(tint)
  return (
    <section className="club-huisstijl-blok" aria-labelledby="kleur-kop">
      <h2 id="kleur-kop" className="club-huisstijl-kop">{t.kop}</h2>

      <fieldset className="club-huisstijl-kiezer">
        <legend className="club-huisstijl-subkop">{t.thema}</legend>
        <div className="club-huisstijl-themas" role="group" aria-label={t.thema}>
          {VARIANTEN.map((v) => (
            <button key={v} type="button" className="club-huisstijl-themaknop" aria-pressed={variant === v} onClick={() => onVariant(v)}>
              <ThemaStaal variant={v} />
              <span>{t.themas[v]}</span>
            </button>
          ))}
        </div>
        {variant === 'auto' && <p className="club-hint">{t.autoUitleg}</p>}
      </fieldset>

      <KleurKiezer id="kleur-hoofd" label={t.hoofd} uitleg={t.hoofdUitleg} kleur={kleur} stalen={startkleuren} onKleur={(k) => onKleur(k ?? '')} terugval="#B58E5C" meldingId="kleur-melding" />
      <KleurKiezer id="kleur-tweede" label={t.tweede} uitleg={t.tweedeUitleg} kleur={tweede} stalen={startkleuren} onKleur={onTweede} leeg={t.tweedeGelijk} terugval={geldig ? kleur : '#B58E5C'} meldingId="kleur-melding" />
      <KleurKiezer
        id="kleur-tint"
        label={t.tint}
        uitleg={t.tintUitleg}
        kleur={tint}
        stalen={TINTEN.map((s) => ({ kleur: s.kleur, naam: t.tinten[s.naam] }))}
        onKleur={onTint}
        leeg={t.tintGeen}
        terugval="#8FA3B8"
        meldingId="kleur-melding"
      />

      <div id="kleur-melding" aria-live="polite">
        {(!geldig || ongeldigeTweede || ongeldigeTint) && <p className="club-melding club-melding--fout">{t.ongeldig}</p>}
        {vlak?.aangepast && (
          <p className="club-melding">
            {t.valtWeg.voor(lichter, MIN_CONTRAST_VLAK)} <Code kleur={vlak.kleur} />
            {t.valtWeg.na(lichter)}
          </p>
        )}
        {!vlak?.aangepast && tekst?.aangepast && (
          <p className="club-melding">
            {t.tekstAangepast.voor} <Code kleur={tekst.kleur} />
            {t.tekstAangepast.na(lichter, MIN_CONTRAST_ACCENT)}
          </p>
        )}
      </div>
    </section>
  )
}

/** Een klein vlak met de achtergrond en kaart van het thema (Automatisch: half donker, half licht). */
function ThemaStaal({ variant }: { variant: Variant }) {
  if (variant === 'auto') {
    return <span className="club-huisstijl-themastaal" aria-hidden style={{ background: `linear-gradient(135deg, ${VARIANT_BASIS.donker.bgApp} 50%, ${VARIANT_BASIS.licht.bgApp} 50%)` }} />
  }
  const b = VARIANT_BASIS[variant]
  return (
    <span className="club-huisstijl-themastaal" aria-hidden style={{ background: b.bgApp }}>
      <span style={{ background: b.bgCard }} />
    </span>
  )
}

function Code({ kleur }: { kleur: string }) {
  return (
    <span className="club-huisstijl-code">
      <span className="club-huisstijl-codestaal" style={{ background: kleur }} aria-hidden />
      {kleur}
    </span>
  )
}
