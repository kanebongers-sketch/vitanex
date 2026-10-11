import { describe, expect, it } from "vitest";
import { countWords, estimateReadingMinutes, formatReadingTime } from "./reading-time";

describe("countWords", () => {
  it("telt woorden gescheiden door witruimte", () => {
    expect(countWords("Rol rustig over je kuit.")).toBe(5);
  });

  it("negeert dubbele spaties, tabs en nieuwe regels", () => {
    expect(countWords("  foam \t roller\n\nlacrosse   bal  ")).toBe(4);
  });

  it("geeft 0 voor lege of alleen-witruimte tekst", () => {
    expect(countWords("")).toBe(0);
    expect(countWords("   \n ")).toBe(0);
  });

  it("telt losse leestekens niet als woord", () => {
    expect(countWords("Begin rustig — en adem uit.")).toBe(5);
  });
});

describe("estimateReadingMinutes", () => {
  it("rondt naar boven af op hele minuten", () => {
    const text = Array.from({ length: 201 }, () => "woord").join(" ");
    expect(estimateReadingMinutes([text])).toBe(2);
  });

  it("telt alle tekstblokken bij elkaar op", () => {
    const block = Array.from({ length: 100 }, () => "woord").join(" ");
    expect(estimateReadingMinutes([block, block, block, block])).toBe(2);
  });

  it("geeft minimaal 1 minuut, ook voor lege input", () => {
    expect(estimateReadingMinutes([])).toBe(1);
    expect(estimateReadingMinutes(["kort"])).toBe(1);
  });

  it("respecteert een eigen leessnelheid", () => {
    const text = Array.from({ length: 300 }, () => "woord").join(" ");
    expect(estimateReadingMinutes([text], 100)).toBe(3);
  });

  it("weigert een ongeldige leessnelheid", () => {
    expect(() => estimateReadingMinutes(["tekst"], 0)).toThrow(RangeError);
    expect(() => estimateReadingMinutes(["tekst"], Number.NaN)).toThrow(RangeError);
  });
});

describe("formatReadingTime", () => {
  it("formatteert minuten als Nederlands label", () => {
    expect(formatReadingTime(1)).toBe("1 min lezen");
    expect(formatReadingTime(6)).toBe("6 min lezen");
  });
});
