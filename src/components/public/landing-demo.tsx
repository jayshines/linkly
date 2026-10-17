"use client";

import { useState } from "react";
import { ProfileCard } from "@/components/public/profile-card";
import { cn } from "@/components/ui";
import type { Theme } from "@/lib/theme";

const LINKS = [
  { id: "1", title: "Portfolio", url: "https://alexmorgan.design" },
  { id: "2", title: "Latest video", url: "https://youtube.com/@alex" },
  { id: "3", title: "Behind the scenes", url: "https://instagram.com/alex" },
  { id: "4", title: "Book a 15-min call", url: "https://cal.com/alex" },
];

const ACCENTS = ["#7c3aed", "#2563eb", "#16a34a", "#f97316", "#e11d48", "#111827"];

/** The real profile component, with controls, so visitors can try the product on the landing page. */
export function LandingDemo() {
  const [accent, setAccent] = useState(ACCENTS[0]);
  const [mode, setMode] = useState<Theme["mode"]>("light");
  const [style, setStyle] = useState<Theme["buttonStyle"]>("filled");

  const theme: Theme = { mode, accent, buttonStyle: style, font: "sans" };

  return (
    <div className="mx-auto w-[300px]">
      <div className="rounded-[44px] border-[9px] border-fg bg-fg shadow-pop">
        <div className="h-[520px] overflow-hidden rounded-[34px] bg-white">
          <ProfileCard
            name="Alex Morgan"
            username="alex"
            bio="Designer and writer. Making calm things for the web."
            avatar={null}
            image={null}
            theme={theme}
            links={LINKS}
            compact
          />
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-line bg-surface p-4 shadow-card">
        <p className="label">Try it, it&apos;s live</p>
        <div className="mt-3.5 flex items-center gap-2.5" role="radiogroup" aria-label="Accent colour">
          {ACCENTS.map((c) => (
            <button
              key={c}
              role="radio"
              aria-checked={accent === c}
              aria-label={c}
              onClick={() => setAccent(c)}
              className="focus-ring h-7 w-7 rounded-full transition-transform hover:scale-110"
              style={{ background: c, boxShadow: accent === c ? `0 0 0 2px #fff, 0 0 0 4px ${c}` : undefined }}
            />
          ))}
        </div>
        <div className="mt-3.5 grid grid-cols-5 gap-1.5 text-xs font-semibold" role="group" aria-label="Mode and button style">
          {(["light", "dark"] as const).map((m) => (
            <button
              key={m}
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
              className={cn(
                "focus-ring col-span-1 rounded-full border px-1 py-1.5 capitalize transition-colors",
                mode === m ? "border-fg bg-fg text-bg" : "border-line text-muted hover:text-fg"
              )}
            >
              {m}
            </button>
          ))}
          {(["filled", "outline", "soft"] as const).map((s) => (
            <button
              key={s}
              aria-pressed={style === s}
              onClick={() => setStyle(s)}
              className={cn(
                "focus-ring col-span-1 rounded-full border px-1 py-1.5 capitalize transition-colors",
                style === s ? "border-accent bg-accent/10 text-accent" : "border-line text-muted hover:text-fg"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
