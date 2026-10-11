import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Huisstijl voor teksten: geen gedachtestreepjes (— of –) en geen klemtoon-accenten
 * zoals "één", "én", "wél" of "vóór". Echte leenwoorden (privé, café) mogen wel.
 * Commentaarregels tellen niet mee; alleen tekst die bezoekers kunnen zien.
 */
const ROOTS = ["src/releasev/content", "src/releasev/config", "src/releasev/components", "src/app/releasev", "src/releasev/lib"];
const FORBIDDEN = /[—–]/;
const ACCENTED_WORD = /[\p{L}]*[áéíóúÁÉÍÓÚ][\p{L}]*/gu;
const ALLOWED_WORDS = new Set(["privé", "café", "cafés", "logé", "comité", "coupé", "exposé", "rosé"]);

function hasForbidden(line: string): boolean {
  if (FORBIDDEN.test(line)) return true;
  return (line.match(ACCENTED_WORD) ?? []).some((word) => !ALLOWED_WORDS.has(word.toLowerCase()));
}

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.(ts|tsx)$/.test(name) && !name.endsWith(".test.ts") ? [full] : [];
  });
}

function offendingLines(file: string): string[] {
  return readFileSync(file, "utf8")
    .split("\n")
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => !/^\s*(\/\/|\*|\/\*)/.test(line) && hasForbidden(line))
    .map(({ line, index }) => `${file}:${index + 1}: ${line.trim().slice(0, 100)}`);
}

describe("tekststijl", () => {
  it("bevat geen gedachtestreepjes of klemtoon-accenten in zichtbare tekst", () => {
    const offenders = ROOTS.flatMap(sourceFiles).flatMap(offendingLines);
    expect(offenders).toEqual([]);
  });
});
