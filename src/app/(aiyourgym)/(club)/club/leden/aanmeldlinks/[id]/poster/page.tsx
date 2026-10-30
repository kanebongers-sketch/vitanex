import type { CSSProperties } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { eisModule } from '@/lib/club/toegang'
import { LOGO_FIT_FACTORY } from '@/lib/club/kern/organisatie'
import { bruikbaarAccent, HEX } from '@/lib/club/kern/huisstijl'
import { clubPad } from '@/lib/club/kern/vestiging'
import { isVestigingSlug } from '@/lib/club/kern/vestigingen'
import { qrDataUrl } from '@/lib/club/checkin/qr-beeld'
import { aanmeldPad, linkStaat } from '@/lib/club/nieuwe-leden/regels'
import { haalLink } from '@/lib/club/nieuwe-leden/links-opslag'
import { sportschoolBasis } from '@/lib/club/nieuwe-leden/knoppen-data'
import { FitFactoryLogo } from '@/components/club/shell/FitFactoryLogo'
import { PrintKnop } from '@/components/club/personeel/PrintKnop'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { NIEUWE_LEDEN } from '@/lib/aiyourgym/taal/woorden/club/nieuwe-leden'
import '@/components/club/leden/app-uitnodigen/app-poster.css'

// /club/leden/aanmeldlinks/<id>/poster: een A4-poster met de QR van een
// aanmeldlink, in de huisstijl van de sportschool (logo, naam, accent), met
// "Scan en meld je aan". Op het scherm een printknop; bij het printen alleen
// de poster. Een link die niet meer werkt, geeft geen poster.

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await clubTekst(NIEUWE_LEDEN)).poster.titel }
}

export default async function AanmeldPoster({ params }: { params: Promise<{ id: string }> }) {
  const t = await eisModule('leden')
  const { id } = await params
  const link = await haalLink(t.admin, t.userId, id)
  if (!link || !t.vestigingen.some((v) => v.sleutel === link.vestiging)) notFound()
  const w = (await clubTekst(NIEUWE_LEDEN)).poster
  const org = t.organisatie
  const terug = isVestigingSlug(link.vestiging) ? clubPad('/leden/aanmeldlinks', link.vestiging) : '/club/leden'
  const werkt = linkStaat(link, new Date()) === 'open'
  const doel = `${sportschoolBasis(org)}${aanmeldPad(link.code)}`
  const qr = werkt ? await qrDataUrl(doel) : null
  const accent = bruikbaarAccent(HEX.test(org.kleurAccent) ? org.kleurAccent : '#B58E5C', 'licht').kleur
  const eigenLogo = org.logo && org.logo !== LOGO_FIT_FACTORY ? `/api/club/organisatie/logo?pad=${encodeURIComponent(org.logo)}` : null
  const stijl = { '--poster-accent': accent } as CSSProperties
  const leesbaar = doel.replace(/^https:\/\//, '')

  return (
    <div className="club-poster-pagina">
      <header className="club-poster-balk">
        <div>
          <Link href={terug} className="club-knop club-knop--stil club-knop--klein"><ArrowLeft size={15} aria-hidden /> {w.terug}</Link>
          <h1>{w.titel}</h1>
          <p className="club-hint">{w.printHint}</p>
        </div>
        {werkt && <PrintKnop />}
      </header>
      {!werkt ? (
        <div className="club-poster-let-op" role="status"><p>{w.ingetrokken}</p></div>
      ) : (
        <article className="club-poster" style={stijl} data-thema={org.thema} aria-label={w.label(org.naam)}>
          <div className="club-poster-merk">
            {/* eslint-disable-next-line @next/next/no-img-element -- logo van de sportschool via onze eigen route */}
            {org.logo === LOGO_FIT_FACTORY ? <FitFactoryLogo className="club-poster-logo" /> : eigenLogo ? <img src={eigenLogo} alt={org.naam} className="club-poster-logo" /> : <span className="club-poster-woordmerk">{org.naam}</span>}
          </div>
          <div className="club-poster-inhoud">
            <p className="club-poster-boven">{w.boven}</p>
            <h2 className="club-poster-kop">{w.kopRegel1}<br />{w.kopRegel2}</h2>
            <p className="club-poster-sub">{w.sub(org.naam)}</p>
            <div className="club-poster-midden">
              <figure className="club-poster-qr">
                {/* eslint-disable-next-line @next/next/no-img-element -- data-URL van de QR */}
                {qr ? <img src={qr} alt={w.qrAlt(leesbaar)} width={720} height={720} /> : null}
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
      )}
    </div>
  )
}
