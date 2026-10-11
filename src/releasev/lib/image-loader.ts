/**
 * Afbeeldingsloader voor next/image (geldt voor de HELE app, zie next.config.ts).
 *
 * Let op: met een eigen loader zet Next.js de ingebouwde optimalisatie (/_next/image)
 * helemaal uit; die route geeft dan 404. Daarom:
 * - Unsplash-foto's (tijdelijk, RELEASE V) laten we door Unsplash zelf verkleinen.
 *   Dat scheelt werkgeheugen op de server (Render-instance: 512 MB).
 * - Alle andere afbeeldingen gaan ongewijzigd door, zoals bij `unoptimized`.
 *   Lever lokale beelden dus al in een passend formaat aan (bijv. WebP van max. ~1600 px).
 */
interface LoaderInput {
  src: string;
  width: number;
  quality?: number;
}

const UNSPLASH_HOST = "https://images.unsplash.com/";
const UNSPLASH_DEFAULT_QUALITY = 70;

export default function imageLoader({ src, width, quality }: LoaderInput): string {
  if (!src.startsWith(UNSPLASH_HOST)) return src;
  const url = new URL(src);
  url.searchParams.set("w", String(width));
  url.searchParams.set("q", String(quality ?? UNSPLASH_DEFAULT_QUALITY));
  url.searchParams.set("auto", "format");
  url.searchParams.set("fit", "max");
  return url.toString();
}
