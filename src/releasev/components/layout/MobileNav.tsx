"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, m } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MAIN_NAV, SITE } from "@rv/config/site";
import { useHydrated } from "@rv/lib/use-hydrated";

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [menuTop, setMenuTop] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const isHydrated = useHydrated();

  const toggle = () => {
    // De header heeft backdrop-filter, waardoor `fixed` binnen de header niet
    // meer t.o.v. het scherm werkt. Daarom rendert het menu via een portal in
    // <body> en starten we het direct onder de onderrand van de header.
    const header = buttonRef.current?.closest("header");
    setMenuTop(header ? Math.max(0, header.getBoundingClientRect().bottom) : 0);
    setIsOpen((value) => !value);
  };

  // Sluit het menu bij navigatie
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setIsOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <div className="md:hidden">
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        className="flex size-11 items-center justify-center rounded-full transition-colors duration-300 hover:bg-surface-strong"
        aria-expanded={isOpen}
        aria-controls="mobile-menu"
        aria-label={isOpen ? "Menu sluiten" : "Menu openen"}
      >
        <svg aria-hidden viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.5">
          {isOpen ? (
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          ) : (
            <path d="M4 8h16M4 16h16" strokeLinecap="round" />
          )}
        </svg>
      </button>

      {isHydrated &&
        createPortal(
      <AnimatePresence>
        {isOpen && (
          <m.nav
            id="mobile-menu"
            aria-label="Hoofdmenu"
            style={{ top: menuTop }}
            className="fixed inset-x-0 bottom-0 z-40 flex flex-col justify-between overflow-y-auto bg-canvas px-gutter pb-10 pt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <ul className="flex flex-col border-t border-line">
              {MAIN_NAV.map((item, index) => {
                const isCurrent = pathname === item.href;
                return (
                  <m.li
                    key={item.href}
                    className="border-b border-line"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 + index * 0.05, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Link
                      href={item.href}
                      className="group flex items-baseline gap-4 py-5 font-display text-4xl font-extrabold leading-none sm:text-6xl uppercase tracking-tight transition-colors duration-300 hover:text-accent"
                      aria-current={isCurrent ? "page" : undefined}
                    >
                      <span className={`font-display text-xs font-bold tabular-nums ${isCurrent ? "text-accent" : "text-ink-muted"}`}>
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      {item.label}
                    </Link>
                  </m.li>
                );
              })}
            </ul>
            <p className="mt-10 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.14em] text-ink-muted">
              <span aria-hidden className="size-1.5 rounded-full bg-accent" />
              {SITE.shipping.freeLabel} · {SITE.shipping.deliveryLabel}
            </p>
          </m.nav>
        )}
      </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}
