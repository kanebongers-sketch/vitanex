import type { Metadata } from "next";
import { getFeaturedProduct } from "@rv/lib/commerce";
import { Hero } from "@rv/components/home/Hero";
import { Problem } from "@rv/components/home/Problem";
import { KitBento } from "@rv/components/home/KitBento";
import { Program } from "@rv/components/home/Program";
import { HowItWorks } from "@rv/components/home/HowItWorks";
import { Trainer } from "@rv/components/home/Trainer";
import { QuoteBand } from "@rv/components/ui/QuoteBand";
import { Reviews } from "@rv/components/home/Reviews";
import { HomeFaq } from "@rv/components/home/HomeFaq";
import { ClosingCta } from "@rv/components/home/ClosingCta";
import { MobileStickyCta } from "@rv/components/home/MobileStickyCta";
import { formatMoney } from "@rv/lib/format";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/** Homepage. Alle teksten staan in src/content/home.ts. */
export default function HomePage() {
  const product = getFeaturedProduct();

  return (
    <>
      <Hero product={product} />
      <Problem />
      <KitBento product={product} />
      <Program />
      <HowItWorks />
      <QuoteBand />
      <Trainer />
      <Reviews />
      <HomeFaq product={product} />
      <ClosingCta product={product} />
      <MobileStickyCta priceLabel={formatMoney(product.price)} />
    </>
  );
}
