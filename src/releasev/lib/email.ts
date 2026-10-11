import { Resend } from "resend";
import type { EmailContent } from "./email-templates";

/**
 * E-mail via Resend (gratis tot 3.000 mails/maand).
 * Benodigd: RELEASEV_RESEND_API_KEY, RELEASEV_EMAIL_FROM (bijv. "RELEASE V <hallo@jouwdomein.nl>",
 * domein verifiëren in Resend) en RELEASEV_EMAIL_TO (inbox voor het contactformulier).
 * Optioneel: RELEASEV_RESEND_SEGMENT_ID voor nieuwsbriefinschrijvingen.
 *
 * Zonder configuratie doen alle functies niets en geven ze "skipped" terug.
 */
type SendResult = "sent" | "skipped";

let client: Resend | null = null;

function getClient(): Resend | null {
  const key = process.env.RELEASEV_RESEND_API_KEY?.trim() ?? "";
  if (!key.startsWith("re_") || key.includes("VERVANG")) return null;
  client ??= new Resend(key);
  return client;
}

function getFrom(): string | null {
  const from = process.env.RELEASEV_EMAIL_FROM?.trim() ?? "";
  return from.includes("@") ? from : null;
}

export function isEmailConfigured(): boolean {
  return getClient() !== null && getFrom() !== null;
}

interface SendOptions {
  to: string;
  content: EmailContent;
  replyTo?: string;
  /** ISO-datum: Resend verstuurt de mail op dat moment (max. 30 dagen vooruit) */
  scheduledAt?: string;
  /** Voorkomt dubbele mails als Stripe een webhook opnieuw verstuurt */
  idempotencyKey?: string;
}

export async function sendEmail(options: SendOptions): Promise<SendResult> {
  const resend = getClient();
  const from = getFrom();
  if (!resend || !from) return "skipped";
  const { error } = await resend.emails.send(
    {
      from,
      to: options.to,
      subject: options.content.subject,
      html: options.content.html,
      text: options.content.text,
      replyTo: options.replyTo,
      scheduledAt: options.scheduledAt,
    },
    options.idempotencyKey ? { idempotencyKey: options.idempotencyKey } : undefined,
  );
  if (error) throw new Error(`Resend: ${error.message}`);
  return "sent";
}

/** Inbox voor contactberichten. */
export function getInboxAddress(): string | null {
  const to = process.env.RELEASEV_EMAIL_TO?.trim() ?? "";
  return to.includes("@") ? to : null;
}

/** Voegt een nieuwsbriefabonnee toe aan Resend (segment optioneel). */
export async function addNewsletterContact(email: string): Promise<SendResult> {
  const resend = getClient();
  if (!resend) return "skipped";
  const segmentId = process.env.RELEASEV_RESEND_SEGMENT_ID?.trim();
  const { error } = await resend.contacts.create({
    email,
    unsubscribed: false,
    ...(segmentId ? { segments: [{ id: segmentId }] } : {}),
  });
  if (error && !/already exists/i.test(error.message)) throw new Error(`Resend: ${error.message}`);
  return "sent";
}
