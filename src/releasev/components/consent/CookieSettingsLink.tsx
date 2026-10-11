"use client";

import { useConsentStore } from "@rv/stores/consent-store";

export function CookieSettingsLink() {
  const openSettings = useConsentStore((state) => state.openSettings);
  return (
    <button type="button" onClick={openSettings} className="link-underline text-left text-ink-soft transition-colors duration-300 hover:text-ink">
      Cookie-instellingen
    </button>
  );
}
