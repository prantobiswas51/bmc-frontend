// Plain module (not "use client") so server and client components get real strings.

/** Card without padding (tables that run edge to edge). */
export const surface =
  "rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(46,42,39,0.04)]";
export const card = `${surface} p-5`;
export const cardTitle = "text-lg font-medium text-brand-600";
export const input =
  "w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-muted/70 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/30 disabled:bg-cream disabled:text-muted";
export const label = "block space-y-1.5 text-sm font-medium text-ink";

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 disabled:cursor-not-allowed disabled:opacity-60";
export const button = {
  primary: `${buttonBase} bg-brand-600 text-white hover:bg-brand-700`,
  secondary: `${buttonBase} border border-line bg-white text-ink hover:bg-brand-50`,
  danger: `${buttonBase} border border-rose-200 bg-white text-bad hover:bg-rose-50`,
  ghost: `${buttonBase} text-brand-700 hover:bg-brand-50`,
} as const;
export type ButtonVariant = keyof typeof button;

export const badge = {
  neutral:
    "inline-flex items-center gap-1.5 rounded-full bg-cream px-2.5 py-0.5 text-xs font-medium text-muted",
  brand:
    "inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700",
  good: "inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-good",
  bad: "inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-bad",
} as const;
