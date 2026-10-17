"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Trash2 } from "lucide-react";
import { updateProfile } from "@/app/dashboard/actions";
import { fileToAvatar } from "@/lib/image";
import { useEditor } from "@/components/editor/editor-provider";

export function ProfilePanel() {
  const { profile, setProfile, track } = useEditor();
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const first = useRef(true);
  const latest = useRef(profile);
  latest.current = profile;

  // Autosave name and bio shortly after typing stops
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(async () => {
      const { name, bio } = latest.current;
      if (!name.trim()) return setError("Add a name");
      const res = await track(updateProfile({ name, bio }));
      setError(res.ok ? "" : res.error);
    }, 800);
    return () => clearTimeout(t);
  }, [profile.name, profile.bio, track]);

  const setAvatar = async (avatar: string | null) => {
    const res = await track(updateProfile({ name: latest.current.name || "Your name", bio: latest.current.bio, avatar }));
    if (!res.ok) return setError(res.error);
    setError("");
    setProfile((p) => ({ ...p, avatar }));
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setAvatar(await fileToAvatar(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't use that image");
    }
  };

  const photo = profile.avatar ?? profile.image;

  return (
    <section aria-label="Profile" className="rounded-3xl border border-line bg-surface p-5 shadow-card">
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-full bg-accent/15 text-2xl font-bold text-accent">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="Your profile photo" className="h-full w-full object-cover" />
            ) : (
              (profile.name[0] ?? "?").toUpperCase()
            )}
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            aria-label="Change profile photo"
            className="focus-ring absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full border-2 border-surface bg-fg text-bg hover:opacity-90"
          >
            <Camera className="h-4 w-4" />
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="sr-only" tabIndex={-1} aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <label htmlFor="display-name" className="label mb-1 block">
            Name
          </label>
          <input
            id="display-name"
            value={profile.name}
            onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
            maxLength={60}
            className="focus-ring h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-[15px] font-semibold"
          />
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between">
          <label htmlFor="bio" className="label">
            Bio
          </label>
          <span className="num text-[11px] text-faint">{profile.bio.length}/160</span>
        </div>
        <textarea
          id="bio"
          value={profile.bio}
          onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
          maxLength={160}
          rows={2}
          placeholder="A short line about you"
          className="focus-ring w-full resize-none rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[15px] placeholder:text-faint"
        />
      </div>

      {(error || profile.avatar) && (
        <div className="mt-3 flex items-center justify-between">
          <p role="alert" className="text-xs font-medium text-rose-600">
            {error}
          </p>
          {profile.avatar && (
            <button
              onClick={() => setAvatar(null)}
              className="focus-ring flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-muted hover:bg-surface-2 hover:text-rose-600"
            >
              <Trash2 className="h-3.5 w-3.5" /> Remove photo
            </button>
          )}
        </div>
      )}
    </section>
  );
}
