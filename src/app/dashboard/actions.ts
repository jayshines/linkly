"use server";

import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/auth";
import { planReorder } from "@/lib/reorder";
import { themeSchema, type Theme } from "@/lib/theme";
import {
  avatarSchema,
  linkInputSchema,
  linkPatchSchema,
  normalizeUsername,
  profileSchema,
  usernameProblem,
} from "@/lib/validators";

// Every action: 1) requires a session, 2) validates its input with zod (inputs
// from the browser are untrusted), 3) scopes every query to the signed-in user.

export type Result<T = void> = { ok: true; data: T } | { ok: false; error: string };

export type LinkView = {
  id: string;
  title: string;
  url: string;
  enabled: boolean;
  position: number;
};

const MAX_LINKS = 50;

const ok = <T>(data: T): Result<T> => ({ ok: true, data });
const fail = (error: string): Result<never> => ({ ok: false, error });
const firstIssue = (e: { issues: { message: string }[] }) =>
  e.issues[0]?.message ?? "Invalid input";

const linkSelect = {
  id: true,
  title: true,
  url: true,
  enabled: true,
  position: true,
} as const;

export async function createLink(input: unknown): Promise<Result<LinkView>> {
  const userId = await requireUserId();
  const parsed = linkInputSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));

  const count = await db.link.count({ where: { userId } });
  if (count >= MAX_LINKS) return fail(`You can add up to ${MAX_LINKS} links`);

  const last = await db.link.findFirst({
    where: { userId },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  const link = await db.link.create({
    data: { userId, ...parsed.data, position: (last?.position ?? -1) + 1 },
    select: linkSelect,
  });
  return ok(link);
}

export async function updateLink(id: string, patch: unknown): Promise<Result<LinkView>> {
  const userId = await requireUserId();
  const parsed = linkPatchSchema.safeParse(patch);
  if (!parsed.success) return fail(firstIssue(parsed.error));

  // updateMany with userId in the filter: you can only change your own links
  const res = await db.link.updateMany({ where: { id, userId }, data: parsed.data });
  if (res.count === 0) return fail("Link not found");

  const link = await db.link.findFirstOrThrow({ where: { id, userId }, select: linkSelect });
  return ok(link);
}

export async function deleteLink(id: string): Promise<Result> {
  const userId = await requireUserId();
  const res = await db.link.deleteMany({ where: { id, userId } });
  return res.count === 0 ? fail("Link not found") : ok(undefined);
}

export async function reorderLinks(ids: unknown): Promise<Result> {
  const userId = await requireUserId();
  if (!Array.isArray(ids) || !ids.every((i) => typeof i === "string")) {
    return fail("Invalid order");
  }

  const current = await db.link.findMany({
    where: { userId },
    orderBy: { position: "asc" },
    select: { id: true },
  });
  const plan = planReorder(current.map((l) => l.id), ids as string[]);
  if (!plan) return fail("Your list is out of date. Refresh and try again.");

  await db.$transaction(
    plan.map((p) =>
      db.link.updateMany({ where: { id: p.id, userId }, data: { position: p.position } })
    )
  );
  return ok(undefined);
}

export async function updateProfile(input: unknown): Promise<Result> {
  const userId = await requireUserId();
  const { avatar, ...rest } = (input ?? {}) as { avatar?: unknown };
  const parsed = profileSchema.safeParse(rest);
  if (!parsed.success) return fail(firstIssue(parsed.error));

  // avatar: undefined = leave as is, null = remove, string = replace
  let avatarData: string | null | undefined;
  if (avatar === null) avatarData = null;
  else if (avatar !== undefined) {
    const a = avatarSchema.safeParse(avatar);
    if (!a.success) return fail(firstIssue(a.error));
    avatarData = a.data;
  }

  await db.user.update({
    where: { id: userId },
    data: {
      name: parsed.data.name,
      bio: parsed.data.bio,
      ...(avatarData !== undefined ? { avatar: avatarData } : {}),
    },
  });
  return ok(undefined);
}

export async function updateTheme(input: unknown): Promise<Result<Theme>> {
  const userId = await requireUserId();
  const parsed = themeSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  await db.user.update({ where: { id: userId }, data: { theme: parsed.data } });
  return ok(parsed.data);
}

export async function checkUsername(
  raw: string
): Promise<{ available: boolean; message?: string }> {
  const userId = await requireUserId();
  const username = normalizeUsername(String(raw ?? ""));
  const problem = usernameProblem(username);
  if (problem) return { available: false, message: problem };

  const existing = await db.user.findUnique({ where: { username }, select: { id: true } });
  if (existing && existing.id !== userId) {
    return { available: false, message: "That username is taken" };
  }
  return { available: true };
}

export async function setUsername(raw: string): Promise<Result<string>> {
  const userId = await requireUserId();
  const username = normalizeUsername(String(raw ?? ""));
  const problem = usernameProblem(username);
  if (problem) return fail(problem);

  try {
    await db.user.update({ where: { id: userId }, data: { username } });
  } catch (e) {
    // Unique constraint: someone claimed it between the check and the save
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return fail("That username is taken");
    }
    throw e;
  }
  return ok(username);
}
