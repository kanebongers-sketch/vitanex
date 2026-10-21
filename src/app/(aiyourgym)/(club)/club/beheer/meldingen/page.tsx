import type { Metadata } from 'next'
import { eisOnderdeel } from '@/lib/club/toegang'
import { haalMeldingInstellingen, telMails, type MailTelling } from '@/lib/club/meldingen/opslag'
import { MeldingenInstellingen } from '@/components/club/meldingen/MeldingenInstellingen'
import '@/components/club/beheer/beheer.css'
import '@/components/club/meldingen/meldingen.css'
import { InstelKruimel } from '@/components/club/beheer/InstelKruimel'

export const metadata: Metadata = { title: 'Meldingen aan leden' }

// Meldingen aan leden: bevestigingen, herinneringen en annuleringen per mail en
// in de ledenapp. Alleen met het recht Beheer (eisOnderdeel('beheer')).

function MailStatus({ actief, isPlatformEigenaar, telling }: { actief: boolean; isPlatformEigenaar: boolean; telling: MailTelling }) {
  const getal = (n: number | null) => (n === null ? 'onbekend' : n)
  return (
    <section className={`club-meldingen-status${actief ? ' is-aan' : ''}`} aria-label="Stand van de mail">
      <strong>{actief ? 'Mail naar leden staat aan' : 'Mail naar leden staat nog uit'}</strong>
      <p>
        {actief
          ? 'Leden krijgen de meldingen hieronder per mail en in de ledenapp. Leden van een demo-sportschool en demo-leden krijgen nooit mail.'
          : 'De meldingen verschijnen wel in de ledenapp, maar er gaat nog niets per mail naar leden.'}
        {isPlatformEigenaar && !actief && (
          <>
            {' '}Aanzetten: <code>CLUB_MAILS_ACTIEF=1</code> met <code>CLUB_RESEND_API_KEY</code> en <code>CLUB_RESEND_FROM</code> in Render.
          </>
        )}
      </p>
      <ul className="club-meldingen-cijfers" aria-label="Mails in de laatste 30 dagen">
        <li>Laatste 30 dagen:</li>
        <li><b>{getal(telling.verstuurd)}</b> verstuurd</li>
        <li><b>{getal(telling.gepland)}</b> gepland</li>
        <li><b>{getal(telling.overgeslagen)}</b> overgeslagen</li>
        <li><b>{getal(telling.mislukt)}</b> mislukt</li>
      </ul>
    </section>
  )
}

export default async function MeldingenPagina() {
  const t = await eisOnderdeel('beheer')
  const [instellingen, telling] = await Promise.all([haalMeldingInstellingen(t.admin, t.userId), telMails(t.admin, t.userId)])
  const actief = process.env.CLUB_MAILS_ACTIEF === '1' && Boolean(process.env.CLUB_RESEND_API_KEY?.trim() && process.env.CLUB_RESEND_FROM?.trim())
  return (
    <>
      <InstelKruimel id="meldingen" />
      <header className="club-paginakop">
        <div>
          <p className="club-boventitel">{t.organisatie.naam}</p>
          <h1>Meldingen aan leden</h1>
          <p>Bevestigingen, herinneringen en annuleringen van groepslessen en afspraken. Per mail in je eigen huisstijl en in de ledenapp.</p>
        </div>
      </header>
      <MailStatus actief={actief && !t.organisatie.demo} isPlatformEigenaar={t.isPlatformEigenaar} telling={telling} />
      <MeldingenInstellingen begin={instellingen} />
    </>
  )
}
