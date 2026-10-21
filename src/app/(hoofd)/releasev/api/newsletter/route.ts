import { NextResponse } from "next/server";
import { SITE } from "@rv/config/site";
import { isEmailConfigured, sendEmail } from "@rv/lib/email";
import { newsletterConfirmationEmail } from "@rv/lib/email-templates";
import { buildConfirmUrl, getSigningSecret } from "@rv/lib/newsletter";
import { newsletterSchema, type NewsletterApiResponse } from "@rv/lib/newsletter-schema";
import { createRateLimiter, getClientIp } from "@rv/lib/rate-limit";
import { isJsonRequest, isSameOrigin } from "@rv/lib/request-guards";

const ALLOWED_HOSTS = [new URL(SITE.url).host];
const checkRateLimit = createRateLimiter({ limit: 5, windowMs: 10 * 60 * 1000 });

function respond(status: number, body: NewsletterApiResponse, headers?: HeadersInit) {
  return NextResponse.json(body, { status, headers });
}

export async function POST(request: Request) {
  if (!isSameOrigin(request.headers, ALLOWED_HOSTS)) return respond(403, { success: false, error: "Dit verzoek is niet toegestaan." });
  if (!isJsonRequest(request.headers)) return respond(415, { success: false, error: "Ongeldig verzoek." });

  const limit = checkRateLimit(getClientIp(request.headers));
  if (!limit.allowed) {
    return respond(429, { success: false, error: "Te veel pogingen. Probeer het later opnieuw." }, { "Retry-After": String(limit.retryAfterSeconds) });
  }

  const raw: unknown = await request.json().catch(() => undefined);
  // Honeypot ingevuld → doe alsof het gelukt is, maar sla niets op
  if (raw && typeof raw === "object" && "website" in raw && (raw as { website?: unknown }).website) {
    return respond(200, { success: true });
  }
  const parsed = newsletterSchema.safeParse(raw);
  if (!parsed.success) {
    return respond(400, { success: false, error: parsed.error.issues[0]?.message ?? "Controleer je invoer." });
  }

  const secret = getSigningSecret();
  if (!isEmailConfigured() || !secret) {
    if (process.env.NODE_ENV === "production") {
      console.error("[api/newsletter] Nieuwsbrief is nog niet gekoppeld (Resend of RELEASEV_NEWSLETTER_SIGNING_SECRET ontbreekt)");
      return respond(503, { success: false, error: "Inschrijven is nog niet mogelijk. Probeer het binnenkort opnieuw." });
    }
    return respond(200, { success: true }); // lokaal testen zonder e-mailkoppeling
  }

  // Double opt-in: eerst een bevestigingsmail; pas na de klik wordt het adres toegevoegd.
  try {
    const email = parsed.data.email.toLowerCase();
    await sendEmail({ to: email, content: newsletterConfirmationEmail({ confirmUrl: buildConfirmUrl(email, secret) }) });
    return respond(200, { success: true });
  } catch (error) {
    console.error("[api/newsletter] Bevestigingsmail versturen mislukt", error instanceof Error ? error.message : error);
    return respond(502, { success: false, error: "Inschrijven lukt nu even niet. Probeer het later opnieuw." });
  }
}
