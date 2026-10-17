// Integration tests: real actions against the real (local) database, with the
// session mocked so we can act as two different users.
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const session = vi.hoisted(() => ({ userId: null as string | null }));
vi.mock("@/lib/auth", () => ({
  requireUserId: async () => {
    if (!session.userId) throw new Error("Not signed in");
    return session.userId;
  },
}));

import { db } from "@/lib/db";
import {
  checkUsername,
  createLink,
  deleteLink,
  reorderLinks,
  setUsername,
  updateLink,
  updateProfile,
  updateTheme,
} from "./actions";

const TAG = `t${Date.now()}`;
let alice: string;
let bob: string;

beforeAll(async () => {
  alice = (await db.user.create({ data: { email: `${TAG}-alice@test.local`, name: "Alice" } })).id;
  bob = (await db.user.create({ data: { email: `${TAG}-bob@test.local`, name: "Bob" } })).id;
});

afterAll(async () => {
  await db.user.deleteMany({ where: { email: { startsWith: TAG } } }); // cascades to links/clicks
  await db.$disconnect();
});

beforeEach(async () => {
  await db.link.deleteMany({ where: { userId: { in: [alice, bob] } } });
  session.userId = alice;
});

const asBob = () => (session.userId = bob);

describe("authentication", () => {
  it("rejects every action when signed out", async () => {
    session.userId = null;
    await expect(createLink({ title: "x", url: "example.com" })).rejects.toThrow("Not signed in");
    await expect(updateLink("id", { enabled: false })).rejects.toThrow("Not signed in");
    await expect(deleteLink("id")).rejects.toThrow("Not signed in");
    await expect(reorderLinks([])).rejects.toThrow("Not signed in");
    await expect(updateProfile({ name: "x", bio: "" })).rejects.toThrow("Not signed in");
    await expect(updateTheme({})).rejects.toThrow("Not signed in");
    await expect(setUsername("someone")).rejects.toThrow("Not signed in");
  });
});

describe("links", () => {
  it("creates links in order with a normalised URL", async () => {
    const a = await createLink({ title: " First ", url: "example.com" });
    const b = await createLink({ title: "Second", url: "https://example.org" });
    expect(a.ok && b.ok).toBe(true);
    if (a.ok && b.ok) {
      expect(a.data).toMatchObject({ title: "First", url: "https://example.com/", position: 0, enabled: true });
      expect(b.data.position).toBe(1);
    }
  });

  it("rejects unsafe or invalid input", async () => {
    for (const bad of [
      { title: "x", url: "javascript:alert(1)" },
      { title: "x", url: "data:text/html,hi" },
      { title: "", url: "example.com" },
      { title: "x", url: "" },
      null,
    ]) {
      const res = await createLink(bad);
      expect(res.ok).toBe(false);
    }
    expect(await db.link.count({ where: { userId: alice } })).toBe(0);
  });

  it("updates, toggles and deletes your own link", async () => {
    const created = await createLink({ title: "Mine", url: "example.com" });
    if (!created.ok) throw new Error("setup failed");
    const id = created.data.id;

    const t = await updateLink(id, { title: "Renamed", enabled: false });
    expect(t).toMatchObject({ ok: true, data: { title: "Renamed", enabled: false } });

    expect((await updateLink(id, { url: "javascript:1" })).ok).toBe(false);
    expect((await updateLink(id, { userId: "hack" })).ok).toBe(false); // unknown field refused

    expect((await deleteLink(id)).ok).toBe(true);
    expect(await db.link.count({ where: { id } })).toBe(0);
  });

  it("reorders links", async () => {
    const ids: string[] = [];
    for (const t of ["a", "b", "c"]) {
      const r = await createLink({ title: t, url: "example.com" });
      if (r.ok) ids.push(r.data.id);
    }
    expect((await reorderLinks([ids[2], ids[0], ids[1]])).ok).toBe(true);
    const rows = await db.link.findMany({ where: { userId: alice }, orderBy: { position: "asc" } });
    expect(rows.map((r) => r.title)).toEqual(["c", "a", "b"]);
  });

  it("refuses an order that drops, duplicates or adds links", async () => {
    const ids: string[] = [];
    for (const t of ["a", "b"]) {
      const r = await createLink({ title: t, url: "example.com" });
      if (r.ok) ids.push(r.data.id);
    }
    expect((await reorderLinks([ids[0]])).ok).toBe(false);
    expect((await reorderLinks([ids[0], ids[0]])).ok).toBe(false);
    expect((await reorderLinks([ids[0], ids[1], "extra"])).ok).toBe(false);
    expect((await reorderLinks("nope")).ok).toBe(false);
  });

  it("caps the number of links", async () => {
    await db.link.createMany({
      data: Array.from({ length: 50 }, (_, i) => ({ userId: alice, title: `l${i}`, url: "https://e.com", position: i })),
    });
    const res = await createLink({ title: "one too many", url: "example.com" });
    expect(res).toMatchObject({ ok: false });
  });
});

describe("isolation between users", () => {
  it("lets nobody edit, delete or reorder another user's links", async () => {
    const created = await createLink({ title: "Alice's", url: "https://alice.dev" });
    if (!created.ok) throw new Error("setup failed");
    const aliceLink = created.data.id;

    asBob();
    expect(await updateLink(aliceLink, { title: "pwned" })).toMatchObject({ ok: false, error: "Link not found" });
    expect(await updateLink(aliceLink, { enabled: false })).toMatchObject({ ok: false });
    expect(await deleteLink(aliceLink)).toMatchObject({ ok: false, error: "Link not found" });
    // Bob has no links, so Alice's id is "foreign" to his list
    expect((await reorderLinks([aliceLink])).ok).toBe(false);

    const row = await db.link.findUnique({ where: { id: aliceLink } });
    expect(row).toMatchObject({ title: "Alice's", enabled: true, userId: alice });
  });

  it("does not let a reorder move another user's link, even if ids are mixed in", async () => {
    const a = await createLink({ title: "A", url: "https://a.dev" });
    asBob();
    const b1 = await createLink({ title: "B1", url: "https://b.dev" });
    const b2 = await createLink({ title: "B2", url: "https://b.dev" });
    if (!a.ok || !b1.ok || !b2.ok) throw new Error("setup failed");

    expect((await reorderLinks([a.data.id, b2.data.id, b1.data.id])).ok).toBe(false);
    const aliceRow = await db.link.findUnique({ where: { id: a.data.id } });
    expect(aliceRow?.position).toBe(0);
  });

  it("keeps profile and theme changes on your own account", async () => {
    await updateProfile({ name: "Alice Updated", bio: "hello" });
    await updateTheme({ mode: "dark", accent: "#112233", buttonStyle: "soft", font: "serif" });
    const [a, b] = await Promise.all([
      db.user.findUnique({ where: { id: alice } }),
      db.user.findUnique({ where: { id: bob } }),
    ]);
    expect(a).toMatchObject({ name: "Alice Updated", bio: "hello" });
    expect(a?.theme).toMatchObject({ mode: "dark", accent: "#112233" });
    expect(b?.name).toBe("Bob");
    expect(b?.bio).toBe("");
  });
});

describe("profile and theme validation", () => {
  it("validates name, bio and avatar", async () => {
    expect((await updateProfile({ name: "", bio: "" })).ok).toBe(false);
    expect((await updateProfile({ name: "x", bio: "b".repeat(161) })).ok).toBe(false);
    expect((await updateProfile({ name: "x", bio: "", avatar: "https://evil.com/a.jpg" })).ok).toBe(false);
    expect((await updateProfile({ name: "x", bio: "", avatar: "data:image/jpeg;base64,/9j/4AAQ" })).ok).toBe(true);
    expect((await updateProfile({ name: "x", bio: "", avatar: null })).ok).toBe(true);
    expect((await db.user.findUnique({ where: { id: alice } }))?.avatar).toBeNull();
  });

  it("validates the theme", async () => {
    expect((await updateTheme({ mode: "dark", accent: "red", buttonStyle: "soft", font: "sans" })).ok).toBe(false);
    expect((await updateTheme({ mode: "neon", accent: "#112233", buttonStyle: "soft", font: "sans" })).ok).toBe(false);
  });
});

describe("usernames", () => {
  it("claims a free username and normalises it", async () => {
    const name = `Alice_${TAG}`;
    const res = await setUsername(`@${name}`);
    expect(res).toEqual({ ok: true, data: name.toLowerCase() });
  });

  it("rejects reserved, malformed and taken usernames", async () => {
    expect((await setUsername("dashboard")).ok).toBe(false);
    expect((await setUsername("a")).ok).toBe(false);
    expect((await setUsername("has space")).ok).toBe(false);

    const taken = `taken-${TAG}`.toLowerCase();
    await db.user.update({ where: { id: bob }, data: { username: taken } });
    expect(await setUsername(taken)).toMatchObject({ ok: false, error: "That username is taken" });
    expect(await checkUsername(taken)).toMatchObject({ available: false });

    // Bob re-checking his own name is fine
    asBob();
    expect(await checkUsername(taken)).toEqual({ available: true });
  });
});
