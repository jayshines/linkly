"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { MousePointerClick } from "lucide-react";

type Data = {
  days: number;
  total: number;
  last7: number;
  dailyAverage: number;
  topLink: { title: string; clicks: number } | null;
  daily: { date: string; clicks: number }[];
  links: { id: string; title: string; url: string; clicks: number; share: number }[];
};

const fmtDay = (d: string) =>
  new Date(`${d}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

function Tile({ label, value, sub, text = false }: { label: string; value: string; sub?: string; text?: boolean }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
      <p className="label">{label}</p>
      {/* Text values (a link title) get a smaller size and may wrap, numbers stay big */}
      <p
        className={
          text
            ? "mt-2.5 line-clamp-2 text-lg font-bold leading-snug tracking-tight"
            : "num mt-2 truncate text-3xl font-bold tracking-tight"
        }
      >
        {value}
      </p>
      {sub && <p className="mt-1 truncate text-xs text-muted">{sub}</p>}
    </div>
  );
}

export function AnalyticsView({ data }: { data: Data }) {
  const max = Math.max(1, ...data.links.map((l) => l.clicks));

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <Tile label={`Clicks, ${data.days} days`} value={String(data.total)} sub={`${data.dailyAverage} per day`} />
        <Tile label="Last 7 days" value={String(data.last7)} />
        <Tile text label="Top link" value={data.topLink ? data.topLink.title : "None yet"} sub={data.topLink ? `${data.topLink.clicks} clicks` : undefined} />
      </div>

      <section aria-label="Clicks over time" className="rounded-3xl border border-line bg-surface p-5 shadow-card">
        <h2 className="label">Clicks over time</h2>
        <div className="mt-4 h-[240px]">
          {data.total === 0 ? (
            <div className="grid h-full place-items-center text-center">
              <div>
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-surface-2 text-muted">
                  <MousePointerClick className="h-5 w-5" />
                </span>
                <p className="mt-3 font-semibold">No clicks yet</p>
                <p className="mt-1 max-w-xs text-sm text-muted">Share your page and clicks will show up here within moments.</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.daily} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="clicksFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" style={{ stopColor: "rgb(var(--accent))" }} stopOpacity={0.3} />
                    <stop offset="100%" style={{ stopColor: "rgb(var(--accent))" }} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="rgb(var(--line))" strokeDasharray="3 4" />
                <XAxis dataKey="date" tickFormatter={fmtDay} tickLine={false} axisLine={false} tickMargin={10} interval="preserveStartEnd" minTickGap={32} fontSize={11} stroke="rgb(var(--faint))" />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={44} fontSize={11} stroke="rgb(var(--faint))" />
                <Tooltip
                  cursor={{ stroke: "rgb(var(--faint))", strokeDasharray: "3 3" }}
                  content={({ active, payload }) =>
                    active && payload?.[0] ? (
                      <div className="rounded-xl border border-line bg-surface px-3 py-2 text-xs shadow-pop">
                        <p className="label">{fmtDay(payload[0].payload.date)}</p>
                        <p className="num mt-1 font-bold">{payload[0].value} clicks</p>
                      </div>
                    ) : null
                  }
                />
                <Area type="monotone" dataKey="clicks" stroke="rgb(var(--accent))" strokeWidth={2.25} fill="url(#clicksFill)" activeDot={{ r: 4, strokeWidth: 2, stroke: "rgb(var(--surface))" }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section aria-label="Clicks per link" className="rounded-3xl border border-line bg-surface shadow-card">
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="label">Clicks per link</h2>
          <span className="label">Clicks</span>
        </div>
        {data.links.length === 0 ? (
          <p className="border-t border-line px-5 py-10 text-center text-sm text-muted">Add some links to start tracking them.</p>
        ) : (
          <ul className="border-t border-line">
            {data.links.map((l, i) => (
              <li key={l.id} className="relative flex items-center gap-4 border-b border-line px-5 py-3.5 last:border-b-0">
                <span
                  className="absolute inset-y-1.5 left-3 rounded-lg bg-accent/10"
                  style={{ width: `calc(${(l.clicks / max) * 100}% - 1.5rem)` }}
                  aria-hidden="true"
                />
                <span className="num relative w-5 text-xs font-bold text-faint">{i + 1}</span>
                <div className="relative min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{l.title}</p>
                  <p className="truncate text-xs text-muted">{l.url}</p>
                </div>
                <div className="relative text-right">
                  <p className="num text-sm font-bold">{l.clicks}</p>
                  <p className="num text-[11px] text-faint">{l.share}%</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
