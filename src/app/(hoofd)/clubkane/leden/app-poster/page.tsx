import type { CSSProperties } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { eisModule } from '@/lib/club/toegang'
import { LOGO_FIT_FACTORY, moduleAan } from '@/lib/club/kern/organisatie'
import { bruikbaarAccent, HEX } from '@/lib/club/kern/huisstijl'
import { CLUB_DOMEIN } from '@/lib/club/kern/subdomein'
import { clubPad, type ZoekParams } from '@/lib/club/kern/vestiging'
import { kiesUit } from '@/lib/club/kern/vestigingen'
import { ptUrl } from '@/lib/fit-factory/domein'
import { qrDataUrl } from '@/lib/club/checkin/qr-beeld'
import { CLUB_LEDEN_LOGIN } from '@/lib/club/ledenlogin/schakelaar'
import { mailKlaar, posterDoel } from '@/lib/club/app-uitnodigen/regels'
import { FfLogo } from '@/components/lifeos/pt-dashboard/FfLogo'
import { PrintKnop } from '@/components/club/personeel/PrintKnop'
import '@/components/club/leden/app-uitnodigen/app-poster.css'

// /clubkane/leden/app-poster: een A4-poster voor aan de muur of de balie, in
// de huisstijl van de sportschool. De QR-code wijst naar /mijn/aanvragen van
// deze sportschool; daar vult het lid zijn e-mailadres in en krijgt hij zijn
// persoonlijke link. Op het scherm een knop om te printen; bij het printen
// alleen de poster.

export const metadata: Metadata = { title: 'Poster ledenapp' }

const STAPPEN = [
  { kop: 'Scan', tekst: 'Richt de camera van je telefoon op de QR-code.' },
  { kop: 'Vul je e-mail in', tekst: 'Je krijgt meteen een mail met je persoonlijke link. Kies een pincode van 6 cijfers.' },
  { kop: 'Zet de app op je beginscherm', tekst: 'Zo heb je lessen, afspraken en je schema altijd bij de hand.' },
] as const

function Waarschuwingen({ dicht, appUit, geenMail }: { dicht: boolean; appUit: boolean; geenMail: boolean }) {
  if (!dicht && !appUit && !geenMail) return null
  return (
    <div className="club-poster-let-op" role="status">
      {dicht ? <p>De ledenapp is nog niet open voor leden (CLUB_LEDEN_LOGIN staat uit). De QR-code werkt pas als die aan staat.</p> : null}
      {appUit ? <p>De ledenapp staat uit bij deze sportschool. Zet hem aan in de instellingen.</p> : null}
      {geenMail ? <p>Mails staan nog uit. Wie scant, krijgt de melding om de link aan de balie te vragen.</p> : null}
    </div>
  )
}

export default async function AppPoster({ searchParams }: { searchParams: ZoekParams }) {
  const t = await eisModule('leden')
  const org = t.organisatie
  const vestiging = kiesUit(t.vestigingen, (await searchParams).v)
  const doel = posterDoel(org, process.env.CLUB_SUBDOMEINEN_ACTIEF === '1', CLUB_DOMEIN, ptUrl('/'))
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
            <Link href={clubPad('/leden', vestiging)} className="club-knop club-knop--stil club-knop--klein"><ArrowLeft size={15} aria-hidden /> Leden</Link>
          ) : null}
          <h1>Poster voor de club</h1>
          <p className="club-hint">Print op A4 (staand). Zet in het printvenster &quot;Achtergrondafbeeldingen&quot; aan voor de kleuren.</p>
        </div>
        <PrintKnop />
      </header>
      <Waarschuwingen dicht={!CLUB_LEDEN_LOGIN} appUit={!moduleAan(org, 'app')} geenMail={!mailKlaar(process.env)} />

      <article className="club-poster" style={stijl} data-thema={org.thema} aria-label={`Poster: de app van ${org.naam}`}>
        <div className="club-poster-merk">
          {org.logo === LOGO_FIT_FACTORY ? <FfLogo className="club-poster-logo" /> : eigenLogo ? <img src={eigenLogo} alt={org.naam} className="club-poster-logo" /> : <span className="club-poster-woordmerk">{org.naam}</span>}
        </div>
        <div className="club-poster-inhoud">
          <p className="club-poster-boven">Nieuw voor leden</p>
          <h2 className="club-poster-kop">Onze app.<br />In je broekzak.</h2>
          <p className="club-poster-sub">Boek lessen, plan afspraken en volg je schema. Gratis voor alle leden van {org.naam}.</p>
          <div className="club-poster-midden">
            <figure className="club-poster-qr">
              {qr ? <img src={qr} alt={`QR-code naar ${leesbaar}`} width={720} height={720} /> : <p className="club-poster-qr-fout">De QR-code kon niet worden gemaakt. Ververs de pagina.</p>}
              <figcaption>{leesbaar}</figcaption>
            </figure>
            <ol className="club-poster-stappen">
              {STAPPEN.map((s, i) => (
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
          <span>Vragen? Loop even langs de balie.</span>
        </footer>
      </article>
    </div>
  )
}
