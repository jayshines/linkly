import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// Deterministic PRNG so every seed run creates the same data
function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const LINKS = [
  { title: "My portfolio", url: "https://jaysharma.dev", weight: 10 },
  { title: "Latest blog post", url: "https://jaysharma.dev/blog", weight: 6 },
  { title: "GitHub", url: "https://github.com", weight: 5 },
  { title: "Book a 15-min call", url: "https://cal.com", weight: 3 },
  { title: "Newsletter", url: "https://example.com/newsletter", weight: 2 },
];

async function main() {
  await db.user.deleteMany({ where: { OR: [{ username: "demo" }, { email: "demo@linkly.local" }] } });

  const user = await db.user.create({
    data: {
      email: "demo@linkly.local",
      name: "Alex Morgan",
      username: "demo",
      bio: "Designer and developer. I build calm, fast things for the web.",
      theme: { mode: "light", accent: "#7c3aed", buttonStyle: "filled", font: "sans" },
      links: {
        create: LINKS.map((l, position) => ({ title: l.title, url: l.url, position })),
      },
    },
    include: { links: { orderBy: { position: "asc" } } },
  });

  // ~300 clicks across the last 30 days, weighted by link and busier on weekdays
  const rand = rng(7);
  const pool = user.links.flatMap((l, i) => Array(LINKS[i].weight).fill(l.id));
  const now = Date.now();
  const clicks: { linkId: string; createdAt: Date; referrer: string | null }[] = [];

  for (let day = 0; day < 30; day++) {
    const date = new Date(now - day * 86_400_000);
    const weekend = [0, 6].includes(date.getUTCDay());
    const count = Math.round((weekend ? 5 : 11) * (0.6 + rand() * 0.8) * (1 + (30 - day) / 90));
    for (let i = 0; i < count; i++) {
      const createdAt = new Date(date);
      createdAt.setUTCHours(Math.floor(rand() * 24), Math.floor(rand() * 60), 0, 0);
      if (createdAt.getTime() > now) continue;
      clicks.push({
        linkId: pool[Math.floor(rand() * pool.length)],
        createdAt,
        referrer: rand() < 0.4 ? "https://twitter.com/" : null,
      });
    }
  }

  await db.click.createMany({ data: clicks });
  console.log(`Seeded /demo with ${user.links.length} links and ${clicks.length} clicks`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
