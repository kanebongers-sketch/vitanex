import Script from "next/script";
import AndroidBackHandler from "@/components/layout/AndroidBackHandler";
import AnalyticsListener from "@/components/layout/AnalyticsListener";
import { ToastProvider } from "@/components/ui/Toast";

// Vita is bewust géén globale pop-up meer (te chaotisch): Vita heeft zijn eigen
// pagina /coach, bereikbaar via de "Vraag Vita"-knop op de home en het Vita-item
// in de navigatie/onderbalk. VitaCompanion blijft in de codebase voor hergebruik.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AndroidBackHandler />
      <Script src="/theme-init.js" strategy="beforeInteractive" />
      {children}
      <AnalyticsListener />
    </ToastProvider>
  );
}
