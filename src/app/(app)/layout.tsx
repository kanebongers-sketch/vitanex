import Script from "next/script";
import AndroidBackHandler from "@/components/layout/AndroidBackHandler";
import AnalyticsListener from "@/components/layout/AnalyticsListener";
import VitaCompanion from "@/components/vita/VitaCompanion";
import { ToastProvider } from "@/components/ui/Toast";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AndroidBackHandler />
      <Script src="/theme-init.js" strategy="beforeInteractive" />
      {children}
      <VitaCompanion />
      <AnalyticsListener />
    </ToastProvider>
  );
}
