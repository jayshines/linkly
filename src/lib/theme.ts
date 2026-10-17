import { z } from "zod";

export const BUTTON_STYLES = ["filled", "outline", "soft"] as const;
export const FONTS = ["sans", "serif", "mono"] as const;
export const MODES = ["light", "dark"] as const;

export const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Use a 6-digit hex colour like #7c3aed");

export const themeSchema = z.object({
  mode: z.enum(MODES),
  accent: hexColor,
  buttonStyle: z.enum(BUTTON_STYLES),
  font: z.enum(FONTS),
});

export type Theme = z.infer<typeof themeSchema>;

export const DEFAULT_THEME: Theme = {
  mode: "light",
  accent: "#7c3aed",
  buttonStyle: "filled",
  font: "sans",
};

export const ACCENT_SWATCHES = [
  "#7c3aed",
  "#2563eb",
  "#0891b2",
  "#16a34a",
  "#eab308",
  "#f97316",
  "#e11d48",
  "#111827",
];

/** Reads the stored JSON, falling back to defaults for anything missing or invalid. */
export function resolveTheme(raw: unknown): Theme {
  const parsed = themeSchema.partial().safeParse(raw ?? {});
  return { ...DEFAULT_THEME, ...(parsed.success ? parsed.data : {}) };
}

function channel(hex: string, i: number) {
  return parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
}

/** Relative luminance (WCAG) of a #rrggbb colour, 0 (black) to 1 (white). */
export function luminance(hex: string) {
  const [r, g, b] = [0, 1, 2].map((i) => {
    const c = channel(hex, i) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Black or white, whichever is more readable on top of `hex`. */
export function readableOn(hex: string) {
  return luminance(hex) > 0.4 ? "#111111" : "#ffffff";
}

/** Mix a colour with white (amount 0..1 = how much of the colour is kept). */
export function tint(hex: string, amount: number) {
  const mixed = [0, 1, 2].map((i) =>
    Math.round(channel(hex, i) * amount + 255 * (1 - amount))
  );
  return `rgb(${mixed.join(",")})`;
}

/** #rrggbb + alpha 0..1 -> rgba(...) */
export function alpha(hex: string, a: number) {
  return `rgba(${channel(hex, 0)},${channel(hex, 1)},${channel(hex, 2)},${a})`;
}

export const FONT_VAR: Record<Theme["font"], string> = {
  sans: "var(--font-sans)",
  serif: "var(--font-serif)",
  mono: "var(--font-mono)",
};
