import Link from "next/link";
import { SITE } from "@rv/config/site";
import { cn } from "@rv/lib/cn";
import { Logo } from "./Logo";

/** Logo in de menubalk, linkt naar de homepage. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("-m-2 p-2 text-ink transition-opacity duration-300 hover:opacity-80", className)}
      aria-label={`${SITE.brandName}, naar de homepage`}
    >
      <Logo className="h-[18px] md:h-5" />
    </Link>
  );
}
