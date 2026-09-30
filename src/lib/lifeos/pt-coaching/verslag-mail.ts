// ─── LifeOS — coachgesprek-verslag mailen (SERVER-ONLY) ─────────────────────
// Na elk afgerond coachgesprek gaat het verslag als nette pdf naar je eigen
// inbox (dezelfde ontvanger als de dagmail). Best-effort: de evaluatie staat al
// veilig in de database, een mailhik geeft alleen een eerlijke melding terug.

import { Resend } from 'resend'
import { maakVerslagPdf, verslagBestandsnaam, type VerslagPdfInvoer } from './pdf'

const MAIL_VAN = 'MentaForce <onboarding@resend.dev>'
const DATUM = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long', timeZone: 'Europe/Amsterdam' })

function ontvanger(): string {
  return process.env.LIFEOS_DAGPLANNING_MAIL?.trim() || 'kanebongers@gmail.com'
}

function escape(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/** Mailt het verslag als pdf-bijlage. Geeft een foutmelding terug, of `null` als het lukte. */
export async function mailVerslag(v: VerslagPdfInvoer): Promise<string | null> {
  if (!process.env.RESEND_API_KEY) return 'Verslag opgeslagen, maar mailen staat niet aan (geen mailer ingesteld).'
  try {
    const pdf = await maakVerslagPdf(v)
    const onderwerp = `Coachgesprek ${v.naam} · ${DATUM.format(v.op)}`
    const tekst = `In de bijlage het verslag van je coachgesprek met ${v.naam}.`
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error } = await resend.emails.send({
      from: MAIL_VAN,
      to: ontvanger(),
      subject: onderwerp,
      text: tekst,
      html: `<p style="font-family:system-ui,sans-serif">${escape(tekst)}</p>`,
      attachments: [{ filename: verslagBestandsnaam(v.naam, v.op), content: pdf }],
    })
    if (error) {
      console.error('[coach-verslag] Resend-fout:', error)
      return 'Verslag opgeslagen, maar de pdf kon niet worden gemaild.'
    }
    return null
  } catch (oorzaak) {
    console.error('[coach-verslag] mailen mislukt', oorzaak)
    return 'Verslag opgeslagen, maar de pdf kon niet worden gemaild.'
  }
}
