const DATE_FORMAT = new Intl.DateTimeFormat("nl-NL", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** "2026-10-11" → "11 oktober 2026". */
export function formatArticleDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) throw new RangeError(`Ongeldige artikeldatum: ${isoDate}`);
  return DATE_FORMAT.format(date);
}
