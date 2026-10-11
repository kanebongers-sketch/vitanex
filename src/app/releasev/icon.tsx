import { ImageResponse } from "next/og";
import { ICON_SVG } from "@rv/components/layout/logo-paths";

/**
 * Favicon: de oranje V uit het logo op bijna-zwart.
 * ImageResponse kan geen CSS-variabelen lezen; de achtergrond is gelijk aan
 * --rv-color-canvas in src/releasev/styles/tokens.css.
 */
const CANVAS = "#0b0b0c";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

const ICON_SRC = `data:image/svg+xml;base64,${Buffer.from(ICON_SVG).toString("base64")}`;

export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: CANVAS, borderRadius: 14 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={ICON_SRC} width={64} height={64} alt="" />
      </div>
    ),
    size,
  );
}
