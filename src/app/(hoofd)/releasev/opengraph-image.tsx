import { ImageResponse } from "next/og";
import { SITE } from "@rv/config/site";
import { LOGO_TRANSFORM, LOGO_V_PATH, LOGO_VIEWBOX, LOGO_WORD_PATH } from "@rv/components/layout/logo-paths";

/**
 * Standaard social-share afbeelding (1200x630) voor alle pagina's.
 *
 * Uitzondering op de regel "geen hardcoded kleuren": ImageResponse kan geen
 * CSS-variabelen lezen. Houd onderstaande waarden gelijk aan
 * src/styles/tokens.css (--color-canvas, --color-ink, --color-ink-muted, --color-accent, --color-line).
 */
const COLORS = {
  canvas: "#0b0b0c",
  ink: "#f4f3f0",
  inkMuted: "#8f8e89",
  accent: "#ff6b3d",
  line: "#2c2c30",
} as const;

/** Het woordmerk als afbeelding (ImageResponse rendert inline SVG het betrouwbaarst als data-URL). */
const LOGO_SRC = `data:image/svg+xml;base64,${Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${LOGO_VIEWBOX}"><g transform="${LOGO_TRANSFORM}"><path fill="${COLORS.ink}" d="${LOGO_WORD_PATH}"/><path fill="${COLORS.accent}" d="${LOGO_V_PATH}"/></g></svg>`,
).toString("base64")}`;
const LOGO_WIDTH = 300;
const LOGO_HEIGHT = Math.round((LOGO_WIDTH * Number(LOGO_VIEWBOX.split(" ")[3])) / Number(LOGO_VIEWBOX.split(" ")[2]));

export const alt = `${SITE.brandName} | Recovery & Mobility Kit`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Laadt Archivo ExtraBold (kopfont) als TTF; valt terug op het standaardfont als dat niet lukt. */
async function loadHeadingFont(text: string): Promise<ArrayBuffer | null> {
  try {
    const cssUrl = `https://fonts.googleapis.com/css2?family=Archivo:wght@800&text=${encodeURIComponent(text)}`;
    const css = await (await fetch(cssUrl)).text();
    const fontUrl = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
    if (!fontUrl) return null;
    const response = await fetch(fontUrl);
    return response.ok ? await response.arrayBuffer() : null;
  } catch (error) {
    console.error("[og] Kopfont laden mislukt:", error instanceof Error ? error.message : error);
    return null;
  }
}

export default async function OpengraphImage() {
  const titleLines = ["Recovery &", "Mobility Kit"];
  const footer = "14 dagen videoprogramma · ontwikkeld door een personal trainer";
  // Subset bevat ook hoofdletters, omdat delen met textTransform: uppercase worden gerenderd.
  const glyphs = `${SITE.brandName}${titleLines.join("")}${SITE.tagline}${footer}`;
  const font = await loadHeadingFont(`${glyphs}${glyphs.toUpperCase()}`);
  const fontFamily = font ? "Archivo" : "sans-serif";

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: COLORS.canvas, color: COLORS.ink, padding: "64px 80px", fontFamily, fontWeight: 800 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 28, textTransform: "uppercase", letterSpacing: "-0.01em" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO_SRC} width={LOGO_WIDTH} height={LOGO_HEIGHT} alt={SITE.brandName} />
          <span style={{ display: "flex", width: 16, height: 16, borderRadius: 999, background: COLORS.accent }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {titleLines.map((line) => (
            <div key={line} style={{ display: "flex", fontSize: 128, lineHeight: 0.9, letterSpacing: "-0.045em", textTransform: "uppercase" }}>
              {line}
            </div>
          ))}
          <div style={{ display: "flex", marginTop: 32, fontSize: 32, color: COLORS.inkMuted, letterSpacing: "-0.01em" }}>{SITE.tagline}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, borderTop: `2px solid ${COLORS.line}`, paddingTop: 24, fontSize: 22, color: COLORS.inkMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          <span style={{ display: "flex", width: 10, height: 10, borderRadius: 999, background: COLORS.accent }} />
          {footer}
        </div>
      </div>
    ),
    { ...size, fonts: font ? [{ name: "Archivo", data: font, weight: 800, style: "normal" }] : undefined },
  );
}
