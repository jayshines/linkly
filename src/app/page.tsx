import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { currentUserId } from "@/lib/auth";
import { Logo } from "@/components/ui";
import { LandingDemo } from "@/components/public/landing-demo";

const STEPS = [
  ["01", "Add your links", "Paste a URL, give it a name, drag it where you want it."],
  ["02", "Make it yours", "Pick a colour, a button style and a font. The preview updates as you go."],
  ["03", "Share and learn", "Put one link in your bio, then see which links people actually tap."],
];

export default async function Landing() {
  const signedIn = !!(await currentUserId());
  const cta = signedIn ? { href: "/dashboard", label: "Open dashboard" } : { href: "/login", label: "Make your page" };

  return (
    <div className="min-h-screen overflow-hidden">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <div className="flex items-center gap-2.5">
          <Logo />
          <span className="text-lg font-bold tracking-tight">Linkly</span>
        </div>
        <Link href={cta.href} className="focus-ring rounded-full border border-line bg-surface px-5 py-2 text-sm font-semibold hover:bg-surface-2">
          {signedIn ? "Dashboard" : "Log in"}
        </Link>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-24 pt-10 lg:pt-16">
        <div className="grid items-start gap-14 lg:grid-cols-[1.15fr_1fr]">
          <div className="animate-rise lg:pt-6">
            <h1 className="max-w-xl text-5xl font-extrabold leading-[1.02] tracking-[-0.035em] sm:text-[68px]">
              Your whole internet, one tidy link.
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-muted">
              Put everything you share on a single page that looks like you, then see which links people actually tap.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href={cta.href} className="focus-ring group inline-flex h-12 items-center gap-2 rounded-full bg-fg px-7 text-[15px] font-semibold text-bg transition-opacity hover:opacity-90">
                {cta.label}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link href="/demo" className="focus-ring inline-flex h-12 items-center rounded-full px-5 text-[15px] font-semibold text-muted hover:text-fg">
                See a real page
              </Link>
            </div>

            <ol className="mt-16 grid max-w-xl gap-x-8 gap-y-8 sm:grid-cols-3">
              {STEPS.map(([n, title, text]) => (
                <li key={n} className="border-t border-fg pt-3">
                  <span className="font-mono text-xs text-faint">{n}</span>
                  <p className="mt-2 text-[15px] font-bold tracking-tight">{title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{text}</p>
                </li>
              ))}
            </ol>
          </div>

          <div className="animate-rise [animation-delay:120ms]">
            <LandingDemo />
          </div>
        </div>
      </main>
    </div>
  );
}
