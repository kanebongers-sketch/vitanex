import type { Metadata } from "next";
import { ProgramHero } from "./_components/ProgramHero";
import { ProgramPhases } from "./_components/ProgramPhases";
import { ProgramVariants } from "./_components/ProgramVariants";
import { ProgramAccess, ProgramCta } from "./_components/ProgramAccess";

export const metadata: Metadata = {
  title: "Het programma: 14 dagen herstel",
  description:
    "Ontdek het videoprogramma ‘14 dagen herstel’: tien tot vijftien minuten per dag, in drie varianten voor kantoorwerkers, hardlopers en krachtsporters. Toegang via QR-code, zonder account.",
  alternates: { canonical: "/programma" },
};

export default function ProgrammaPage() {
  return (
    <>
      <ProgramHero />
      <ProgramPhases />
      <ProgramVariants />
      <ProgramAccess />
      <ProgramCta />
    </>
  );
}
