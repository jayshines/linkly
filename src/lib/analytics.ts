// Click analytics. `buildAnalytics` is pure (no DB), so it is easy to test.
import { db } from "@/lib/db";

export type RangeDays = 7 | 30 | 90;
export const RANGES: RangeDays[] = [7, 30, 90];

export function parseRange(v: string | string[] | undefined): RangeDays {
  const n = Number(Array.isArray(v) ? v[0] : v);
  return (RANGES as number[]).includes(n) ? (n as RangeDays) : 30;
}

type LinkRow = { id: string; title: string; url: string };
type ClickRow = { linkId: string; createdAt: Date };

const DAY = 86_400_000;
const dayKey = (d: Date) => d.toISOString().slice(0, 10);

export function buildAnalytics(args: {
  links: LinkRow[];
  clicks: ClickRow[];
  days: RangeDays;
  now?: Date;
}) {
  const { links, clicks, days } = args;
  const now = args.now ?? new Date();
  const startOfToday = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const windowStart = startOfToday - (days - 1) * DAY;
  const last7Start = startOfToday - 6 * DAY;

  // One bucket per day in the window, including empty days
  const perDay = new Map<string, number>();
  for (let i = 0; i < days; i++) perDay.set(dayKey(new Date(windowStart + i * DAY)), 0);

  const perLink = new Map<string, number>(links.map((l) => [l.id, 0]));
  let total = 0;
  let last7 = 0;

  for (const c of clicks) {
    const t = c.createdAt.getTime();
    if (t < windowStart || t >= startOfToday + DAY) continue;
    if (!perLink.has(c.linkId)) continue; // not one of this user's links
    total++;
    if (t >= last7Start) last7++;
    const key = dayKey(c.createdAt);
    perDay.set(key, (perDay.get(key) ?? 0) + 1);
    perLink.set(c.linkId, (perLink.get(c.linkId) ?? 0) + 1);
  }

  const ranked = links
    .map((l) => ({
      id: l.id,
      title: l.title,
      url: l.url,
      clicks: perLink.get(l.id) ?? 0,
      share: total === 0 ? 0 : Math.round(((perLink.get(l.id) ?? 0) / total) * 1000) / 10,
    }))
    .sort((a, b) => b.clicks - a.clicks || a.title.localeCompare(b.title));

  return {
    days,
    total,
    last7,
    dailyAverage: Math.round((total / days) * 10) / 10,
    topLink: ranked[0] && ranked[0].clicks > 0 ? ranked[0] : null,
    daily: Array.from(perDay.entries()).map(([date, count]) => ({ date, clicks: count })),
    links: ranked,
  };
}

/** Loads a user's links and the clicks inside the range. Scoped to userId. */
export async function getAnalytics(userId: string, days: RangeDays) {
  const since = new Date(Date.now() - days * DAY);
  const links = await db.link.findMany({
    where: { userId },
    select: { id: true, title: true, url: true },
    orderBy: { position: "asc" },
  });
  const clicks = await db.click.findMany({
    where: { link: { userId }, createdAt: { gte: since } },
    select: { linkId: true, createdAt: true },
  });
  return buildAnalytics({ links, clicks, days });
}

/** Total clicks per link (all time), used for the counts on the editor cards. */
export async function getClickTotals(userId: string) {
  const rows = await db.click.groupBy({
    by: ["linkId"],
    where: { link: { userId } },
    _count: { _all: true },
  });
  return new Map(rows.map((r) => [r.linkId, r._count._all]));
}
