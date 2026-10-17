import { describe, expect, it } from "vitest";
import {
  avatarSchema,
  linkInputSchema,
  normalizeUrl,
  normalizeUsername,
  suggestUsername,
  usernameProblem,
} from "./validators";
import { DEFAULT_THEME, readableOn, resolveTheme, themeSchema } from "./theme";

describe("normalizeUrl", () => {
  it("adds https:// when the scheme is missing", () => {
    expect(normalizeUrl("example.com/page")).toBe("https://example.com/page");
    expect(normalizeUrl("  www.example.com ")).toBe("https://www.example.com/");
  });

  it("keeps http and https URLs", () => {
    expect(normalizeUrl("http://example.com")).toBe("http://example.com/");
    expect(normalizeUrl("https://example.com/a?b=1#c")).toBe("https://example.com/a?b=1#c");
  });

  it.each([
    "javascript:alert(1)",
    "JAVASCRIPT:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "vbscript:msgbox(1)",
    "file:///etc/passwd",
    "mailto:a@b.co",
    "ftp://example.com",
  ])("refuses %s", (bad) => {
    expect(normalizeUrl(bad)).toBeNull();
  });

  it("refuses empty input and hosts without a dot", () => {
    expect(normalizeUrl("")).toBeNull();
    expect(normalizeUrl("   ")).toBeNull();
    expect(normalizeUrl("localhost")).toBeNull();
    expect(normalizeUrl("not a url")).toBeNull();
  });
});

describe("usernames", () => {
  it("normalises case, spaces and a leading @", () => {
    expect(normalizeUsername("  @Jay_Sharma ")).toBe("jay_sharma");
  });

  it("accepts good usernames", () => {
    for (const u of ["jay", "jay-sharma", "a1b", "user_name_9"]) {
      expect(usernameProblem(u)).toBeNull();
    }
  });

  it("rejects short, long, malformed and reserved names", () => {
    expect(usernameProblem("ab")).toMatch(/at least 3/);
    expect(usernameProblem("a".repeat(31))).toMatch(/at most 30/);
    expect(usernameProblem("-jay")).toBeTruthy();
    expect(usernameProblem("jay-")).toBeTruthy();
    expect(usernameProblem("jay sharma")).toBeTruthy();
    expect(usernameProblem("jay.sharma")).toBeTruthy();
    for (const r of ["api", "login", "dashboard", "r", "analytics", "Admin"]) {
      expect(usernameProblem(r)).toBeTruthy();
    }
  });

  it("suggests a valid handle or nothing", () => {
    expect(suggestUsername("Jay Sharma!")).toBe("jaysharma");
    expect(suggestUsername("api")).toBe("");
    expect(suggestUsername("x")).toBe("");
    expect(suggestUsername(null)).toBe("");
  });
});

describe("linkInputSchema", () => {
  it("trims the title and normalises the URL", () => {
    const r = linkInputSchema.parse({ title: "  My site ", url: "example.com" });
    expect(r).toEqual({ title: "My site", url: "https://example.com/" });
  });

  it("rejects empty titles, long titles and unsafe URLs", () => {
    expect(linkInputSchema.safeParse({ title: " ", url: "example.com" }).success).toBe(false);
    expect(linkInputSchema.safeParse({ title: "a".repeat(81), url: "example.com" }).success).toBe(false);
    expect(linkInputSchema.safeParse({ title: "x", url: "javascript:alert(1)" }).success).toBe(false);
  });
});

describe("avatarSchema", () => {
  it("accepts a small base64 image and rejects other things", () => {
    expect(avatarSchema.safeParse("data:image/jpeg;base64,/9j/4AAQSkZJRg==").success).toBe(true);
    expect(avatarSchema.safeParse("data:text/html;base64,PHNjcmlwdD4=").success).toBe(false);
    expect(avatarSchema.safeParse("https://example.com/a.jpg").success).toBe(false);
    expect(avatarSchema.safeParse("data:image/jpeg;base64," + "A".repeat(150_000)).success).toBe(false);
  });
});

describe("theme", () => {
  it("falls back to defaults for missing or invalid stored data", () => {
    expect(resolveTheme({})).toEqual(DEFAULT_THEME);
    expect(resolveTheme(null)).toEqual(DEFAULT_THEME);
    expect(resolveTheme({ accent: "red", mode: "dark" })).toEqual({ ...DEFAULT_THEME });
    expect(resolveTheme({ mode: "dark" }).mode).toBe("dark");
  });

  it("validates colours", () => {
    expect(themeSchema.safeParse({ ...DEFAULT_THEME, accent: "#12345" }).success).toBe(false);
    expect(themeSchema.safeParse({ ...DEFAULT_THEME, accent: "#1234ab" }).success).toBe(true);
  });

  it("picks readable text for light and dark accents", () => {
    expect(readableOn("#ffffff")).toBe("#111111");
    expect(readableOn("#eab308")).toBe("#111111");
    expect(readableOn("#111827")).toBe("#ffffff");
    expect(readableOn("#7c3aed")).toBe("#ffffff");
  });
});
