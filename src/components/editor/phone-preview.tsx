"use client";

import { ProfileCard } from "@/components/public/profile-card";
import { useEditor } from "@/components/editor/editor-provider";

/** Live preview: re-renders instantly as the user edits anything. */
export function PhonePreview() {
  const { profile, theme, links } = useEditor();

  return (
    <div className="mx-auto w-[300px]" aria-label="Live preview of your page">
      <div className="relative rounded-[44px] border-[9px] border-fg bg-fg shadow-pop">
        {/* Notch */}
        <div className="absolute left-1/2 top-2 z-10 h-5 w-20 -translate-x-1/2 rounded-full bg-fg" aria-hidden="true" />
        <div className="h-[600px] overflow-y-auto overflow-x-hidden rounded-[34px] bg-white [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <ProfileCard
            {...profile}
            theme={theme}
            links={links.filter((l) => l.enabled)}
            compact
          />
        </div>
      </div>
      <p className="mt-4 text-center text-xs text-faint">Live preview</p>
    </div>
  );
}
