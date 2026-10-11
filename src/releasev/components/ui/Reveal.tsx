"use client";

import { m } from "framer-motion";
import type { ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  /** Vertraging in seconden, handig om elementen na elkaar te laten verschijnen */
  delay?: number;
  className?: string;
  as?: "div" | "li" | "section" | "article";
}

/** Subtiele fade + lichte verschuiving zodra het element in beeld scrolt. */
export function Reveal({ children, delay = 0, className, as = "div" }: RevealProps) {
  const Component = m[as];
  return (
    <Component
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </Component>
  );
}
