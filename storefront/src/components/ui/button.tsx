import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { cx } from "@/lib/cx";

export type ButtonVariant = "primary" | "accent" | "outline" | "ghost" | "danger" | "onDark";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-navy-900 text-white hover:bg-navy-800 active:bg-navy-950 disabled:bg-navy-900/40",
  accent: "bg-jade-700 text-white hover:bg-jade-600 active:bg-jade-800 disabled:bg-jade-700/40",
  outline: "border border-navy-200 bg-white text-navy-900 hover:border-navy-300 hover:bg-navy-50 disabled:text-navy-300",
  ghost: "text-navy-800 hover:bg-navy-50 active:bg-navy-100 disabled:text-navy-300",
  danger: "border border-red-200 bg-white text-red-700 hover:bg-red-50 disabled:text-red-300",
  onDark: "bg-white text-navy-950 hover:bg-navy-50 active:bg-navy-100 disabled:bg-white/40",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 gap-1.5 px-3 text-sm",
  md: "h-11 gap-2 px-4 text-sm",
  lg: "h-12 gap-2 px-6 text-base",
};

const BASE =
  "inline-flex shrink-0 items-center justify-center rounded-xl font-semibold transition-colors duration-150 " +
  "disabled:cursor-not-allowed disabled:opacity-70 select-none";

export function buttonClasses(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string) {
  return cx(BASE, VARIANTS[variant], SIZES[size], className);
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  busy?: boolean;
  busyLabel?: string;
  iconStart?: ReactNode;
  iconEnd?: ReactNode;
};

/** One visual language for every action, whether it is a <button> or a link. */
export function Button({
  variant = "primary", size = "md", block, busy, busyLabel, iconStart, iconEnd,
  className, children, disabled, type = "button", ...rest
}: Props) {
  return (
    <button
      type={type}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      className={buttonClasses(variant, size, cx(block && "w-full", className))}
      {...rest}
    >
      {busy ? <Spinner /> : iconStart}
      <span>{busy && busyLabel ? busyLabel : children}</span>
      {!busy && iconEnd}
    </button>
  );
}

export function ButtonLink({
  href, variant = "primary", size = "md", block, className, children, iconStart, iconEnd,
  ...rest
}: {
  href: string; variant?: ButtonVariant; size?: ButtonSize; block?: boolean; className?: string;
  children: ReactNode; iconStart?: ReactNode; iconEnd?: ReactNode;
} & Omit<React.ComponentProps<typeof Link>, "href" | "className" | "children">) {
  return (
    <Link href={href} className={buttonClasses(variant, size, cx(block && "w-full", className))} {...rest}>
      {iconStart}
      <span>{children}</span>
      {iconEnd}
    </Link>
  );
}

export function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cx(className, "animate-spin")} aria-hidden="true" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
