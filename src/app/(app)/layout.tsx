import Script from "next/script";
import AndroidBackHandler from "@/components/layout/AndroidBackHandler";
import VitaCompanion from "@/components/vita/VitaCompanion";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AndroidBackHandler />
      <Script src="/theme-init.js" strategy="beforeInteractive" />
      {children}
      <VitaCompanion />
    </>
  );
}
