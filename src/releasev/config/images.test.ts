import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { IMAGES, isStockImage } from "./images";

describe("beeldbank", () => {
  it("markeert stockfoto's en AI-beelden als sfeerbeeld, eigen foto's niet", () => {
    expect(isStockImage("https://images.unsplash.com/photo-1")).toBe(true);
    expect(isStockImage("/releasev/images/ai/hero.webp")).toBe(true);
    expect(isStockImage("/releasev/images/hero.jpg")).toBe(false);
    expect(isStockImage(undefined)).toBe(false);
  });

  it("verwijst alleen naar lokale beelden die echt bestaan", () => {
    const local = Object.values(IMAGES).filter((image) => image.src.startsWith("/"));
    expect(local.length).toBeGreaterThan(0);
    for (const image of local) {
      expect(existsSync(path.join(process.cwd(), "public", image.src)), image.src).toBe(true);
    }
  });
});
