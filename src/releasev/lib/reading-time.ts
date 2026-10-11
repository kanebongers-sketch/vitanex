/**
 * Leestijd-schatting voor kennisartikelen. Puur en zonder afhankelijkheden,
 * zodat het zowel op de server als in tests gebruikt kan worden.
 */

/** Gemiddelde leessnelheid voor Nederlandse lopende tekst op een scherm. */
export const DEFAULT_WORDS_PER_MINUTE = 200;

/** Telt woorden: reeksen tekens met minstens een letter of cijfer. */
export function countWords(text: string): number {
  return text.split(/\s+/).filter((token) => /[\p{L}\p{N}]/u.test(token)).length;
}

/** Geschatte leestijd in hele minuten (naar boven afgerond, minimaal 1). */
export function estimateReadingMinutes(
  texts: readonly string[],
  wordsPerMinute: number = DEFAULT_WORDS_PER_MINUTE,
): number {
  if (!Number.isFinite(wordsPerMinute) || wordsPerMinute <= 0) {
    throw new RangeError(`wordsPerMinute moet een positief getal zijn, kreeg: ${wordsPerMinute}`);
  }
  const words = texts.reduce((total, text) => total + countWords(text), 0);
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

export function formatReadingTime(minutes: number): string {
  return `${minutes} min lezen`;
}
