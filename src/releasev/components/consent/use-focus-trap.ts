"use client";

import { useEffect, type RefObject } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE));
}

function cycleFocus(event: KeyboardEvent, container: HTMLElement) {
  const items = getFocusable(container);
  if (items.length === 0) return;
  const first = items[0];
  const last = items[items.length - 1];
  const active = document.activeElement;
  if (event.shiftKey && (active === first || !container.contains(active))) {
    event.preventDefault();
    last?.focus();
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    first?.focus();
  }
}

/**
 * Houdt de focus binnen een modale dialoog, sluit met Escape en zet de
 * focus na sluiten terug op het element dat de dialoog opende.
 */
export function useFocusTrap(ref: RefObject<HTMLElement | null>, isActive: boolean, onEscape: () => void) {
  useEffect(() => {
    const container = ref.current;
    if (!isActive || !container) return;

    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const initial = container.querySelector<HTMLElement>("[data-autofocus]") ?? getFocusable(container)[0];
    initial?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onEscape();
      } else if (event.key === "Tab") {
        cycleFocus(event, container);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus();
    };
  }, [ref, isActive, onEscape]);
}
