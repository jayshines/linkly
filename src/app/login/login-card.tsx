"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Loader2, Wrench } from "lucide-react";
import { Button, GitHubMark, Logo } from "@/components/ui";
import { ProfileCard } from "@/components/public/profile-card";

const ERRORS: Record<string, string> = {
  OAuthAccountNotLinked: "That email is already used by another sign-in method.",
  AccessDenied: "Access was denied. Please try again.",
  Configuration: "Sign-in isn't configured correctly yet.",
};

export function LoginCard({ devLogin, githubReady }: { devLogin: boolean; githubReady: boolean }) {
  const params = useSearchParams();
  const [busy, setBusy] = useState<"github" | "dev" | null>(null);
  const error = params.get("error");
  const callbackUrl = params.get("callbackUrl") ?? "/dashboard";

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-fg p-12 text-bg lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <Logo size={36} />
          <span className="text-xl font-bold tracking-tight">Linkly</span>
        </div>

        {/* The real profile component, not a drawing of one */}
        <div className="mx-auto w-[250px] rounded-[38px] border-[8px] border-bg/25 shadow-pop" aria-hidden="true">
          <div className="h-[330px] overflow-hidden rounded-[30px]">
            <ProfileCard
              name="Alex Morgan"
              username="alex"
              bio="Designer and writer."
              avatar={null}
              image={null}
              theme={{ mode: "dark", accent: "#a78bfa", buttonStyle: "filled", font: "sans" }}
              links={[
                { id: "1", title: "Portfolio", url: "https://alexmorgan.design" },
                { id: "2", title: "Latest video", url: "https://youtube.com/@alex" },
                { id: "3", title: "GitHub", url: "https://github.com/alex" },
              ]}
              compact
            />
          </div>
        </div>

        <div className="max-w-md">
          <p className="text-4xl font-extrabold leading-[1.05] tracking-[-0.03em]">
            Your whole internet, one tidy link.
          </p>
          <p className="mt-4 text-base opacity-60">
            Build a page in a minute, share it anywhere, and see which links people actually tap.
          </p>
        </div>
      </aside>

      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm animate-rise">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <Logo />
            <span className="text-lg font-bold tracking-tight">Linkly</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight">Welcome to Linkly</h1>
          <p className="mt-2 text-sm text-muted">Sign in to build and manage your page.</p>

          {error && (
            <p role="alert" className="mt-6 rounded-xl bg-rose-500/10 px-4 py-3 text-sm text-rose-700">
              {ERRORS[error] ?? "Something went wrong signing you in."}
            </p>
          )}

          <div className="mt-8 space-y-3">
            <Button
              variant="dark"
              size="lg"
              className="w-full"
              disabled={busy !== null || !githubReady}
              onClick={() => {
                setBusy("github");
                signIn("github", { callbackUrl });
              }}
            >
              {busy === "github" ? <Loader2 className="h-5 w-5 animate-spin" /> : <GitHubMark className="h-5 w-5" />}
              Continue with GitHub
            </Button>

            {!githubReady && (
              <p className="rounded-xl bg-amber-500/10 px-4 py-3 text-xs leading-relaxed text-amber-800">
                GitHub sign-in isn&apos;t set up yet. Add <code className="font-mono">GITHUB_ID</code> and{" "}
                <code className="font-mono">GITHUB_SECRET</code> to <code className="font-mono">.env.local</code> (see the README).
              </p>
            )}

            {devLogin && (
              <>
                <div className="flex items-center gap-3 py-1 text-xs text-faint">
                  <span className="h-px flex-1 bg-line" /> development only <span className="h-px flex-1 bg-line" />
                </div>
                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full"
                  disabled={busy !== null}
                  onClick={() => {
                    setBusy("dev");
                    signIn("dev", { callbackUrl });
                  }}
                >
                  {busy === "dev" ? <Loader2 className="h-5 w-5 animate-spin" /> : <Wrench className="h-4 w-4" />}
                  Dev login (no GitHub)
                </Button>
              </>
            )}
          </div>

          <p className="mt-8 text-center text-xs text-faint">
            By continuing you agree to use Linkly responsibly.
          </p>
        </div>
      </section>
    </main>
  );
}
