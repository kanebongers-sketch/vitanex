import type { ReactNode } from "react";
import { Container } from "@rv/components/ui/Container";

/** Gedeelde leesopmaak voor alle juridische pagina's. */
export default function JuridischLayout({ children }: { children: ReactNode }) {
  return <Container className="pt-12 pb-section md:pt-20">{children}</Container>;
}
