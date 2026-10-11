import { describe, expect, it } from "vitest";
import { beslisReleaseV, isReleaseVHost } from "./host-routing";

describe("isReleaseVHost", () => {
  it("herkent het domein, www, een poort en de lokale ontwikkelhost", () => {
    expect(isReleaseVHost("releasev.nl")).toBe(true);
    expect(isReleaseVHost("WWW.ReleaseV.nl:443")).toBe(true);
    expect(isReleaseVHost("releasev.localhost:3000")).toBe(true);
    expect(isReleaseVHost("fitfactorypt.nl")).toBe(false);
    expect(isReleaseVHost(null)).toBe(false);
  });
});

describe("beslisReleaseV op releasev.nl", () => {
  it("herschrijft pagina's en API's naar /releasev", () => {
    expect(beslisReleaseV("releasev.nl", "/")).toEqual({ soort: "herschrijven", pad: "/releasev" });
    expect(beslisReleaseV("releasev.nl", "/product/recovery-mobility-kit")).toEqual({
      soort: "herschrijven",
      pad: "/releasev/product/recovery-mobility-kit",
    });
    expect(beslisReleaseV("releasev.nl", "/api/checkout")).toEqual({ soort: "herschrijven", pad: "/releasev/api/checkout" });
  });

  it("stuurt favicon, robots en sitemap naar de webshopversie", () => {
    expect(beslisReleaseV("releasev.nl", "/favicon.ico")).toEqual({ soort: "herschrijven", pad: "/releasev/icon" });
    expect(beslisReleaseV("releasev.nl", "/robots.txt")).toEqual({ soort: "herschrijven", pad: "/releasev/robots.txt" });
    expect(beslisReleaseV("releasev.nl", "/sitemap.xml")).toEqual({ soort: "herschrijven", pad: "/releasev/sitemap.xml" });
  });

  it("laat al herschreven paden door en stuurt www naar het kale domein", () => {
    expect(beslisReleaseV("releasev.nl", "/releasev/opengraph-image")).toEqual({ soort: "door" });
    expect(beslisReleaseV("www.releasev.nl", "/kennis", "?a=1")).toEqual({ soort: "omleiden", url: "https://releasev.nl/kennis?a=1" });
  });
});

describe("beslisReleaseV op andere domeinen", () => {
  it("bemoeit zich niet met de Fit Factory-app", () => {
    expect(beslisReleaseV("fitfactorypt.nl", "/kane")).toEqual({ soort: "niet-van-mij" });
    expect(beslisReleaseV("fitfactorypt.nl", "/")).toEqual({ soort: "niet-van-mij" });
  });

  it("toont de webshop nooit op een ander domein", () => {
    expect(beslisReleaseV("fitfactorypt.nl", "/releasev/product", "?x=1")).toEqual({
      soort: "omleiden",
      url: "https://releasev.nl/product?x=1",
    });
    expect(beslisReleaseV("fitfactorypt.nl", "/releasev")).toEqual({ soort: "omleiden", url: "https://releasev.nl/" });
  });

  it("laat /releasev lokaal door om te kunnen ontwikkelen", () => {
    expect(beslisReleaseV("localhost:3000", "/releasev/product")).toEqual({ soort: "door" });
  });
});
