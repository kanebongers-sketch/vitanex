import type { Metadata } from "next";
import { ButtonLink } from "@rv/components/ui/Button";
import { Container } from "@rv/components/ui/Container";
import { PRODUCT_PATH } from "@rv/config/site";

export const metadata: Metadata = {
  title: "Nieuwsbrief",
  robots: { index: false, follow: false },
};

const STATES = {
  bevestigd: {
    title: "Je bent ingeschreven.",
    body: "Bedankt. Je krijgt maximaal een mail per maand met herstel-tips en nieuws. Uitschrijven kan via de link onderaan elke mail.",
  },
  ongeldig: {
    title: "Deze link werkt niet meer.",
    body: "De bevestigingslink is verlopen of niet geldig. Schrijf je opnieuw in via het formulier onderaan de pagina; je krijgt dan een nieuwe link.",
  },
  fout: {
    title: "Er ging iets mis.",
    body: "We konden je inschrijving nu niet afronden. Probeer de link later opnieuw of schrijf je opnieuw in.",
  },
} as const;

type Status = keyof typeof STATES;

interface NewsletterPageProps {
  searchParams: Promise<{ status?: string | string[] }>;
}

export default async function NewsletterPage({ searchParams }: NewsletterPageProps) {
  const { status } = await searchParams;
  const key: Status = typeof status === "string" && status in STATES ? (status as Status) : "ongeldig";
  const state = STATES[key];

  return (
    <section className="py-section">
      <Container size="prose">
        <p className="flex items-center gap-3 text-eyebrow font-semibold uppercase text-ink-muted">
          <span aria-hidden className="size-1.5 rounded-full bg-accent" />
          Nieuwsbrief
        </p>
        <h1 className="mt-6 font-display text-display-lg uppercase">{state.title}</h1>
        <p className="mt-6 max-w-[34rem] text-lead text-ink-soft">{state.body}</p>
        <div className="mt-10 flex flex-wrap gap-3">
          <ButtonLink href={PRODUCT_PATH} withArrow>
            Bekijk de kit
          </ButtonLink>
          <ButtonLink href="/kennis" variant="secondary">
            Naar de kennisbank
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
