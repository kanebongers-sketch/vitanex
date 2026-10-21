import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SITE_VERBORGEN } from "@/lib/site-modus";

export const metadata: Metadata = {
  title: "MentaForce – Elke ochtend weet je wat vandaag telt",
  description: "Je slaap, je stappen en hoe je je voelt, samen in één kaart per dag. Met inzichten uit gepubliceerd onderzoek, bron erbij. AVG-conform.",
  keywords: ["slaap", "stappen", "stress", "welzijn", "gezondheid app", "Health Connect", "Apple Health", "Nederland"],
  openGraph: {
    title: "MentaForce – Elke ochtend weet je wat vandaag telt",
    description: "Slaap, beweging en hoe je je voelt, samen in één dagkaart, met inzichten uit onderzoek.",
    locale: "nl_NL",
    type: "website",
  },
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  // Tijdelijk verborgen (zie lib/site-modus.ts). De echte 307 zit in next.config.ts;
  // dit is het vangnet voor een pad dat daar (nog) niet in staat.
  if (SITE_VERBORGEN) redirect("/login");
  return <>{children}</>;
}
