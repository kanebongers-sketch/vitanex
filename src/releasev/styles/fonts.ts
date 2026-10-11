import { Archivo, Instrument_Sans } from "next/font/google";

/**
 * Typografie-paring:
 * - Archivo (variabel, met breedte-as): vette, iets brede grotesk voor koppen.
 *   Sportief en technisch, zonder schreeuwerig te worden.
 * - Instrument Sans: rustige, goed leesbare sans-serif voor tekst en UI.
 * Andere fonts? Vervang de imports hierboven door andere Google Fonts.
 */
export const headingFont = Archivo({
  subsets: ["latin"],
  variable: "--font-rv-heading",
  display: "swap",
  axes: ["wdth"],
});

export const bodyFont = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-rv-body",
  display: "swap",
});
