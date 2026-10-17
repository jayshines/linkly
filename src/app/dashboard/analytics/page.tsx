import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUserId } from "@/lib/auth";
import { getAnalytics, parseRange, RANGES } from "@/lib/analytics";
import { cn } from "@/components/ui";
import { AnalyticsView } from "./analytics-view";

export const metadata = { title: "Analytics | Linkly" };
export const dynamic = "force-dynamic";

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: { range?: string | string[] };
}) {
  const userId = await currentUserId();
  if (!userId) redirect("/login");

  const days = parseRange(searchParams.range);
  const data = await getAnalytics(userId, days); // scoped to this user

  return (
    <div className="max-w-3xl animate-rise space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="mt-1 text-sm text-muted">See which links people click.</p>
        </div>
        <nav aria-label="Date range" className="inline-flex rounded-full border border-line bg-surface p-1">
          {RANGES.map((r) => (
            <Link
              key={r}
              href={`/dashboard/analytics?range=${r}`}
              aria-current={r === days ? "true" : undefined}
              className={cn(
                "focus-ring rounded-full px-4 py-1.5 text-xs font-semibold transition-colors",
                r === days ? "bg-fg text-bg" : "text-muted hover:text-fg"
              )}
            >
              {r} days
            </Link>
          ))}
        </nav>
      </div>

      <AnalyticsView data={data} />
    </div>
  );
}
