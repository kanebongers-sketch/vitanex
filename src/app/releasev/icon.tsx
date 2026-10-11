import { ImageResponse } from "next/og";
import { SITE } from "@rv/config/site";

/**
 * Favicon: vet monogram in licht op bijna-zwart, met signaaloranje punt.
 * ImageResponse kan geen CSS-variabelen lezen; waarden gelijk houden aan
 * src/styles/tokens.css (--color-canvas, --color-ink, --color-accent).
 */
const COLORS = { canvas: "#0b0b0c", ink: "#f4f3f0", accent: "#ff6b3d" } as const;

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/** Eerste letter van de merknaam; valt terug op "R" zolang de placeholder er staat. */
function monogram(): string {
  const letter = SITE.brandName.replace(/[^\p{L}\p{N}]/gu, "").charAt(0);
  return SITE.brandName.startsWith("[") || !letter ? "R" : letter.toUpperCase();
}

/** Laadt Archivo ExtraBold voor alleen het monogram; valt terug op het standaardfont. */
async function loadHeadingFont(text: string): Promise<ArrayBuffer | null> {
  try {
    const cssUrl = `https://fonts.googleapis.com/css2?family=Archivo:wght@800&text=${encodeURIComponent(text)}`;
    const css = await (await fetch(cssUrl)).text();
    const fontUrl = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
    if (!fontUrl) return null;
    const response = await fetch(fontUrl);
    return response.ok ? await response.arrayBuffer() : null;
  } catch (error) {
    console.error("[icon] Kopfont laden mislukt:", error instanceof Error ? error.message : error);
    return null;
  }
}

export default async function Icon() {
  const letter = monogram();
  const font = await loadHeadingFont(letter);

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: COLORS.canvas, color: COLORS.ink, borderRadius: 14, fontSize: 44, fontWeight: 800, fontFamily: font ? "Archivo" : "sans-serif", letterSpacing: "-0.04em", position: "relative" }}>
        {letter}
        <span style={{ position: "absolute", right: 10, bottom: 10, width: 9, height: 9, borderRadius: 999, background: COLORS.accent }} />
      </div>
    ),
    { ...size, fonts: font ? [{ name: "Archivo", data: font, weight: 800, style: "normal" }] : undefined },
  );
}
