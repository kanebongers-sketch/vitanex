import type { ReactNode } from "react";
import { cn } from "@rv/lib/cn";

interface ContainerProps {
  children: ReactNode;
  className?: string;
  size?: "content" | "prose";
}

export function Container({ children, className, size = "content" }: ContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-gutter",
        size === "content" ? "max-w-content" : "max-w-prose",
        className,
      )}
    >
      {children}
    </div>
  );
}
