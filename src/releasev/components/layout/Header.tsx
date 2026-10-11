import Link from "next/link";
import { MAIN_NAV } from "@rv/config/site";
import { Container } from "@rv/components/ui/Container";
import { CartButton } from "./CartButton";
import { MobileNav } from "./MobileNav";
import { Wordmark } from "./Wordmark";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-ink/10 bg-canvas/75 backdrop-blur-xl backdrop-saturate-150">
      <Container className="flex h-16 items-center justify-between gap-6">
        <Wordmark />

        <nav aria-label="Hoofdmenu" className="hidden md:block">
          <ul className="flex items-center gap-9 text-sm font-medium">
            {MAIN_NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="link-underline py-1 text-ink-soft transition-colors duration-300 hover:text-ink focus-visible:text-ink">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-1">
          <CartButton />
          <MobileNav />
        </div>
      </Container>
    </header>
  );
}
