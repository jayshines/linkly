"use client";

import { ProfileCard, type CardLink } from "@/components/public/profile-card";
import type { Theme } from "@/lib/theme";

// A client wrapper so the server page can pass plain data and we can pass the href function.
export function PublicProfile(props: {
  name: string;
  username: string;
  bio: string;
  avatar: string | null;
  image: string | null;
  theme: Theme;
  links: CardLink[];
}) {
  return (
    <main>
      <ProfileCard {...props} fullHeight href={(id) => `/r/${id}`} />
    </main>
  );
}
