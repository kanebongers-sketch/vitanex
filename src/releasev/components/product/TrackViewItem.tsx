"use client";

import { useEffect } from "react";
import { trackViewItem } from "@rv/lib/tracking";

/** Stuurt een view_item / ViewContent-event zodra de productpagina geladen is (alleen met toestemming). */
export function TrackViewItem({ value, itemId }: { value: number; itemId: string }) {
  useEffect(() => {
    trackViewItem(value, itemId);
  }, [value, itemId]);
  return null;
}
