/**
 * Afbeeldingsloader voor next/image (geldt voor de HELE app, zie next.config.ts).
 *
 * - Unsplash-foto's (tijdelijk, RELEASE V) laten we door Unsplash zelf verkleinen.
 *   Dat scheelt werkgeheugen op de server (Render-instance: 512 MB).
 * - Alle andere afbeeldingen gedragen zich precies als met de standaardloader van
 *   Next.js: via /_next/image, met kwaliteit 75 als er niets is opgegeven.
 *   svg-, data- en blob-afbeeldingen gaan ongewijzigd door (net als standaard).
 */
interface LoaderInput {
  src: string;
  width: number;
  quality?: number;
}

const UNSPLASH_HOST = "https://images.unsplash.com/";
const UNSPLASH_DEFAULT_QUALITY = 70;
const NEXT_DEFAULT_QUALITY = 75;

function isPassthrough(src: string): boolean {
  if (src.startsWith("data:") || src.startsWith("blob:")) return true;
  const path = src.split("?")[0] ?? "";
  return path.toLowerCase().endsWith(".svg");
}

export default function imageLoader({ src, width, quality }: LoaderInput): string {
  if (src.startsWith(UNSPLASH_HOST)) {
    const url = new URL(src);
    url.searchParams.set("w", String(width));
    url.searchParams.set("q", String(quality ?? UNSPLASH_DEFAULT_QUALITY));
    url.searchParams.set("auto", "format");
    url.searchParams.set("fit", "max");
    return url.toString();
  }
  if (isPassthrough(src)) return src;
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality ?? NEXT_DEFAULT_QUALITY}`;
}
