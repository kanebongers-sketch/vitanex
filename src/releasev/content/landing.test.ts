import { describe, expect, it } from "vitest";
import {
  LANDING_SLUGS,
  getBoxItems,
  getLanding,
  getLandingTools,
  getLandingVariant,
  isLandingSlug,
  totalMinutes,
  type LandingContent,
} from "./landing";

const FORBIDDEN = [/trainersopleiding/i, /valkenswaard/i, /academy/i, /genez/i, /pijn verhelp/i, /blessures? voorkom/i, /behandel/i, /\bop=op\b/i, /nog maar/i];

describe("landingspagina-content", () => {
  it("herkent alleen de drie doelgroep-slugs", () => {
    expect(LANDING_SLUGS).toEqual(["kantoor", "hardlopen", "kracht"]);
    expect(isLandingSlug("hardlopen")).toBe(true);
    expect(isLandingSlug("bestaat-niet")).toBe(false);
  });

  it.each(LANDING_SLUGS)("%s koppelt aan een bestaande variant en bestaande tools", (slug) => {
    const landing = getLanding(slug);
    expect(landing.slug).toBe(slug);
    expect(getLandingVariant(landing).id).toBe(landing.variantId);
    const tools = getLandingTools(landing);
    expect(tools.length).toBeGreaterThanOrEqual(3);
    tools.forEach((tool) => {
      expect(tool.zones.length).toBeGreaterThan(0);
      expect(tool.audienceUse.length).toBeGreaterThan(0);
    });
    expect(landing.faq.length).toBeGreaterThanOrEqual(4);
    expect(landing.faq.length).toBeLessThanOrEqual(5);
  });

  it.each(LANDING_SLUGS)("%s bevat geen medische claims of nep-urgentie", (slug) => {
    const text = JSON.stringify(getLanding(slug));
    FORBIDDEN.forEach((pattern) => expect(text).not.toMatch(pattern));
  });

  it("gooit een duidelijke fout bij een onbekende tool", () => {
    const landing = getLanding("kracht");
    const broken: LandingContent = { ...landing, tools: { ...landing.tools, items: [{ id: "roller", use: "x" }] } };
    expect(() => getLandingTools(broken, [])).toThrow(/roller/);
  });

  it("telt de minuten van een voorbeelddag op", () => {
    expect(totalMinutes([{ minutes: "2 min" }, { minutes: "6 min" }])).toBe(8);
    expect(totalMinutes([{ minutes: "ca. 2" }])).toBeNull();
  });

  it("noemt de variant in de doos-lijst", () => {
    const variant = getLandingVariant(getLanding("hardlopen"));
    expect(getBoxItems(variant).some((item) => item.includes("hardlopers"))).toBe(true);
  });
});
