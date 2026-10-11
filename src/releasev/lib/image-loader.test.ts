import { describe, expect, it } from "vitest";
import imageLoader from "./image-loader";

describe("imageLoader", () => {
  it("laat Unsplash zelf verkleinen met breedte, kwaliteit en automatisch formaat", () => {
    const url = new URL(imageLoader({ src: "https://images.unsplash.com/photo-123", width: 828, quality: 60 }));
    expect(url.host).toBe("images.unsplash.com");
    expect(url.searchParams.get("w")).toBe("828");
    expect(url.searchParams.get("q")).toBe("60");
    expect(url.searchParams.get("auto")).toBe("format");
  });

  it("gebruikt voor Unsplash standaard kwaliteit 70", () => {
    const url = new URL(imageLoader({ src: "https://images.unsplash.com/photo-123", width: 640 }));
    expect(url.searchParams.get("q")).toBe("70");
  });

  // Met een eigen loader bestaat /_next/image niet meer (404). Nooit daarheen verwijzen.
  it("laat alle andere afbeeldingen ongewijzigd en verwijst nooit naar /_next/image", () => {
    const sources = [
      "/fitfactory/logo-pt-400.png",
      "/releasev/images/ai/hero.webp",
      "https://abc.supabase.co/storage/v1/object/public/x.png",
      "https://images.openfoodfacts.org/images/products/1.jpg",
      "/brand/logo.svg",
      "data:image/png;base64,AAAA",
      "blob:https://x/123",
    ];
    for (const src of sources) {
      expect(imageLoader({ src, width: 640, quality: 75 })).toBe(src);
    }
  });
});
