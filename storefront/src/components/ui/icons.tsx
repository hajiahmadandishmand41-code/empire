/** Empire icon set — hand-drawn inline SVG (stroke, currentColor, 24×24).
 * No icon dependency: they inherit the text colour, cost ~200 bytes each and
 * never block first paint with a font/CDN request.
 *
 * `flipRtl` marks glyphs whose meaning is directional (chevrons, arrows); the
 * wrapper mirrors them under [dir="rtl"] so they always point "forward".
 */
import type { SVGProps } from "react";

export type IconName =
  | "search" | "cart" | "user" | "menu" | "close" | "chevronStart" | "chevronEnd"
  | "chevronDown" | "check" | "truck" | "shield" | "tag" | "heart" | "filter"
  | "plus" | "minus" | "trash" | "arrowStart" | "package" | "store" | "spark"
  | "phone" | "mail" | "pin" | "globe" | "logout" | "grid" | "quote" | "clock"
  | "alert" | "info" | "eye" | "edit" | "lock" | "building" | "wallet" | "chart";

type Props = SVGProps<SVGSVGElement> & { name: IconName; title?: string; flipRtl?: boolean };

const PATHS: Record<IconName, string> = {
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm5.2 12.2L21 21",
  cart: "M3 4h2l2.2 10.4a2 2 0 0 0 2 1.6h7.4a2 2 0 0 0 2-1.55L20 8H6.2M9.5 20.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm8 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z",
  user: "M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm-7 16a7 7 0 0 1 14 0",
  menu: "M4 7h16M4 12h16M4 17h16",
  close: "M6 6l12 12M18 6L6 18",
  chevronStart: "M14.5 5.5 8 12l6.5 6.5",
  chevronEnd: "M9.5 5.5 16 12l-6.5 6.5",
  chevronDown: "M5.5 9.5 12 16l6.5-6.5",
  check: "M5 12.5 10 17.5 19.5 7",
  truck: "M3 7h11v9H3zM14 10h4l3 3v3h-7zM7 19a1.6 1.6 0 1 0 0-3.2A1.6 1.6 0 0 0 7 19Zm10 0a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2Z",
  shield: "M12 3.5 5 6v6c0 4 3 7 7 8.5 4-1.5 7-4.5 7-8.5V6l-7-2.5Zm-2.4 8.6 1.9 1.9 3.9-3.9",
  tag: "M4 4h7l9 9-7 7-9-9V4Zm3.5 3.5h.01",
  heart: "M12 20s-7.5-4.6-7.5-9.4A4.1 4.1 0 0 1 12 7.9a4.1 4.1 0 0 1 7.5 2.7C19.5 15.4 12 20 12 20Z",
  filter: "M4 6h16M7 12h10M10 18h4",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  trash: "M4 7h16M9 7V4.8h6V7M6.5 7l1 13h9l1-13M10 11v5M14 11v5",
  arrowStart: "M20 12H4m6-6-6 6 6 6",
  package: "M12 3 3.5 7.5v9L12 21l8.5-4.5v-9L12 3Zm0 18v-9m0 0L3.5 7.5M12 12l8.5-4.5",
  store: "M4 9.5V20h16V9.5M3 9.5 5.5 4h13L21 9.5a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0ZM10 20v-5h4v5",
  spark: "M12 3.5 13.9 9l5.6 2-5.6 2-1.9 5.5L10.1 13 4.5 11l5.6-2L12 3.5Z",
  phone: "M7 3.5h3l1.5 4-2 1.5a12 12 0 0 0 5.5 5.5l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 5 5.7 2 2 0 0 1 7 3.5Z",
  mail: "M3.5 6h17v12h-17zM3.5 7l8.5 6 8.5-6",
  pin: "M12 21s6.5-6 6.5-11a6.5 6.5 0 1 0-13 0C5.5 15 12 21 12 21Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  globe: "M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17Zm0 0c2.5 2.4 2.5 12.2 0 17m0-17c-2.5 2.4-2.5 12.2 0 17M3.8 9.5h16.4M3.8 14.5h16.4",
  logout: "M14 5.5H6.5v13H14M17 8.5l3.5 3.5L17 15.5M20 12h-9",
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  quote: "M7 7h4v6a4 4 0 0 1-4 4V7Zm6 0h4v6a4 4 0 0 1-4 4V7Z",
  clock: "M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17Zm0 4.5v4.2l3 1.8",
  alert: "M12 4 2.8 20h18.4L12 4Zm0 6v4.5m0 2.5h.01",
  info: "M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17Zm0 7.5v5m0-8.5h.01",
  eye: "M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Zm9.5 2.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  edit: "M4 20h4L19 9l-4-4L4 16v4Zm10-14 4 4",
  lock: "M6.5 10.5h11V20h-11zM8.5 10.5V7.8a3.5 3.5 0 0 1 7 0v2.7",
  building: "M4 20V5.5h9V20M13 10h7v10M7 9h3M7 12.5h3M7 16h3M16 13.5h1M16 17h1",
  wallet: "M3.5 7.5h17v11h-17zM3.5 7.5 6 4h11l2 3.5M16.5 13h1.5",
  chart: "M4 20V10m5 10V4m5 16v-7m5 7V8",
};

const DIRECTIONAL = new Set<IconName>(["chevronStart", "chevronEnd", "arrowStart"]);

export function Icon({ name, title, flipRtl, className = "h-5 w-5", ...rest }: Props) {
  const mirror = flipRtl ?? DIRECTIONAL.has(name);
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      className={`${className}${mirror ? " rtl:-scale-x-100" : ""}`}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      <path d={PATHS[name]} />
    </svg>
  );
}

/** The Empire mark: a monogram shield, drawn once and reused everywhere. */
export function EmpireMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect width="40" height="40" rx="11" className="fill-navy-950" />
      <path d="M11 27.5V12.5h13.5v3.4h-9.6v3.6h8.4v3.4h-8.4v4.6H11Z" className="fill-white" />
      <circle cx="28.4" cy="27.2" r="3" className="fill-jade-400" />
    </svg>
  );
}
