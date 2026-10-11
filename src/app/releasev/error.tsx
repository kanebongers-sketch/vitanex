"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "@rv/components/ui/Button";
import { Container } from "@rv/components/ui/Container";

/** Foutscherm van de webshop: vriendelijk, in de eigen stijl, met een uitweg. */
export default function ReleaseVError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[releasev] Paginafout", error.digest ?? error.message);
  }, [error]);

  return (
    <section className="py-section">
      <Container size="prose">
        <h1 className="font-display text-display-lg uppercase">Er ging iets mis.</h1>
        <p className="mt-6 text-lead text-ink-soft">Probeer het opnieuw. Lukt het niet, kijk dan later nog eens of neem contact met ons op.</p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Button onClick={reset}>Opnieuw proberen</Button>
          <ButtonLink href="/" variant="secondary">Naar de homepage</ButtonLink>
        </div>
      </Container>
    </section>
  );
}
