import type { Metadata } from 'next'
import { eisOnderdeel } from '@/lib/club/toegang'
import { haalMeldingInstellingen, telMails, type MailTelling } from '@/lib/club/meldingen/opslag'
import { MeldingenInstellingen } from '@/components/club/meldingen/MeldingenInstellingen'
import '@/components/club/beheer/beheer.css'
import '@/components/club/meldingen/meldingen.css'
import { InstelKruimel } from '@/components/club/beheer/InstelKruimel'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import { MELDINGEN } from '@/lib/aiyourgym/taal/woorden/club/meldingen'

type Pagina = (typeof MELDINGEN)['nl']['pagina']

export async function generateMetadata(): Promise<Metadata> {
  return { title: MELDINGEN[await getTaal()].pagina.titel }
}

// Meldingen aan leden: bevestigingen, herinneringen en annuleringen per mail en
// in de ledenapp. Alleen met het recht Beheer (eisOnderdeel('beheer')).

function MailStatus({ actief, isPlatformEigenaar, telling, t }: { actief: boolean; isPlatformEigenaar: boolean; telling: MailTelling; t: Pagina }) {
  const getal = (n: number | null) => (n === null ? t.onbekend : n)
  return (
    <section className={`club-meldingen-status${actief ? ' is-aan' : ''}`} aria-label={t.stand}>
      <strong>{actief ? t.aan : t.uit}</strong>
      <p>
        {actief ? t.aanUitleg : t.uitUitleg}
        {isPlatformEigenaar && !actief && (
          <>
            {` ${t.aanzetten} `}<code>{'CLUB_MAILS_ACTIEF=1'}</code>{` ${t.met} `}<code>{'CLUB_RESEND_API_KEY'}</code>{` ${t.en} `}<code>{'CLUB_RESEND_FROM'}</code>{` ${t.inRender}`}
          </>
        )}
      </p>
      <ul className="club-meldingen-cijfers" aria-label={t.cijfers}>
        <li>{t.laatste30}</li>
        <li><b>{getal(telling.verstuurd)}</b> {t.verstuurd}</li>
        <li><b>{getal(telling.gepland)}</b> {t.gepland}</li>
        <li><b>{getal(telling.overgeslagen)}</b> {t.overgeslagen}</li>
        <li><b>{getal(telling.mislukt)}</b> {t.mislukt}</li>
      </ul>
    </section>
  )
}

export default async function MeldingenPagina() {
  const t = await eisOnderdeel('beheer')
  const w = MELDINGEN[await getTaal()].pagina
  const [instellingen, telling] = await Promise.all([haalMeldingInstellingen(t.admin, t.userId), telMails(t.admin, t.userId)])
  const actief = process.env.CLUB_MAILS_ACTIEF === '1' && Boolean(process.env.CLUB_RESEND_API_KEY?.trim() && process.env.CLUB_RESEND_FROM?.trim())
  return (
    <>
      <InstelKruimel id="meldingen" />
      <header className="club-paginakop">
        <div>
          <p className="club-boventitel">{t.organisatie.naam}</p>
          <h1>{w.titel}</h1>
          <p>{w.intro}</p>
        </div>
      </header>
      <MailStatus actief={actief && !t.organisatie.demo} isPlatformEigenaar={t.isPlatformEigenaar} telling={telling} t={w} />
      <MeldingenInstellingen begin={instellingen} />
    </>
  )
}
