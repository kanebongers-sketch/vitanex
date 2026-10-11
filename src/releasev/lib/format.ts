import type { Money } from "./commerce/types";

const wholeEuro = new Intl.NumberFormat("nl-NL", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const centEuro = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" });

/** Toont €69 bij hele bedragen en €69,50 bij centen. */
export function formatMoney(money: Money): string {
  const euros = money.amount / 100;
  return Number.isInteger(euros) ? wholeEuro.format(euros) : centEuro.format(euros);
}

/** Bedrag als decimale string voor schema.org (bijv. "69.00"). */
export function toDecimalString(money: Money): string {
  return (money.amount / 100).toFixed(2);
}
