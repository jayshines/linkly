import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { resolveTheme } from "@/lib/theme";
import { normalizeUsername, usernameProblem } from "@/lib/validators";
import { PublicProfile } from "./public-profile";

// Always fresh: edits and link toggles should show up immediately
export const dynamic = "force-dynamic";

async function load(raw: string) {
  const username = normalizeUsername(decodeURIComponent(raw));
  if (usernameProblem(username)) return null; // reserved or malformed: don't even query
  return db.user.findUnique({
    where: { username },
    select: {
      name: true,
      username: true,
      bio: true,
      avatar: true,
      image: true,
      theme: true,
      links: {
        where: { enabled: true },
        orderBy: { position: "asc" },
        select: { id: true, title: true, url: true },
      },
    },
  });
}

export async function generateMetadata({ params }: { params: { username: string } }): Promise<Metadata> {
  const user = await load(params.username);
  if (!user) return { title: "Page not found | Linkly" };
  const title = `${user.name ?? user.username} (@${user.username}) | Linkly`;
  const description = user.bio || `Find all of ${user.name ?? user.username}'s links in one place.`;
  return { title, description, openGraph: { title, description, type: "profile" }, twitter: { card: "summary", title, description } };
}

export default async function ProfilePage({ params }: { params: { username: string } }) {
  const user = await load(params.username);
  if (!user || !user.username) notFound();

  return (
    <PublicProfile
      name={user.name ?? user.username}
      username={user.username}
      bio={user.bio}
      avatar={user.avatar}
      image={user.image}
      theme={resolveTheme(user.theme)}
      links={user.links}
    />
  );
}
