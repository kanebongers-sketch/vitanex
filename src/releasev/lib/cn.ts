/** Voegt classNames samen en slaat lege waarden over. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
