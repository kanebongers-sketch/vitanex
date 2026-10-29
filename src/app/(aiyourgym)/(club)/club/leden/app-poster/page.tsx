import type { CSSProperties } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { eisModule } from '@/lib/club/toegang'
import { LOGO_FIT_FACTORY, moduleAan } from '@/lib/club/kern/organisatie'
import { bruikbaarAccent, HEX } from '@/lib/club/kern/huisstijl'
import { aygUrl } from '@/lib/club/kern/subdomein'
import { subdomeinenActief } from '@/lib/club/kern/adres-verzoek'
import { clubPad, type ZoekParams } from '@/lib/club/kern/vestiging'
import { kiesUit } from '@/lib/club/kern/vestigingen'
import { qrDataUrl } from '@/lib/club/checkin/qr-beeld'
import { CLUB_LEDEN_LOGIN } from '@/lib/club/ledenlogin/schakelaar'
import { mailKlaar, posterDoel } from '@/lib/club/app-uitnodigen/regels'
import { FitFactoryLogo } from '@/components/club/shell/FitFactoryLogo'
import { PrintKnop } from '@/components/club/personeel/PrintKnop'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { LEDEN } from '@/lib/aiyourgym/taal/woorden/club/leden'
import '@/components/club/leden/app-uitnodigen/app-poster.css'

// /club/leden/app-poster: een A4-poster voor aan de muur of de balie, in
// de huisstijl van de sportschool. De QR-code wijst naar /mijn/aanvragen van
// deze sportschool; daar vult het lid zijn e-mailadres in en krijgt hij zijn
// persoonlijke link. Op het scherm een knop om te printen; bij het printen
// alleen de poster.

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await clubTekst(LEDEN)).poster.titel }
}

type PosterTekst = (typeof LEDEN)['nl']['poster']

function Waarschuwingen({ dicht, appUit, geenMail, w }: { dicht: boolean; appUit: boolean; geenMail: boolean; w: PosterTekst }) {
  if (!dicht && !appUit && !geenMail) return null
  return (
    <div className="club-poster-let-op" role="status">
      {dicht ? <p>{w.dicht}</p> : null}
      {appUit ? <p>{w.appUit}</p> : null}
      {geenMail ? <p>{w.geenMail}</p> : null}
    </div>
  )
}

export default async function AppPoster({ searchParams }: { searchParams: ZoekParams }) {
  const t = await eisModule('leden')
  const org = t.organisatie
  const w = (await clubTekst(LEDEN)).poster
  const vestiging = kiesUit(t.vestigingen, (await searchParams).v)
  const doel = posterDoel(org, subdomeinenActief(), aygUrl('/'))
  const qr = await qrDataUrl(doel)
  const accent = bruikbaarAccent(HEX.test(org.kleurAccent) ? org.kleurAccent : '#B58E5C', 'licht').kleur
  const eigenLogo = org.logo && org.logo !== LOGO_FIT_FACTORY ? `/api/club/organisatie/logo?pad=${encodeURIComponent(org.logo)}` : null
  const stijl = { '--poster-accent': accent } as CSSProperties
  const leesbaar = doel.replace(/^https:\/\//, '')

  return (
    <div className="club-poster-pagina">
      <header className="club-poster-balk">
        <div>
          {vestiging ? (
            <Link href={clubPad('/leden', vestiging)} className="club-knop club-knop--stil club-knop--klein"><ArrowLeft size={15} aria-hidden /> {w.terug}</Link>
          ) : null}
          <h1>{w.kop}</h1>
          <p className="club-hint">{w.printHint}</p>
        </div>
        <PrintKnop />
      </header>
      <Waarschuwingen dicht={!CLUB_LEDEN_LOGIN} appUit={!moduleAan(org, 'app')} geenMail={!mailKlaar(process.env)} w={w} />

      <article className="club-poster" style={stijl} data-thema={org.thema} aria-label={w.label(org.naam)}>
        <div className="club-poster-merk">
          {org.logo === LOGO_FIT_FACTORY ? <FitFactoryLogo className="club-poster-logo" /> : eigenLogo ? <img src={eigenLogo} alt={org.naam} className="club-poster-logo" /> : <span className="club-poster-woordmerk">{org.naam}</span>}
        </div>
        <div className="club-poster-inhoud">
          <p className="club-poster-boven">{w.boven}</p>
          <h2 className="club-poster-kop">{w.kopRegel1}<br />{w.kopRegel2}</h2>
          <p className="club-poster-sub">{w.sub(org.naam)}</p>
          <div className="club-poster-midden">
            <figure className="club-poster-qr">
              {qr ? <img src={qr} alt={w.qrAlt(leesbaar)} width={720} height={720} /> : <p className="club-poster-qr-fout">{w.qrFout}</p>}
              <figcaption>{leesbaar}</figcaption>
            </figure>
            <ol className="club-poster-stappen">
              {w.stappen.map((s, i) => (
                <li key={s.kop}>
                  <span className="club-poster-nummer" aria-hidden>{i + 1}</span>
                  <span><strong>{s.kop}</strong>{s.tekst}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
        <footer className="club-poster-voet">
          <span>{org.slogan ?? org.naam}</span>
          <span>{w.vragen}</span>
        </footer>
      </article>
    </div>
  )
}
