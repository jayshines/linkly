import Link from "next/link";
import { Logo } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-6 text-center">
      <div className="max-w-sm">
        <div className="mx-auto w-fit">
          <Logo size={44} />
        </div>
        <h1 className="mt-6 text-2xl font-bold tracking-tight">This page doesn&apos;t exist</h1>
        <p className="mt-2 text-sm text-muted">
          Nobody has claimed this username yet. Want it for yourself?
        </p>
        <Link
          href="/login"
          className="focus-ring mt-6 inline-flex h-11 items-center rounded-full bg-accent px-6 text-sm font-semibold text-accent-fg hover:brightness-110"
        >
          Create your Linkly
        </Link>
      </div>
    </main>
  );
}
