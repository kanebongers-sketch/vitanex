import { SITE } from "@rv/config/site";
import { isSiteHidden } from "@rv/lib/site-mode";

/**
 * robots.txt voor releasev.nl (src/proxy.ts herschrijft /robots.txt hierheen).
 * Verborgen stand: crawlen mag, zodat Google de noindex-header ziet, maar zonder sitemap.
 */
export function GET(): Response {
  const lines = isSiteHidden()
    ? ["User-Agent: *", "Allow: /"]
    : ["User-Agent: *", "Allow: /", "Disallow: /api/", "Disallow: /bedankt", "", `Host: ${SITE.url}`, `Sitemap: ${SITE.url}/sitemap.xml`];
  return new Response(`${lines.join("\n")}\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
