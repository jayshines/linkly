"use client";

import { useRef, useState } from "react";
import { Reorder } from "framer-motion";
import { Link2, Loader2, Plus, X } from "lucide-react";
import { createLink, reorderLinks } from "@/app/dashboard/actions";
import { Button } from "@/components/ui";
import { useEditor } from "@/components/editor/editor-provider";
import { LinkCard } from "@/components/editor/link-card";

function AddLink() {
  const { setLinks, track } = useEditor();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setOpen(false);
    setTitle("");
    setUrl("");
    setError("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const res = await track(createLink({ title, url }));
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setLinks((ls) => [...ls, { ...res.data, clicks: 0 }]);
    reset();
  };

  if (!open) {
    return (
      <Button variant="primary" size="lg" className="w-full" onClick={() => setOpen(true)}>
        <Plus className="h-5 w-5" strokeWidth={3} /> Add link
      </Button>
    );
  }

  return (
    <form onSubmit={submit} className="animate-rise rounded-2xl border border-accent/40 bg-surface p-4 shadow-card">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold">New link</p>
        <button type="button" onClick={reset} aria-label="Cancel" className="focus-ring grid h-8 w-8 place-items-center rounded-full text-faint hover:bg-surface-2 hover:text-fg">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 space-y-2.5">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title, e.g. My portfolio"
          aria-label="Title"
          maxLength={80}
          autoFocus
          className="focus-ring h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-[15px] placeholder:text-faint"
        />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          aria-label="URL"
          inputMode="url"
          autoCapitalize="off"
          spellCheck={false}
          className="focus-ring h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-[15px] placeholder:text-faint"
        />
      </div>
      {error && (
        <p role="alert" className="mt-2.5 text-sm font-medium text-rose-600">
          {error}
        </p>
      )}
      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={reset}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={busy || !title.trim() || !url.trim()}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Add link
        </Button>
      </div>
    </form>
  );
}

export function LinkList() {
  const { links, setLinks, track } = useEditor();
  const latest = useRef(links);
  latest.current = links;

  const persist = async () => {
    const res = await track(reorderLinks(latest.current.map((l) => l.id)));
    if (!res.ok) window.location.reload(); // list was out of date: reload the truth
  };

  // Button-based move for keyboard users
  const move = (from: number, to: number) => {
    if (to < 0 || to >= links.length) return;
    const next = links.slice();
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    latest.current = next;
    setLinks(next);
    persist();
  };

  return (
    <section aria-label="Your links" className="space-y-4">
      <AddLink />

      {links.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-line px-6 py-14 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-surface-2 text-muted">
            <Link2 className="h-5 w-5" />
          </span>
          <p className="mt-4 font-semibold">No links yet</p>
          <p className="mt-1 text-sm text-muted">Add your first link and it shows up on your page right away.</p>
        </div>
      ) : (
        <Reorder.Group axis="y" values={links} onReorder={setLinks} className="space-y-3">
          {links.map((l, i) => (
            <LinkCard key={l.id} link={l} index={i} total={links.length} onDragEnd={persist} onMove={move} />
          ))}
        </Reorder.Group>
      )}
    </section>
  );
}
