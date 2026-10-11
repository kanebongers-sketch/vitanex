import { SITE } from "@rv/config/site";

/**
 * E-mailtemplates als eenvoudige, inline-gestylede HTML (werkt in alle mailclients).
 * Alle variabele inhoud gaat door escapeHtml om injectie te voorkomen.
 */
export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function layout(title: string, bodyHtml: string): string {
  return `<!doctype html><html lang="nl"><body style="margin:0;background:#0b0b0c;font-family:Arial,Helvetica,sans-serif;color:#f4f3f0">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b0b0c;padding:32px 16px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
<tr><td style="font-size:18px;font-weight:800;letter-spacing:-0.02em;text-transform:uppercase;padding-bottom:28px">${escapeHtml(SITE.brandName)}</td></tr>
<tr><td style="font-size:26px;font-weight:800;line-height:1.15;padding-bottom:18px">${escapeHtml(title)}</td></tr>
<tr><td style="font-size:15px;line-height:1.6;color:#c5c4bf">${bodyHtml}</td></tr>
<tr><td style="font-size:12px;line-height:1.6;color:#8f8e89;padding-top:36px;border-top:1px solid #2c2c30">
${escapeHtml(SITE.company.legalName)} · ${escapeHtml(SITE.contact.email)}<br>Vragen? Antwoord gewoon op deze mail.
</td></tr></table></td></tr></table></body></html>`;
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 16px">${escapeHtml(text)}</p>`;
}

export interface OrderEmailInput {
  customerName: string | null;
  amountLabel: string;
  orderReference: string;
  isGift: boolean;
}

export function orderConfirmationEmail(input: OrderEmailInput): EmailContent {
  const greeting = input.customerName ? `Hoi ${input.customerName.split(" ")[0]},` : "Hoi,";
  const lines = [
    greeting,
    `Bedankt voor je bestelling bij ${SITE.brandName}. We hebben je betaling van ${input.amountLabel} ontvangen.`,
    `${SITE.shipping.freeLabel}. ${SITE.shipping.deliveryLabel}.${input.isGift ? " Je bestelling wordt als cadeau verpakt, zonder prijzen op de pakbon." : ""}`,
    "In de doos zit een kaart met een QR-code. Scan hem, kies je variant (kantoor, hardlopen of kracht) en begin met dag 1.",
    `Je bestelreferentie: ${input.orderReference}`,
  ];
  return {
    subject: `Je bestelling is binnen · ${SITE.brandName}`,
    html: layout("Bedankt, je kit komt eraan.", lines.map(paragraph).join("")),
    text: lines.join("\n\n"),
  };
}

export function reviewRequestEmail(input: { customerName: string | null }): EmailContent {
  const greeting = input.customerName ? `Hoi ${input.customerName.split(" ")[0]},` : "Hoi,";
  const lines = [
    greeting,
    "Je hebt je kit nu ongeveer anderhalve week. Hoe bevalt het programma?",
    "We horen graag je eerlijke ervaring, ook als die kritisch is. Antwoord op deze mail met een paar zinnen en een cijfer van 1 tot 5. Met jouw toestemming plaatsen we je review (met alleen je voornaam) op onze site.",
    "Loop je ergens tegenaan? Laat het ons ook weten, dan denken we met je mee.",
  ];
  return {
    subject: `Hoe gaat het met je herstelroutine? · ${SITE.brandName}`,
    html: layout("Hoe bevalt je kit?", lines.map(paragraph).join("")),
    text: lines.join("\n\n"),
  };
}

export interface ContactEmailInput {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export function contactNotificationEmail(input: ContactEmailInput): EmailContent {
  const rows = [
    `Naam: ${input.name}`,
    `E-mail: ${input.email}`,
    `Onderwerp: ${input.subject}`,
    "",
    input.message,
  ];
  return {
    subject: `Contactformulier: ${input.subject} van ${input.name}`,
    html: layout("Nieuw bericht via de website", rows.map((row) => (row ? paragraph(row) : "")).join("")),
    text: rows.join("\n"),
  };
}

export function newsletterConfirmationEmail(input: { confirmUrl: string }): EmailContent {
  const intro = [
    "Hoi,",
    `Bijna klaar: bevestig je inschrijving voor de nieuwsbrief van ${SITE.brandName}. Je krijgt maximaal een mail per maand met herstel-tips en nieuws.`,
  ];
  const outro = "Heb je je niet ingeschreven? Dan kun je deze mail negeren; je wordt dan niet toegevoegd.";
  const button = `<p style="margin:8px 0 24px"><a href="${escapeHtml(input.confirmUrl)}" style="display:inline-block;background:#f4f3f0;color:#0b0b0c;text-decoration:none;font-weight:700;padding:14px 24px;border-radius:999px">Inschrijving bevestigen</a></p>`;
  return {
    subject: `Bevestig je inschrijving · ${SITE.brandName}`,
    html: layout("Bevestig je inschrijving", intro.map(paragraph).join("") + button + paragraph(outro)),
    text: [...intro, `Bevestigen: ${input.confirmUrl}`, outro].join("\n\n"),
  };
}
