import { notFound } from "next/navigation";

/** Onbekende adressen op releasev.nl tonen de 404 van de webshop (niet die van Fit Factory). */
export default function ReleaseVCatchAll(): never {
  notFound();
}
