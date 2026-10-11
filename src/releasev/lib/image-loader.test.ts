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

  it("gedraagt zich voor andere afbeeldingen als de standaardloader van Next.js", () => {
    expect(imageLoader({ src: "/images/hero.jpg", width: 1080 })).toBe("/_next/image?url=%2Fimages%2Fhero.jpg&w=1080&q=75");
    expect(imageLoader({ src: "https://abc.supabase.co/storage/v1/object/public/x.png", width: 640, quality: 75 })).toBe(
      "/_next/image?url=https%3A%2F%2Fabc.supabase.co%2Fstorage%2Fv1%2Fobject%2Fpublic%2Fx.png&w=640&q=75",
    );
  });

  it("laat svg-, data- en blob-afbeeldingen ongewijzigd", () => {
    expect(imageLoader({ src: "/brand/logo.svg", width: 200 })).toBe("/brand/logo.svg");
    expect(imageLoader({ src: "/icons/x.SVG?v=2", width: 64 })).toBe("/icons/x.SVG?v=2");
    expect(imageLoader({ src: "data:image/png;base64,AAAA", width: 10 })).toBe("data:image/png;base64,AAAA");
    expect(imageLoader({ src: "blob:https://x/123", width: 10 })).toBe("blob:https://x/123");
  });
});
