import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  link: { findUnique: vi.fn() },
  click: { create: vi.fn() },
}));
vi.mock("@/lib/db", () => ({ db }));

import { NextRequest } from "next/server";
import { GET } from "./route";

const BROWSER =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

const call = (linkId: string, headers: Record<string, string> = { "user-agent": BROWSER }) =>
  GET(new NextRequest(`http://localhost:3003/r/${linkId}`, { headers }), { params: { linkId } });

beforeEach(() => {
  vi.clearAllMocks();
  db.click.create.mockResolvedValue({});
});

describe("GET /r/[linkId]", () => {
  it("records a click and redirects (302) to the link", async () => {
    db.link.findUnique.mockResolvedValue({ id: "l1", url: "https://example.com/x", enabled: true });
    const res = await call("l1", { "user-agent": BROWSER, referer: "http://localhost:3003/jay" });

    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("https://example.com/x");
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(db.click.create).toHaveBeenCalledWith({
      data: { linkId: "l1", referrer: "http://localhost:3003/jay" },
    });
  });

  it("returns 404 and records nothing for an unknown link", async () => {
    db.link.findUnique.mockResolvedValue(null);
    const res = await call("nope");
    expect(res.status).toBe(404);
    expect(db.click.create).not.toHaveBeenCalled();
  });

  it("returns 404 for a switched-off link", async () => {
    db.link.findUnique.mockResolvedValue({ id: "l1", url: "https://example.com", enabled: false });
    expect((await call("l1")).status).toBe(404);
    expect(db.click.create).not.toHaveBeenCalled();
  });

  it("refuses to redirect to a non-http URL, even if one is stored", async () => {
    db.link.findUnique.mockResolvedValue({ id: "l1", url: "javascript:alert(1)", enabled: true });
    const res = await call("l1");
    expect(res.status).toBe(404);
    expect(res.headers.get("location")).toBeNull();
    expect(db.click.create).not.toHaveBeenCalled();
  });

  it.each([
    ["Googlebot/2.1 (+http://www.google.com/bot.html)"],
    ["facebookexternalhit/1.1"],
    ["curl/8.4.0"],
    [""],
  ])("redirects but does not count a bot: %j", async (ua) => {
    db.link.findUnique.mockResolvedValue({ id: "l1", url: "https://example.com", enabled: true });
    const res = await call("l1", ua ? { "user-agent": ua } : {});
    expect(res.status).toBe(302);
    expect(db.click.create).not.toHaveBeenCalled();
  });

  it("still redirects when saving the click fails", async () => {
    db.link.findUnique.mockResolvedValue({ id: "l1", url: "https://example.com", enabled: true });
    db.click.create.mockRejectedValue(new Error("db down"));
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await call("l1");
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("https://example.com/");
    spy.mockRestore();
  });
});
