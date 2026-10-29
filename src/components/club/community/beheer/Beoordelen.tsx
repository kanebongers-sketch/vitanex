import { ShieldCheck } from 'lucide-react'
import type { TeBeoordelen } from '@/lib/club/community/beheer'
import { BeheerKnop } from './BeheerKnop'
import { LOCALE } from '@/lib/aiyourgym/taal/taal'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import { COMMUNITY } from '@/lib/aiyourgym/taal/woorden/club/community'

// Berichten die op de sportschool wachten: vastgehouden door de woordfilter of
// door meerdere meldingen, of gemeld door een lid. Plaatsen of verbergen; de
// meldingen op het bericht zijn daarmee afgehandeld. De melder blijft anoniem.

export async function Beoordelen({ items }: { items: TeBeoordelen[] }) {
  const taal = await getTaal()
  const tc = COMMUNITY[taal]
  const t = tc.beoordelen
  const datum = new Intl.DateTimeFormat(LOCALE[taal], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam' })
  if (items.length === 0) {
    return (
      <div className="club-cmb-kaart">
        <h2>
          <ShieldCheck size={20} aria-hidden /> {t.niets}
        </h2>
        <p>{t.nietsUitleg}</p>
      </div>
    )
  }
  return (
    <section className="club-cmb-kolom" aria-labelledby="cmb-beoordeel-kop">
      <h2 id="cmb-beoordeel-kop">{t.titel(items.length)}</h2>
      <ul className="club-cmb-beoordeel">
        {items.map((b) => {
          const url = `/api/club/community/berichten/${encodeURIComponent(b.berichtId)}`
          return (
            <li key={b.berichtId} className="club-cmb-item">
              <div className="club-cmb-item-meta">
                <strong>{b.auteur}</strong>
                <span>{b.groepNaam}</span>
                <time dateTime={b.op}>{datum.format(new Date(b.op))}</time>
                <span className={`club-cmb-status club-cmb-status--${b.status}`}>{b.status === 'vastgehouden' ? (b.reden ? t.vastgehoudenOm(b.reden.toLowerCase()) : t.vastgehouden) : b.status === 'verborgen' ? t.verborgen : t.zichtbaar}</span>
              </div>
              <blockquote>{b.tekst}</blockquote>
              {b.meldingen.length > 0 && (
                <>
                  <ul className="club-cmb-redenen" aria-label={t.meldingen}>
                    {b.meldingen.map((m, i) => (
                      <li key={i}>{tc.meldReden[m.reden]}</li>
                    ))}
                  </ul>
                  {b.meldingen
                    .filter((m) => m.toelichting)
                    .map((m, i) => (
                      <p key={i} className="club-cmb-item-meta">
                        {t.toelichting(m.toelichting ?? '')}
                      </p>
                    ))}
                </>
              )}
              <div className="club-cmb-knoppen">
                {b.status !== 'verborgen' && <BeheerKnop url={url} method="PATCH" body={{ actie: 'verbergen' }} label={t.verbergen} soort="gevaar" />}
                <BeheerKnop url={url} method="PATCH" body={{ actie: 'plaatsen' }} label={b.status === 'zichtbaar' ? t.inOrde : t.plaatsen} soort="primair" />
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
