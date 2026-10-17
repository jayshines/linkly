"use client";

import { motion, useReducedMotion } from "framer-motion";
import { alpha, FONT_VAR, readableOn, tint, type Theme } from "@/lib/theme";
import { BrandIcon, HoverArrow } from "@/components/public/brand-icon";

export type CardLink = { id: string; title: string; url?: string };

type Props = {
  name: string;
  username: string;
  bio: string;
  avatar: string | null; // uploaded (data URL)
  image: string | null; // GitHub picture, used when there is no upload
  theme: Theme;
  links: CardLink[];
  /** Where each button goes. Omit for a non-clickable preview. */
  href?: (id: string) => string;
  /** Smaller sizing, used inside the phone preview. */
  compact?: boolean;
  /** Fill the whole viewport height (the public page), so the background never ends early. */
  fullHeight?: boolean;
};

export function ProfileCard({ name, username, bio, avatar, image, theme, links, href, compact, fullHeight }: Props) {
  const reduce = useReducedMotion();
  const dark = theme.mode === "dark";
  const text = dark ? "#f5f5f4" : "#1c1917";
  const muted = dark ? "rgba(245,245,244,.62)" : "rgba(28,25,23,.6)";
  const photo = avatar ?? image;
  const initials = (name || username || "?")
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const background = dark
    ? `radial-gradient(900px 480px at 50% -8%, ${alpha(theme.accent, 0.28)}, transparent 70%), #0b0b0c`
    : `linear-gradient(180deg, ${tint(theme.accent, 0.22)} 0%, ${tint(theme.accent, 0.07)} 55%, #ffffff 100%)`;

  const buttonStyle = (): React.CSSProperties => {
    switch (theme.buttonStyle) {
      case "outline":
        return { border: `2px solid ${theme.accent}`, color: text, background: "transparent" };
      case "soft":
        return {
          border: `1px solid ${alpha(theme.accent, 0.25)}`,
          color: text,
          background: alpha(theme.accent, dark ? 0.2 : 0.14),
        };
      default:
        return {
          border: `2px solid ${theme.accent}`,
          color: readableOn(theme.accent),
          background: theme.accent,
        };
    }
  };

  const item = {
    hidden: { opacity: 0, y: reduce ? 0 : 14 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.2, 0.7, 0.2, 1] as const } },
  };

  return (
    <div
      className={"relative flex w-full flex-col items-center " + (fullHeight ? "min-h-screen" : "min-h-full")}
      style={{
        background,
        color: text,
        fontFamily: FONT_VAR[theme.font],
        padding: compact ? "36px 18px 22px" : "64px 20px 32px",
      }}
    >
      <motion.div
        className="flex w-full max-w-[440px] flex-1 flex-col items-center"
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: reduce ? 0 : 0.07 } } }}
      >
        <motion.div variants={item} className="flex flex-col items-center text-center">
          <div
            className="grid place-items-center overflow-hidden rounded-full font-bold"
            style={{
              width: compact ? 72 : 100,
              height: compact ? 72 : 100,
              fontSize: compact ? 22 : 30,
              background: photo ? undefined : alpha(theme.accent, 0.2),
              color: theme.accent,
              boxShadow: `0 0 0 3px ${dark ? "#0b0b0c" : "#fff"}, 0 0 0 5px ${theme.accent}`,
            }}
          >
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt={name} className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </div>

          <h1
            className="font-bold tracking-tight"
            style={{ marginTop: compact ? 12 : 18, fontSize: compact ? 18 : 24, lineHeight: 1.2 }}
          >
            {name || "Your name"}
          </h1>
          <p style={{ color: muted, fontSize: compact ? 11 : 13, marginTop: 2 }}>@{username || "username"}</p>
          {bio && (
            <p
              style={{ color: muted, fontSize: compact ? 12 : 15, marginTop: compact ? 8 : 12, lineHeight: 1.5, maxWidth: 360 }}
            >
              {bio}
            </p>
          )}
        </motion.div>

        <ul className="w-full" style={{ marginTop: compact ? 20 : 32, display: "grid", gap: compact ? 10 : 14 }}>
          {links.map((l) => {
            const inner = (
              <motion.span
                variants={item}
                whileHover={reduce || !href ? undefined : { y: -2 }}
                whileTap={reduce || !href ? undefined : { scale: 0.985 }}
                className="group/btn relative flex w-full items-center justify-center text-center font-semibold"
                style={{
                  ...buttonStyle(),
                  borderRadius: 999,
                  padding: compact ? "11px 38px" : "15px 54px",
                  fontSize: compact ? 12.5 : 15.5,
                  boxShadow: dark ? "none" : `0 8px 24px -14px ${alpha(theme.accent, 0.6)}`,
                }}
              >
                {/* Brand mark on the left, an arrow that slides in on hover on the right */}
                <span className="absolute flex items-center opacity-80" style={{ left: compact ? 12 : 18 }}>
                  <BrandIcon url={l.url} size={compact ? 14 : 18} />
                </span>
                <span className="truncate">{l.title}</span>
                <span
                  className="absolute flex -translate-x-1 items-center opacity-0 transition-all duration-200 group-hover/btn:translate-x-0 group-hover/btn:opacity-90"
                  style={{ right: compact ? 12 : 18 }}
                >
                  {href && <HoverArrow size={compact ? 13 : 17} />}
                </span>
              </motion.span>
            );
            return (
              <li key={l.id}>
                {href ? (
                  <a href={href(l.id)} rel="nofollow noopener" className="block outline-none focus-visible:ring-2 focus-visible:ring-offset-2" style={{ borderRadius: 999 }}>
                    {inner}
                  </a>
                ) : (
                  <div>{inner}</div>
                )}
              </li>
            );
          })}
          {links.length === 0 && (
            <li className="text-center" style={{ color: muted, fontSize: compact ? 12 : 14, padding: "20px 0" }}>
              No links yet.
            </li>
          )}
        </ul>

        <motion.p variants={item} className="mt-auto pt-10 text-center" style={{ fontSize: compact ? 10 : 12 }}>
          <a href="/" style={{ color: muted }} className="font-semibold hover:underline">
            Made with <span style={{ color: theme.accent }}>Linkly</span>
          </a>
        </motion.p>
      </motion.div>
    </div>
  );
}
