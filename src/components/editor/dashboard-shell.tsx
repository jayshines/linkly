"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { BarChart3, Check, CircleAlert, Copy, ExternalLink, Link2, Loader2, LogOut, Palette } from "lucide-react";
import { Button, cn, Logo } from "@/components/ui";
import { useEditor } from "@/components/editor/editor-provider";
import { PhonePreview } from "@/components/editor/phone-preview";

const NAV = [
  { href: "/dashboard", label: "Links", icon: Link2 },
  { href: "/dashboard/appearance", label: "Appearance", icon: Palette },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
];

function SaveIndicator() {
  const { saveState } = useEditor();
  return (
    <span className="flex h-5 items-center gap-1.5 text-xs font-medium text-faint" role="status" aria-live="polite">
      {saveState === "saving" && (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving
        </>
      )}
      {saveState === "saved" && (
        <span className="flex items-center gap-1.5 text-emerald-600">
          <Check className="h-3.5 w-3.5" strokeWidth={3} /> Saved
        </span>
      )}
      {saveState === "error" && (
        <span className="flex items-center gap-1.5 text-rose-600">
          <CircleAlert className="h-3.5 w-3.5" /> Couldn&apos;t save
        </span>
      )}
    </span>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { profile } = useEditor();
  const [copied, setCopied] = useState(false);
  const showPreview = !pathname.startsWith("/dashboard/analytics");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/${profile.username}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  const isActive = (href: string) => (href === "/dashboard" ? pathname === href : pathname.startsWith(href));

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[232px_1fr]">
      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-line bg-surface p-4 lg:flex">
        <Link href="/dashboard" className="flex items-center gap-2.5 px-2 py-2">
          <Logo />
          <span className="text-lg font-bold tracking-tight">Linkly</span>
        </Link>

        <nav className="mt-6 space-y-1" aria-label="Dashboard">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={isActive(n.href) ? "page" : undefined}
              className={cn(
                "focus-ring flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors",
                isActive(n.href) ? "bg-accent/10 text-accent" : "text-muted hover:bg-surface-2 hover:text-fg"
              )}
            >
              <n.icon className="h-[18px] w-[18px]" />
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto space-y-3">
          <div className="flex items-center gap-3 rounded-2xl bg-surface-2 p-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-accent/15 text-sm font-bold text-accent">
              {profile.avatar ?? profile.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={(profile.avatar ?? profile.image)!} alt="" className="h-full w-full object-cover" />
              ) : (
                (profile.name[0] ?? "?").toUpperCase()
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{profile.name}</p>
              <p className="truncate text-xs text-muted">@{profile.username}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => signOut({ callbackUrl: "/login" })}>
            <LogOut className="h-4 w-4" /> Log out
          </Button>
        </div>
      </aside>

      <div className="min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-20 border-b border-line bg-bg/85 backdrop-blur-lg">
          <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
            <Link href="/dashboard" className="flex items-center gap-2 lg:hidden" aria-label="Linkly">
              <Logo size={26} />
            </Link>
            <SaveIndicator />
            <div className="ml-auto flex items-center gap-2">
              <div className="hidden items-center gap-1 rounded-full border border-line bg-surface py-1 pl-4 pr-1 text-sm sm:flex">
                <span className="max-w-[200px] truncate text-muted">/{profile.username}</span>
                <button
                  onClick={copy}
                  className="focus-ring flex h-7 items-center gap-1.5 rounded-full bg-surface-2 px-3 text-xs font-semibold hover:bg-line"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" strokeWidth={3} /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <a
                href={`/${profile.username}`}
                target="_blank"
                rel="noreferrer"
                className="focus-ring inline-flex h-9 items-center gap-1.5 rounded-full bg-fg px-4 text-xs font-semibold text-bg hover:opacity-90"
              >
                View page <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          {/* Tabs (mobile) */}
          <nav className="flex gap-1 overflow-x-auto px-3 pb-2 lg:hidden" aria-label="Dashboard">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                aria-current={isActive(n.href) ? "page" : undefined}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold",
                  isActive(n.href) ? "bg-accent/10 text-accent" : "text-muted"
                )}
              >
                <n.icon className="h-4 w-4" />
                {n.label}
              </Link>
            ))}
          </nav>
        </header>

        <div className={cn("grid gap-8 p-4 sm:p-6", showPreview && "xl:grid-cols-[minmax(0,1fr)_340px]")}>
          <main className="min-w-0 max-w-2xl">{children}</main>
          {showPreview && (
            <aside className="hidden xl:block">
              <div className="sticky top-24">
                <PhonePreview />
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
