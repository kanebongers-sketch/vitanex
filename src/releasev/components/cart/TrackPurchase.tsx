"use client";

import { useEffect, useRef } from "react";
import { trackPurchase } from "@rv/lib/tracking";

interface TrackPurchaseProps {
  /** Bedrag in euro's */
  value: number;
  transactionId: string;
}

/** Stuurt een purchase-event (alleen als tracking geladen is en toestemming is gegeven). */
export function TrackPurchase({ value, transactionId }: TrackPurchaseProps) {
  const hasTracked = useRef(false);
  useEffect(() => {
    if (hasTracked.current) return;
    hasTracked.current = true;
    trackPurchase(value, transactionId);
  }, [value, transactionId]);
  return null;
}
