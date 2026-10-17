"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Moon, Sun } from "lucide-react";
import { updateTheme } from "@/app/dashboard/actions";
import { cn } from "@/components/ui";
import { useEditor } from "@/components/editor/editor-provider";
import { ACCENT_SWATCHES, alpha, readableOn, type Theme } from "@/lib/theme";

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-line bg-surface p-5 shadow-card">
      <h2 className="text-sm font-bold">{title}</h2>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** A tiny page in the chosen mode and accent colour, so the choice is visible before you pick it. */
function MiniPage({ mode, accent }: { mode: Theme["mode"]; accent: string }) {
  const dark = mode === "dark";
  return (
    <span
      className="mt-3 flex h-[88px] flex-col items-center gap-1.5 overflow-hidden rounded-xl px-5 pt-3"
      style={{
        background: dark
          ? `radial-gradient(120px 60px at 50% 0%, ${alpha(accent, 0.35)}, transparent 70%), #0b0b0c`
          : `linear-gradient(180deg, ${alpha(accent, 0.2)}, #ffffff)`,
      }}
      aria-hidden="true"
    >
      <span className="h-4 w-4 rounded-full" style={{ background: alpha(accent, 0.35), boxShadow: `0 0 0 1.5px ${accent}` }} />
      <span className="h-1 w-10 rounded-full" style={{ background: dark ? "#f5f5f4" : "#1c1917", opacity: 0.8 }} />
      <span className="mt-0.5 h-3.5 w-full rounded-full" style={{ background: accent }} />
      <span className="h-3.5 w-full rounded-full" style={{ boxShadow: `inset 0 0 0 1.5px ${accent}` }} />
    </span>
  );
}

const choice = (on: boolean) =>
  cn(
    "focus-ring rounded-2xl border-2 p-3 text-left transition-all",
    on ? "border-accent bg-accent/5" : "border-line bg-surface hover:border-faint"
  );

export function AppearancePanel() {
  const { theme, setTheme, track } = useEditor();
  const [hex, setHex] = useState(theme.accent);
  const [error, setError] = useState("");
  const first = useRef(true);
  const latest = useRef(theme);
  latest.current = theme;

  // Autosave shortly after the last change
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(async () => {
      const res = await track(updateTheme(latest.current));
      setError(res.ok ? "" : res.error);
    }, 600);
    return () => clearTimeout(t);
  }, [theme, track]);

  const set = (patch: Partial<Theme>) => setTheme((t) => ({ ...t, ...patch }));

  const onHex = (v: string) => {
    const value = v.startsWith("#") ? v : `#${v}`;
    setHex(value.slice(0, 7));
    if (/^#[0-9a-fA-F]{6}$/.test(value)) set({ accent: value.toLowerCase() });
  };

  const swatch = (c: string) => {
    setHex(c);
    set({ accent: c });
  };

  const demo = (style: Theme["buttonStyle"]): React.CSSProperties => {
    const text = theme.mode === "dark" ? "#f5f5f4" : "#1c1917";
    if (style === "outline") return { border: `2px solid ${theme.accent}`, color: text };
    if (style === "soft") return { background: alpha(theme.accent, 0.16), border: `1px solid ${alpha(theme.accent, 0.3)}`, color: text };
    return { background: theme.accent, border: `2px solid ${theme.accent}`, color: readableOn(theme.accent) };
  };

  return (
    <div className="animate-rise space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Appearance</h1>
        <p className="mt-1 text-sm text-muted">Pick a look. The preview updates as you go and saves automatically.</p>
      </div>

      <Section title="Theme">
        <div role="radiogroup" aria-label="Theme mode" className="grid grid-cols-2 gap-3">
          {(
            [
              ["light", "Light", Sun],
              ["dark", "Dark", Moon],
            ] as const
          ).map(([mode, label, Icon]) => (
            <button key={mode} role="radio" aria-checked={theme.mode === mode} onClick={() => set({ mode })} className={choice(theme.mode === mode)}>
              <span className="flex items-center gap-2 text-sm font-semibold">
                <Icon className="h-4 w-4" /> {label}
                {theme.mode === mode && <Check className="ml-auto h-4 w-4 text-accent" strokeWidth={3} />}
              </span>
              <MiniPage mode={mode} accent={theme.accent} />
            </button>
          ))}
        </div>
      </Section>

      <Section title="Accent colour" hint="Used for buttons, your photo ring and highlights.">
        <div className="flex flex-wrap gap-2.5" role="radiogroup" aria-label="Accent colour">
          {ACCENT_SWATCHES.map((c) => (
            <button
              key={c}
              role="radio"
              aria-checked={theme.accent === c}
              aria-label={c}
              onClick={() => swatch(c)}
              className="focus-ring grid h-10 w-10 place-items-center rounded-full ring-offset-2 transition-transform hover:scale-110"
              style={{ background: c, boxShadow: theme.accent === c ? `0 0 0 2px #fff, 0 0 0 4px ${c}` : undefined }}
            >
              {theme.accent === c && <Check className="h-4 w-4" strokeWidth={3} style={{ color: readableOn(c) }} />}
            </button>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <label htmlFor="hex" className="label">
            Custom
          </label>
          <div className="flex h-11 items-center gap-2.5 rounded-xl border border-line bg-surface px-3">
            <span className="h-5 w-5 rounded-full border border-line" style={{ background: /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : "transparent" }} />
            <input
              id="hex"
              value={hex}
              onChange={(e) => onHex(e.target.value)}
              spellCheck={false}
              maxLength={7}
              aria-invalid={!/^#[0-9a-fA-F]{6}$/.test(hex)}
              className="w-24 bg-transparent font-mono text-sm uppercase outline-none"
            />
          </div>
          {!/^#[0-9a-fA-F]{6}$/.test(hex) && <span className="text-xs text-rose-600">Use 6 digits, like #7C3AED</span>}
        </div>
      </Section>

      <Section title="Button style">
        <div role="radiogroup" aria-label="Button style" className="grid grid-cols-3 gap-3">
          {(["filled", "outline", "soft"] as const).map((s) => (
            <button key={s} role="radio" aria-checked={theme.buttonStyle === s} onClick={() => set({ buttonStyle: s })} className={choice(theme.buttonStyle === s)}>
              <span className="flex h-9 items-center justify-center rounded-full text-[11px] font-semibold" style={demo(s)}>
                Link
              </span>
              <span className="mt-2 block text-center text-xs font-semibold capitalize">{s}</span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Font">
        <div role="radiogroup" aria-label="Font" className="grid grid-cols-3 gap-3">
          {(
            [
              ["sans", "Modern", "var(--font-sans)"],
              ["serif", "Classic", "var(--font-serif)"],
              ["mono", "Technical", "var(--font-mono)"],
            ] as const
          ).map(([f, label, family]) => (
            <button key={f} role="radio" aria-checked={theme.font === f} onClick={() => set({ font: f })} className={choice(theme.font === f)}>
              <span className="block text-center text-2xl font-bold" style={{ fontFamily: family }}>
                Aa
              </span>
              <span className="mt-1 block text-center text-xs font-semibold">{label}</span>
            </button>
          ))}
        </div>
      </Section>

      {error && (
        <p role="alert" className="text-sm font-medium text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}
