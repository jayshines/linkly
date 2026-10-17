import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isHttpUrl } from "@/lib/validators";

// Link previews, crawlers and scripts shouldn't inflate click counts.
// A missing User-Agent is treated as a bot too.
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse|curl|wget|python-requests|httpclient/i;

export const dynamic = "force-dynamic";

/**
 * Public link buttons point here. We record the click, then redirect to the
 * real URL. It works without JavaScript and is not blocked by ad blockers.
 * A failure to record a click never stops the visitor reaching the link.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { linkId: string } }
) {
  const link = await db.link.findUnique({
    where: { id: params.linkId },
    select: { id: true, url: true, enabled: true },
  });

  // Unknown or switched-off link, or anything that isn't a plain http(s) URL
  if (!link || !link.enabled || !isHttpUrl(link.url)) {
    return new NextResponse("This link isn't available.", { status: 404 });
  }

  const ua = req.headers.get("user-agent") ?? "";
  if (ua && !BOT.test(ua)) {
    try {
      await db.click.create({
        data: {
          linkId: link.id,
          referrer: req.headers.get("referer")?.slice(0, 300) || null,
        },
      });
    } catch (err) {
      console.error("click tracking failed", err);
    }
  }

  const res = NextResponse.redirect(link.url, 302);
  res.headers.set("Cache-Control", "no-store");
  return res;
}
