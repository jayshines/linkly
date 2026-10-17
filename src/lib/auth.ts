import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { db } from "@/lib/db";

// "Dev login" exists only in development and only when explicitly enabled.
// NODE_ENV is inlined at build time, so this block is removed from production builds.
export const devLoginEnabled =
  process.env.NODE_ENV === "development" && process.env.ENABLE_DEV_LOGIN === "true";

export const githubConfigured = Boolean(
  process.env.GITHUB_ID && process.env.GITHUB_SECRET
);

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  // JWT sessions: the credentials-based dev login can't use database sessions.
  // Users and GitHub accounts are still stored in Postgres by the adapter.
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID ?? "unset",
      clientSecret: process.env.GITHUB_SECRET ?? "unset",
    }),
    ...(devLoginEnabled
      ? [
          CredentialsProvider({
            id: "dev",
            name: "Dev login",
            credentials: {},
            async authorize() {
              const user = await db.user.upsert({
                where: { email: "dev@linkly.local" },
                update: {},
                create: { email: "dev@linkly.local", name: "Dev User" },
              });
              return { id: user.id, name: user.name, email: user.email };
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.uid = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.uid) {
        (session.user as { id?: string }).id = token.uid as string;
      }
      return session;
    },
  },
};

export type SessionUser = { id: string; name?: string | null; email?: string | null };

/** The signed-in user's id, or null. */
export async function currentUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return (session?.user as { id?: string } | undefined)?.id ?? null;
}

/** Throws unless signed in. Use at the top of every server action. */
export async function requireUserId(): Promise<string> {
  const id = await currentUserId();
  if (!id) throw new Error("Not signed in");
  return id;
}
