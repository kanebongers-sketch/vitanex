import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MentaForce – Burn-out preventie voor Nederlandse teams",
  description: "MentaForce geeft HR-teams realtime inzicht in het welzijn van medewerkers. Herken burn-out risico's vroeg – anoniem, AVG-conform en actiegericht.",
  keywords: ["burn-out preventie", "vitaliteit werkplek", "HR dashboard", "welzijn medewerkers", "Nederland"],
  openGraph: {
    title: "MentaForce – Burn-out preventie voor Nederlandse teams",
    description: "Realtime inzicht in het welzijn van je team. Herken risico's vroeg – anoniem, AVG-conform en actiegericht.",
    locale: "nl_NL",
    type: "website",
  },
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
