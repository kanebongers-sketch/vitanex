/**
 * RELEASE V — domeinlogica (puur, zonder Next of env, zodat het te testen is).
 *
 * De webshop draait in dezelfde app als Fit Factory PT. De pagina's staan in
 * src/app/releasev/…; op releasev.nl herschrijft src/proxy.ts elk verzoek
 * daarheen. Bezoekers zien dus gewoon releasev.nl/product, /kennis, enz.
 *
 *  releasev.nl
 *    /…                 → herschrijven naar /releasev/…
 *    /favicon.ico       → het RELEASE V-icoon
 *    /robots.txt        → robots van de webshop
 *    /sitemap.xml       → sitemap van de webshop
 *    /releasev/…        → door (bijv. de share-afbeelding die Next zo linkt)
 *  www.releasev.nl      → omleiden naar het kale domein
 *  ander domein
 *    /releasev/…        → omleiden naar releasev.nl (lokaal: door, om te ontwikkelen)
 *    rest               → niet van de webshop
 *
 * Lokaal ontwikkelen: open http://releasev.localhost:3000 (werkt in Chrome/Firefox).
 */
export const RV_DOMEIN = "releasev.nl";
export const RV_PREFIX = "/releasev";

export type RvBeslissing =
  | { soort: "niet-van-mij" }
  | { soort: "door" }
  | { soort: "omleiden"; url: string }
  | { soort: "herschrijven"; pad: string };

function schoon(host: string | null | undefined): string {
  return (host ?? "").split(":")[0].trim().toLowerCase();
}

function isLokaal(host: string): boolean {
  return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
}

export function isReleaseVHost(host: string | null | undefined): boolean {
  const h = schoon(host);
  return h === RV_DOMEIN || h === `www.${RV_DOMEIN}` || h === "releasev.localhost";
}

function isRvPad(pad: string): boolean {
  return pad === RV_PREFIX || pad.startsWith(`${RV_PREFIX}/`);
}

/** Speciale bestanden die op releasev.nl naar de webshopversie moeten. */
const SPECIALE_PADEN: Readonly<Record<string, string>> = {
  "/favicon.ico": `${RV_PREFIX}/icon`,
  "/robots.txt": `${RV_PREFIX}/robots.txt`,
  "/sitemap.xml": `${RV_PREFIX}/sitemap.xml`,
};

export function beslisReleaseV(host: string | null | undefined, pad: string, zoek = ""): RvBeslissing {
  const h = schoon(host);

  if (!isReleaseVHost(h)) {
    if (!isRvPad(pad)) return { soort: "niet-van-mij" };
    if (isLokaal(h)) return { soort: "door" };
    const zonderPrefix = pad.slice(RV_PREFIX.length) || "/";
    return { soort: "omleiden", url: `https://${RV_DOMEIN}${zonderPrefix}${zoek}` };
  }

  if (h === `www.${RV_DOMEIN}`) return { soort: "omleiden", url: `https://${RV_DOMEIN}${pad}${zoek}` };
  if (isRvPad(pad)) return { soort: "door" };

  const speciaal = SPECIALE_PADEN[pad];
  if (speciaal) return { soort: "herschrijven", pad: speciaal };
  return { soort: "herschrijven", pad: pad === "/" ? RV_PREFIX : `${RV_PREFIX}${pad}` };
}
