"use client";

import { useEffect, useRef, useState } from "react";
import { Reorder, useDragControls } from "framer-motion";
import { BarChart3, ChevronDown, ChevronUp, GripVertical, Trash2 } from "lucide-react";
import { deleteLink, updateLink } from "@/app/dashboard/actions";
import { cn } from "@/components/ui";
import { useEditor, type EditorLink } from "@/components/editor/editor-provider";

function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={cn("focus-ring relative h-6 w-11 shrink-0 rounded-full transition-colors", on ? "bg-emerald-500" : "bg-line")}
    >
      <span className={cn("absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform", on && "translate-x-5")} />
    </button>
  );
}

export function LinkCard({
  link,
  index,
  total,
  onDragEnd,
  onMove,
}: {
  link: EditorLink;
  index: number;
  total: number;
  onDragEnd: () => void;
  onMove: (from: number, to: number) => void;
}) {
  const controls = useDragControls();
  const { setLinks, track } = useEditor();

  const [title, setTitle] = useState(link.title);
  const [url, setUrl] = useState(link.url);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const timers = useRef<{ title?: ReturnType<typeof setTimeout>; url?: ReturnType<typeof setTimeout> }>({});

  useEffect(() => {
    const t = timers.current;
    return () => {
      clearTimeout(t.title);
      clearTimeout(t.url);
    };
  }, []);

  const patch = (partial: Partial<Pick<EditorLink, "title" | "url" | "enabled">>) =>
    setLinks((ls) => ls.map((l) => (l.id === link.id ? { ...l, ...partial } : l)));

  // Save one field. On success keep the server's cleaned-up value (e.g. https:// added).
  const save = async (field: "title" | "url", value: string) => {
    if (value === link[field]) return;
    const res = await track(updateLink(link.id, { [field]: value }));
    if (!res.ok) return setError(res.error);
    setError("");
    patch({ [field]: res.data[field] });
    if (field === "url") setUrl(res.data.url);
    else setTitle(res.data.title);
  };

  const schedule = (field: "title" | "url", value: string) => {
    clearTimeout(timers.current[field]);
    timers.current[field] = setTimeout(() => save(field, value), 700);
    // Show the new title in the preview straight away (URL waits until it is valid)
    if (field === "title" && value.trim()) patch({ title: value });
  };

  const toggle = async (enabled: boolean) => {
    patch({ enabled }); // optimistic
    const res = await track(updateLink(link.id, { enabled }));
    if (!res.ok) {
      patch({ enabled: !enabled });
      setError(res.error);
    }
  };

  const remove = async () => {
    const res = await track(deleteLink(link.id));
    if (res.ok) setLinks((ls) => ls.filter((l) => l.id !== link.id));
    else setError(res.error);
  };

  return (
    <Reorder.Item
      value={link}
      dragListener={false}
      dragControls={controls}
      onDragEnd={onDragEnd}
      whileDrag={{ scale: 1.02, boxShadow: "0 18px 40px -12px rgba(0,0,0,0.25)" }}
      className={cn(
        "relative flex items-stretch gap-1 rounded-2xl border border-line bg-surface p-3 shadow-card",
        !link.enabled && "opacity-70"
      )}
    >
      {/* One calm drag handle. The up/down buttons exist for keyboard users and appear on focus. */}
      <div className="flex flex-col items-center justify-center">
        <div className="sr-only focus-within:not-sr-only">
          <button
            onClick={() => onMove(index, index - 1)}
            disabled={index === 0}
            aria-label={`Move ${link.title} up`}
            className="focus-ring grid h-5 w-6 place-items-center rounded text-faint hover:text-fg disabled:opacity-25"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
        </div>
        <button
          onPointerDown={(e) => controls.start(e)}
          aria-label={`Drag to reorder ${link.title}`}
          className="focus-ring grid h-10 w-7 cursor-grab touch-none place-items-center rounded-lg text-faint transition-colors hover:bg-surface-2 hover:text-fg active:cursor-grabbing"
        >
          <GripVertical className="h-[18px] w-[18px]" />
        </button>
        <div className="sr-only focus-within:not-sr-only">
          <button
            onClick={() => onMove(index, index + 1)}
            disabled={index === total - 1}
            aria-label={`Move ${link.title} down`}
            className="focus-ring grid h-5 w-6 place-items-center rounded text-faint hover:text-fg disabled:opacity-25"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="min-w-0 flex-1 px-2">
        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            schedule("title", e.target.value);
          }}
          onBlur={() => {
            clearTimeout(timers.current.title);
            save("title", title);
          }}
          aria-label="Link title"
          maxLength={80}
          placeholder="Title"
          className="focus-ring w-full rounded-md bg-transparent px-1 py-0.5 text-[15px] font-semibold outline-none hover:bg-surface-2 focus:bg-surface-2"
        />
        <input
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setError("");
            schedule("url", e.target.value);
          }}
          onBlur={() => {
            clearTimeout(timers.current.url);
            save("url", url);
          }}
          aria-label="Link URL"
          aria-invalid={!!error}
          inputMode="url"
          autoCapitalize="off"
          spellCheck={false}
          placeholder="https://"
          className="focus-ring mt-0.5 w-full rounded-md bg-transparent px-1 py-0.5 text-sm text-muted outline-none hover:bg-surface-2 focus:bg-surface-2"
        />
        {error && (
          <p role="alert" className="mt-1 px-1 text-xs font-medium text-rose-600">
            {error}
          </p>
        )}

        <div className="mt-2 flex items-center gap-1 px-1">
          <span className="num flex items-center gap-1.5 text-xs text-faint" title="Total clicks">
            <BarChart3 className="h-3.5 w-3.5" />
            {link.clicks} {link.clicks === 1 ? "click" : "clicks"}
          </span>
          <span className="flex-1" />
          {confirming ? (
            <span className="flex items-center gap-1.5">
              <button onClick={() => setConfirming(false)} className="focus-ring rounded-full px-3 py-1 text-xs font-semibold text-muted hover:bg-surface-2">
                Cancel
              </button>
              <button onClick={remove} className="focus-ring rounded-full bg-rose-500 px-3 py-1 text-xs font-semibold text-white hover:bg-rose-600">
                Delete
              </button>
            </span>
          ) : (
            <button
              onClick={() => setConfirming(true)}
              aria-label={`Delete ${link.title}`}
              className="focus-ring grid h-8 w-8 place-items-center rounded-full text-faint hover:bg-rose-500/10 hover:text-rose-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-start pt-1">
        <Switch on={link.enabled} onChange={toggle} label={`${link.enabled ? "Hide" : "Show"} ${link.title}`} />
      </div>
    </Reorder.Item>
  );
}
