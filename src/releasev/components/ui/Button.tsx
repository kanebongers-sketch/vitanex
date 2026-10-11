import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@rv/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "inverted";
type Size = "md" | "lg";

const base =
  "group inline-flex items-center justify-center gap-3 rounded-full font-medium transition-[background-color,color,box-shadow,transform] duration-300 ease-calm active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-on-ink hover:bg-accent hover:shadow-lift",
  secondary: "border border-ink/20 text-ink hover:border-ink hover:bg-ink hover:text-on-ink",
  ghost: "text-ink hover:text-accent",
  inverted: "bg-on-ink text-ink hover:bg-accent hover:text-on-ink",
};

const sizes: Record<Size, string> = {
  md: "h-11 px-6 text-sm",
  lg: "h-14 px-8 text-base",
};

interface StyleProps {
  variant?: Variant;
  size?: Size;
  /** Toon een pijltje dat bij hover meebeweegt */
  withArrow?: boolean;
  className?: string;
  children: ReactNode;
}

function Arrow() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className="size-4 transition-transform duration-300 ease-calm group-hover:translate-x-1"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M2 8h11M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function buttonClasses({ variant = "primary", size = "md", className }: Omit<StyleProps, "children">) {
  return cn(base, variants[variant], sizes[size], className);
}

interface ButtonProps extends StyleProps, Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> {}

export function Button({ variant, size, withArrow, className, children, type = "button", ...rest }: ButtonProps) {
  return (
    <button type={type} className={buttonClasses({ variant, size, className })} {...rest}>
      {children}
      {withArrow && <Arrow />}
    </button>
  );
}

interface ButtonLinkProps extends StyleProps {
  href: string;
}

export function ButtonLink({ href, variant, size, withArrow, className, children }: ButtonLinkProps) {
  return (
    <Link href={href} className={buttonClasses({ variant, size, className })}>
      {children}
      {withArrow && <Arrow />}
    </Link>
  );
}
