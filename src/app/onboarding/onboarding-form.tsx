"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, X } from "lucide-react";
import { checkUsername, setUsername } from "@/app/dashboard/actions";
import { Button, Logo } from "@/components/ui";
import { normalizeUsername, usernameProblem } from "@/lib/validators";

type Status = { state: "idle" | "checking" | "ok" | "bad"; message?: string };

export function OnboardingForm({ suggestion }: { suggestion: string }) {
  const router = useRouter();
  const [value, setValue] = useState(suggestion);
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [host, setHost] = useState("linkly.app");

  useEffect(() => setHost(window.location.host), []);

  // Check availability shortly after the user stops typing
  useEffect(() => {
    const username = normalizeUsername(value);
    if (!username) return setStatus({ state: "idle" });

    const local = usernameProblem(username);
    if (local) return setStatus({ state: "bad", message: local });

    setStatus({ state: "checking" });
    let cancelled = false;
    const t = setTimeout(async () => {
      const res = await checkUsername(username).catch(() => null);
      if (cancelled || !res) return;
      setStatus(res.available ? { state: "ok" } : { state: "bad", message: res.message });
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [value]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status.state !== "ok" || saving) return;
    setSaving(true);
    setError("");
    const res = await setUsername(value);
    if (!res.ok) {
      setError(res.error);
      setSaving(false);
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  };

  return (
    <main className="grid min-h-screen place-items-center px-6 py-12">
      <form onSubmit={submit} className="w-full max-w-md animate-rise rounded-3xl border border-line bg-surface p-8 shadow-card">
        <Logo size={36} />
        <h1 className="mt-6 text-2xl font-bold tracking-tight">Claim your link</h1>
        <p className="mt-2 text-sm text-muted">
          Pick a username. It becomes the address of your page, and you can share it anywhere.
        </p>

        <label htmlFor="username" className="label mb-1.5 mt-7 block">
          Username
        </label>
        <div className="focus-within:ring-2 focus-within:ring-accent/40 flex h-12 items-center rounded-2xl border border-line bg-surface px-4">
          <span className="text-sm text-faint">{host}/</span>
          <input
            id="username"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoFocus
            autoComplete="off"
            spellCheck={false}
            maxLength={31}
            placeholder="yourname"
            className="min-w-0 flex-1 bg-transparent pl-0.5 text-[15px] font-semibold outline-none placeholder:font-normal placeholder:text-faint"
          />
          <span className="ml-2 grid h-5 w-5 place-items-center">
            {status.state === "checking" && <Loader2 className="h-4 w-4 animate-spin text-faint" />}
            {status.state === "ok" && <Check className="h-4 w-4 text-emerald-600" strokeWidth={3} />}
            {status.state === "bad" && <X className="h-4 w-4 text-rose-500" strokeWidth={3} />}
          </span>
        </div>
        <p className="mt-2 min-h-5 text-xs" aria-live="polite">
          {status.state === "bad" && <span className="text-rose-600">{status.message}</span>}
          {status.state === "ok" && <span className="text-emerald-700">{host}/{normalizeUsername(value)} is available</span>}
        </p>

        {error && (
          <p role="alert" className="mt-2 rounded-xl bg-rose-500/10 px-4 py-3 text-sm text-rose-700">
            {error}
          </p>
        )}

        <Button type="submit" variant="primary" size="lg" className="mt-5 w-full" disabled={status.state !== "ok" || saving}>
          {saving && <Loader2 className="h-5 w-5 animate-spin" />}
          Continue
        </Button>
      </form>
    </main>
  );
}
