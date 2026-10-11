import { NextResponse, type NextRequest } from "next/server";
import { beslisReleaseV } from "./host-routing";
import { NOINDEX_HEADER, getPreviewCredentials, isAuthorized, isSiteHidden } from "./site-mode";

/**
 * Proxy-stap voor RELEASE V. Geeft `null` terug als het verzoek niet van de
 * webshop is; dan handelt de Fit Factory-proxy het af zoals altijd.
 *
 * Verborgen stand (RELEASEV_SITE_MODE ≠ "live"): noindex op elke response en,
 * met RELEASEV_PREVIEW_PASSWORD, een wachtwoord voor de hele webshop.
 * De Stripe-webhook blijft altijd bereikbaar.
 */
const ALWAYS_OPEN = ["/api/stripe/webhook"];

function unauthorized(): NextResponse {
  return new NextResponse("Deze site is nog niet open.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="RELEASE V preview", charset="UTF-8"',
      [NOINDEX_HEADER.key]: NOINDEX_HEADER.value,
      "Cache-Control": "no-store",
    },
  });
}

export function releaseVProxy(request: NextRequest): NextResponse | null {
  const { pathname, search } = request.nextUrl;
  const besluit = beslisReleaseV(request.headers.get("host"), pathname, search);

  if (besluit.soort === "niet-van-mij") return null;
  if (besluit.soort === "omleiden") return NextResponse.redirect(besluit.url, 308);

  const isHidden = isSiteHidden();
  const credentials = isHidden ? getPreviewCredentials() : null;
  const isOpenPath = ALWAYS_OPEN.some((path) => pathname.startsWith(path));
  if (credentials && !isOpenPath && !isAuthorized(request.headers.get("authorization"), credentials)) {
    return unauthorized();
  }

  let response: NextResponse;
  if (besluit.soort === "herschrijven") {
    const doel = request.nextUrl.clone();
    doel.pathname = besluit.pad;
    response = NextResponse.rewrite(doel);
  } else {
    response = NextResponse.next();
  }
  if (isHidden) response.headers.set(NOINDEX_HEADER.key, NOINDEX_HEADER.value);
  return response;
}
