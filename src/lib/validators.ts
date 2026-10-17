import { z } from "zod";

// Names that would collide with app routes (or look official)
export const RESERVED_USERNAMES = new Set([
  "api", "r", "login", "logout", "signin", "signout", "onboarding", "dashboard",
  "analytics", "appearance", "settings", "admin", "about", "help", "support",
  "terms", "privacy", "pricing", "static", "assets", "_next", "favicon.ico",
  "linkly", "www", "app", "me", "null", "undefined",
]);

export const USERNAME_RE = /^[a-z0-9](?:[a-z0-9_-]{1,28})[a-z0-9]$/;

export function normalizeUsername(raw: string) {
  return raw.trim().toLowerCase().replace(/^@/, "");
}

/** Returns an error message, or null when the username is acceptable. */
export function usernameProblem(raw: string): string | null {
  const u = normalizeUsername(raw);
  if (u.length < 3) return "Use at least 3 characters";
  if (u.length > 30) return "Use at most 30 characters";
  if (!USERNAME_RE.test(u))
    return "Letters, numbers, - and _ only, starting and ending with a letter or number";
  if (RESERVED_USERNAMES.has(u)) return "That name is reserved";
  return null;
}

/** Suggest a valid username from a GitHub login or display name. */
export function suggestUsername(seed: string | null | undefined) {
  const base = (seed ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "")
    .replace(/^[-_]+|[-_]+$/g, "")
    .slice(0, 28);
  return base.length >= 3 && !RESERVED_USERNAMES.has(base) ? base : "";
}

/**
 * Accepts "example.com" or "https://example.com" and returns a normalised
 * http(s) URL, or null. Anything else (javascript:, data:, mailto:, ...) is
 * refused, because these URLs are rendered as links on a public page.
 */
export function normalizeUrl(raw: string): string | null {
  const input = raw.trim();
  if (!input) return null;
  const withScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(input)
    ? input
    : `https://${input}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!url.hostname.includes(".")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function isHttpUrl(raw: string) {
  try {
    const p = new URL(raw).protocol;
    return p === "http:" || p === "https:";
  } catch {
    return false;
  }
}

export const titleSchema = z.string().trim().min(1, "Add a title").max(80, "At most 80 characters");

export const urlSchema = z
  .string()
  .transform((v, ctx) => {
    const url = normalizeUrl(v);
    if (!url) {
      ctx.addIssue({ code: "custom", message: "Enter a valid http(s) link" });
      return z.NEVER;
    }
    return url;
  });

export const linkInputSchema = z.object({ title: titleSchema, url: urlSchema });

export const linkPatchSchema = z
  .object({
    title: titleSchema.optional(),
    url: urlSchema.optional(),
    enabled: z.boolean().optional(),
  })
  .strict();

export const profileSchema = z.object({
  name: z.string().trim().min(1, "Add a name").max(60, "At most 60 characters"),
  bio: z.string().trim().max(160, "At most 160 characters"),
});

// Browser-resized avatar. Limit the payload so the DB row stays small.
export const MAX_AVATAR_CHARS = 140_000; // ~100 KB of image once base64-decoded
export const avatarSchema = z
  .string()
  .max(MAX_AVATAR_CHARS, "That image is too large")
  .regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/, "Unsupported image");
