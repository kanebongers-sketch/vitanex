import { SITE } from "@rv/config/site";
import { cn } from "@rv/lib/cn";

type IconName = "truck" | "return" | "lock" | "trainer";

const ICON_PATHS: Record<IconName, string> = {
  truck: "M1.5 4.5h8v7h-8zM9.5 7h3l2 2.5v2h-5M4 13.5a1.25 1.25 0 100-2.5 1.25 1.25 0 000 2.5zM12 13.5a1.25 1.25 0 100-2.5 1.25 1.25 0 000 2.5z",
  return: "M5.5 3.5L2.5 6.5l3 3M2.5 6.5h7a4 4 0 010 8h-3",
  lock: "M3.5 7.5h9v6.5h-9zM5.5 7.5V5a2.5 2.5 0 015 0v2.5",
  trainer: "M8 7a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM3 14.5c.5-3 2.5-4.5 5-4.5s4.5 1.5 5 4.5",
};

const LOCATIONS = SITE.trainer.credentials.find((item) => item.label === "PT-locaties");
const TEAM_DETAIL = LOCATIONS ? `Het team achter ${LOCATIONS.value} ${LOCATIONS.label}` : SITE.trainer.role;

const BADGES: ReadonlyArray<{ icon: IconName; title: string; detail: string }> = [
  { icon: "truck", title: "Gratis verzending", detail: SITE.shipping.deliveryLabel },
  { icon: "return", title: `${SITE.shipping.returnDays} dagen bedenktijd`, detail: "Ongebruikt terug, geld terug" },
  { icon: "lock", title: "Veilig betalen", detail: "iDEAL, Bancontact, kaart, Klarna" },
  { icon: "trainer", title: "Ontwikkeld door coaches", detail: TEAM_DETAIL },
];

function BadgeIcon({ name }: { name: IconName }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="size-[1.125rem] shrink-0 text-ink" fill="none" stroke="currentColor" strokeWidth="1.3">
      <path d={ICON_PATHS[name]} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** 2x2-raster met koopzekerheden, rustig en met dunne lijnen. */
export function TrustBadges({ className }: { className?: string }) {
  return (
    <ul aria-label="Zekerheden bij je bestelling" className={cn("grid grid-cols-2 border-t border-line", className)}>
      {BADGES.map((badge, index) => (
        <li
          key={badge.title}
          className={cn(
            "flex gap-3 border-b border-line py-4",
            index % 2 === 0 ? "pr-3" : "border-l pl-4",
          )}
        >
          <BadgeIcon name={badge.icon} />
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="text-sm font-semibold leading-tight text-ink">{badge.title}</span>
            <span className="text-xs leading-snug text-ink-muted">{badge.detail}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
