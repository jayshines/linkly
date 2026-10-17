import { redirect } from "next/navigation";
import { currentUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { getClickTotals } from "@/lib/analytics";
import { resolveTheme } from "@/lib/theme";
import { EditorProvider } from "@/components/editor/editor-provider";
import { DashboardShell } from "@/components/editor/dashboard-shell";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const userId = await currentUserId();
  if (!userId) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      bio: true,
      username: true,
      avatar: true,
      image: true,
      theme: true,
      links: {
        orderBy: { position: "asc" },
        select: { id: true, title: true, url: true, enabled: true, position: true },
      },
    },
  });
  if (!user) redirect("/login");
  if (!user.username) redirect("/onboarding"); // pick a username first

  const totals = await getClickTotals(userId);

  return (
    <EditorProvider
      initial={{
        profile: {
          name: user.name ?? user.username,
          bio: user.bio,
          username: user.username,
          avatar: user.avatar,
          image: user.image,
        },
        theme: resolveTheme(user.theme),
        links: user.links.map((l) => ({ ...l, clicks: totals.get(l.id) ?? 0 })),
      }}
    >
      <DashboardShell>{children}</DashboardShell>
    </EditorProvider>
  );
}
