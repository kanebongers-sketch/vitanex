import { NextResponse } from "next/server";
import { SITE } from "@rv/config/site";
import { getProductById } from "@rv/lib/commerce";
import {
  buildLineItems,
  buildOrderMetadata,
  buildSessionParams,
  parseCheckoutBody,
  parseCheckoutExtras,
} from "@rv/lib/checkout";
import { createRateLimiter, getClientIp } from "@rv/lib/rate-limit";
import { isJsonRequest, isSameOrigin } from "@rv/lib/request-guards";
import { getStripe } from "@rv/lib/stripe";

/** Envelope: { success, data?: { url }, error? } */
type CheckoutResponse = { success: true; data: { url: string } } | { success: false; error: string };

const ALLOWED_HOSTS = [new URL(SITE.url).host];
const checkLimit = createRateLimiter({ limit: 10, windowMs: 60_000 });

function fail(status: number, error: string, headers?: HeadersInit) {
  return NextResponse.json<CheckoutResponse>({ success: false, error }, { status, headers });
}

async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return undefined;
  }
}

/** Alle checks voor Stripe: origin, content-type, rate limit en body-validatie. */
async function validateRequest(req: Request) {
  if (!isSameOrigin(req.headers, ALLOWED_HOSTS)) return { response: fail(403, "Verzoek geweigerd.") };
  if (!isJsonRequest(req.headers)) return { response: fail(415, "Verwacht JSON.") };

  const limit = checkLimit(getClientIp(req.headers));
  if (!limit.allowed) {
    return {
      response: fail(429, "Te veel pogingen. Probeer het over een minuut opnieuw.", {
        "Retry-After": String(limit.retryAfterSeconds),
      }),
    };
  }

  const body = await readJson(req);
  const parsed = parseCheckoutBody(body);
  if (!parsed.ok) return { response: fail(400, parsed.error) };

  const lineItems = buildLineItems(parsed.value, getProductById, process.env);
  if (!lineItems.ok) return { response: fail(400, lineItems.error) };
  return {
    lineItems: lineItems.value,
    firstProductId: parsed.value[0]?.productId,
    metadata: buildOrderMetadata(parseCheckoutExtras(body), readTrackingContext(req)),
  };
}

/** Kapotte cookiewaarden mogen het afrekenen nooit blokkeren. */
function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return "";
  }
}

/** Meta-cookies en browsergegevens voor de Conversions API (alleen bewaard met toestemming). */
function readTrackingContext(req: Request): Record<string, string> {
  const cookies = Object.fromEntries(
    (req.headers.get("cookie") ?? "")
      .split(";")
      .map((part) => part.trim().split("="))
      .filter(([key]) => key === "_fbp" || key === "_fbc")
      .map(([key, ...rest]) => [key, safeDecode(rest.join("="))]),
  );
  return {
    fbp: cookies._fbp ?? "",
    fbc: cookies._fbc ?? "",
    client_user_agent: req.headers.get("user-agent") ?? "",
    client_ip: getClientIp(req.headers),
  };
}

function cancelPathFor(productId: string | undefined): string {
  const product = productId ? getProductById(productId) : undefined;
  return product ? `/product/${product.slug}` : "/";
}

export async function POST(req: Request) {
  const result = await validateRequest(req);
  if ("response" in result) return result.response;

  const stripe = getStripe();
  if (!stripe) {
    return fail(503, "Afrekenen is nog niet geconfigureerd. Probeer het later opnieuw of neem contact met ons op.");
  }

  try {
    const session = await stripe.checkout.sessions.create(
      buildSessionParams(result.lineItems, {
        siteUrl: SITE.url,
        cancelPath: cancelPathFor(result.firstProductId),
        shippingCountries: SITE.shipping.countries,
        metadata: result.metadata,
      }),
    );
    if (!session.url) throw new Error("Checkout Session zonder url");
    return NextResponse.json<CheckoutResponse>({ success: true, data: { url: session.url } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    console.error("[checkout] Stripe-sessie aanmaken mislukt:", message);
    return fail(502, "Afrekenen lukt nu even niet. Probeer het zo opnieuw.");
  }
}
