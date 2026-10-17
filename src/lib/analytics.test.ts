import { describe, expect, it } from "vitest";
import { buildAnalytics, parseRange } from "./analytics";
import { planReorder } from "./reorder";

const NOW = new Date("2026-10-14T15:00:00Z");
const links = [
  { id: "a", title: "Portfolio", url: "https://a.dev" },
  { id: "b", title: "GitHub", url: "https://github.com/x" },
  { id: "c", title: "Unused", url: "https://c.dev" },
];
const click = (linkId: string, iso: string) => ({ linkId, createdAt: new Date(iso) });

describe("parseRange", () => {
  it("accepts 7, 30, 90 and defaults to 30", () => {
    expect(parseRange("7")).toBe(7);
    expect(parseRange("90")).toBe(90);
    expect(parseRange(["7", "30"])).toBe(7);
    expect(parseRange("15")).toBe(30);
    expect(parseRange(undefined)).toBe(30);
    expect(parseRange("abc")).toBe(30);
  });
});

describe("buildAnalytics", () => {
  const clicks = [
    click("a", "2026-10-14T01:00:00Z"), // today
    click("a", "2026-10-13T23:59:59Z"),
    click("b", "2026-10-10T12:00:00Z"),
    click("a", "2026-10-08T00:00:00Z"), // 6 days ago: still in the last 7
    click("b", "2026-10-07T23:59:59Z"), // 7 days ago: outside last 7, inside 30
    click("a", "2026-09-20T12:00:00Z"), // inside 30
    click("b", "2026-08-01T12:00:00Z"), // outside 30, inside 90
    click("zzz", "2026-10-14T02:00:00Z"), // someone else's link: ignored
  ];

  it("counts totals inside the window and ignores other users' links", () => {
    expect(buildAnalytics({ links, clicks, days: 30, now: NOW }).total).toBe(6);
    expect(buildAnalytics({ links, clicks, days: 7, now: NOW }).total).toBe(4);
    expect(buildAnalytics({ links, clicks, days: 90, now: NOW }).total).toBe(7);
  });

  it("counts the last 7 days independently of the range", () => {
    expect(buildAnalytics({ links, clicks, days: 30, now: NOW }).last7).toBe(4);
    expect(buildAnalytics({ links, clicks, days: 90, now: NOW }).last7).toBe(4);
  });

  it("returns one bucket per day, oldest first, including empty days", () => {
    const r = buildAnalytics({ links, clicks, days: 7, now: NOW });
    expect(r.daily).toHaveLength(7);
    expect(r.daily[0]).toEqual({ date: "2026-10-08", clicks: 1 });
    expect(r.daily[6]).toEqual({ date: "2026-10-14", clicks: 1 });
    expect(r.daily[2]).toEqual({ date: "2026-10-10", clicks: 1 });
    expect(r.daily[1]).toEqual({ date: "2026-10-09", clicks: 0 });
  });

  it("ranks links by clicks and includes links with zero", () => {
    const r = buildAnalytics({ links, clicks, days: 30, now: NOW });
    expect(r.links.map((l) => [l.title, l.clicks])).toEqual([
      ["Portfolio", 4],
      ["GitHub", 2],
      ["Unused", 0],
    ]);
    expect(r.links[0].share).toBeCloseTo(66.7, 1);
    expect(r.topLink?.title).toBe("Portfolio");
  });

  it("has no top link and zero shares when there are no clicks", () => {
    const r = buildAnalytics({ links, clicks: [], days: 30, now: NOW });
    expect(r.total).toBe(0);
    expect(r.topLink).toBeNull();
    expect(r.links.every((l) => l.share === 0)).toBe(true);
    expect(r.daily).toHaveLength(30);
  });

  it("computes the daily average", () => {
    expect(buildAnalytics({ links, clicks, days: 30, now: NOW }).dailyAverage).toBe(0.2);
  });
});

describe("planReorder", () => {
  it("maps a valid order to positions", () => {
    expect(planReorder(["a", "b", "c"], ["c", "a", "b"])).toEqual([
      { id: "c", position: 0 },
      { id: "a", position: 1 },
      { id: "b", position: 2 },
    ]);
  });

  it("rejects missing, extra, duplicate and foreign ids", () => {
    expect(planReorder(["a", "b", "c"], ["a", "b"])).toBeNull();
    expect(planReorder(["a", "b"], ["a", "b", "c"])).toBeNull();
    expect(planReorder(["a", "b", "c"], ["a", "a", "b"])).toBeNull();
    expect(planReorder(["a", "b"], ["a", "x"])).toBeNull();
  });

  it("accepts an empty list for a user with no links", () => {
    expect(planReorder([], [])).toEqual([]);
  });
});
