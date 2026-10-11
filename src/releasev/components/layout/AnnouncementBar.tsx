import { SITE } from "@rv/config/site";

export function AnnouncementBar() {
  return (
    <div className="border-b border-ink/10 bg-canvas px-gutter py-2.5 text-center text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-ink-soft">
      {SITE.shipping.freeLabel}
      <span aria-hidden className="mx-3 inline-block size-1 translate-y-[-2px] rounded-full bg-accent" />
      <span className="hidden sm:inline">{SITE.shipping.deliveryLabel}</span>
      <span className="sm:hidden">{SITE.shipping.returnDays} dagen bedenktijd</span>
    </div>
  );
}
