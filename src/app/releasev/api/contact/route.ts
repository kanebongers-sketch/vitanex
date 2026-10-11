import { NextResponse } from "next/server";
import { SITE } from "@rv/config/site";
import { contactSchema, type ContactApiResponse, type ContactInput } from "@rv/lib/contact-schema";
import { createRateLimiter, getClientIp } from "@rv/lib/rate-limit";
import { isJsonRequest, isSameOrigin } from "@rv/lib/request-guards";
import { getInboxAddress, isEmailConfigured, sendEmail } from "@rv/lib/email";
import { contactNotificationEmail } from "@rv/lib/email-templates";

const ALLOWED_HOSTS = [new URL(SITE.url).host];

/** Maximaal 5 berichten per 10 minuten per IP-adres. */
const checkRateLimit = createRateLimiter({ limit: 5, windowMs: 10 * 60 * 1000 });

function respond(status: number, body: ContactApiResponse, headers?: HeadersInit) {
  return NextResponse.json(body, { status, headers });
}

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}

class DeliveryNotConfiguredError extends Error {}

const SUBJECT_LABELS: Record<string, string> = {
  bestelling: "Bestelling",
  retour: "Retour",
  programma: "Programma",
  anders: "Anders",
};

/**
 * Verstuurt het bericht via Resend (zie src/lib/email.ts).
 * Zonder e-mailkoppeling: lokaal doen we alsof het gelukt is (om te testen),
 * op productie weigeren we eerlijk zodat er geen berichten verloren gaan.
 */
async function deliverMessage(input: ContactInput): Promise<void> {
  const inbox = getInboxAddress();
  if (isEmailConfigured() && inbox) {
    await sendEmail({
      to: inbox,
      replyTo: input.email,
      content: contactNotificationEmail({
        name: input.name,
        email: input.email,
        subject: SUBJECT_LABELS[input.subject] ?? input.subject,
        message: input.message,
      }),
    });
    return;
  }
  if (process.env.NODE_ENV === "production") {
    throw new DeliveryNotConfiguredError("Geen e-mailprovider gekoppeld");
  }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request.headers, ALLOWED_HOSTS)) {
    return respond(403, { success: false, error: "Dit verzoek is niet toegestaan." });
  }
  if (!isJsonRequest(request.headers)) {
    return respond(415, { success: false, error: "Ongeldig verzoek." });
  }

  const limit = checkRateLimit(getClientIp(request.headers));
  if (!limit.allowed) {
    return respond(
      429,
      { success: false, error: "Je hebt veel berichten kort na elkaar verstuurd. Probeer het over een paar minuten opnieuw." },
      { "Retry-After": String(limit.retryAfterSeconds) },
    );
  }

  const parsed = contactSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return respond(400, { success: false, error: "Controleer de gemarkeerde velden en probeer het opnieuw." });
  }

  // Honeypot ingevuld: doe alsof het gelukt is, zodat bots geen signaal krijgen.
  if (parsed.data.website) {
    return respond(200, { success: true });
  }

  try {
    await deliverMessage(parsed.data);
    return respond(200, { success: true });
  } catch (error: unknown) {
    if (error instanceof DeliveryNotConfiguredError) {
      console.error("[api/contact] Contactformulier is nog niet gekoppeld aan een e-mailprovider");
      return respond(503, {
        success: false,
        error: `Het formulier werkt nog niet. Mail ons direct op ${SITE.contact.email}, dan helpen we je snel verder.`,
      });
    }
    console.error("[api/contact] Bericht versturen mislukt", error);
    return respond(502, { success: false, error: "Je bericht kon niet worden verstuurd. Probeer het later opnieuw of mail ons direct." });
  }
}
