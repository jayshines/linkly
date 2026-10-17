"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import type { LinkView } from "@/app/dashboard/actions";
import type { Theme } from "@/lib/theme";

export type EditorLink = LinkView & { clicks: number };

export type Profile = {
  name: string;
  bio: string;
  username: string;
  avatar: string | null;
  image: string | null;
};

type SaveState = "idle" | "saving" | "saved" | "error";

type Ctx = {
  profile: Profile;
  setProfile: React.Dispatch<React.SetStateAction<Profile>>;
  theme: Theme;
  setTheme: React.Dispatch<React.SetStateAction<Theme>>;
  links: EditorLink[];
  setLinks: React.Dispatch<React.SetStateAction<EditorLink[]>>;
  saveState: SaveState;
  /** Wrap any server call so the header shows Saving, Saved or Couldn't save. */
  track: <T extends { ok: boolean }>(p: Promise<T>) => Promise<T>;
};

const EditorContext = createContext<Ctx | null>(null);

export function EditorProvider({
  initial,
  children,
}: {
  initial: { profile: Profile; theme: Theme; links: EditorLink[] };
  children: React.ReactNode;
}) {
  const [profile, setProfile] = useState(initial.profile);
  const [theme, setTheme] = useState(initial.theme);
  const [links, setLinks] = useState(initial.links);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  const pending = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const track = useCallback(async <T extends { ok: boolean }>(p: Promise<T>) => {
    pending.current++;
    clearTimeout(timer.current);
    setSaveState("saving");
    try {
      const res = await p;
      pending.current--;
      if (pending.current === 0) {
        setSaveState(res.ok ? "saved" : "error");
        timer.current = setTimeout(() => setSaveState("idle"), 2200);
      }
      return res;
    } catch (e) {
      pending.current--;
      setSaveState("error");
      throw e;
    }
  }, []);

  return (
    <EditorContext.Provider value={{ profile, setProfile, theme, setTheme, links, setLinks, saveState, track }}>
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor() {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error("useEditor must be used inside EditorProvider");
  return ctx;
}
