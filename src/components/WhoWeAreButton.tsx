"use client";

/**
 * WhoWeAreButton — homepage hero pill that opens a 9:16 vertical video modal.
 * Replaces the previous "See the dashboard" link.
 *
 * The modal pops up like the SkillConciergeModal — overlay, backdrop click +
 * ESC close, body scroll locked, video autoplays muted (autoplay policy) and
 * users can unmute with native controls.
 */

import { useEffect, useRef, useState } from "react";

const VIDEO_SRC = "/videos/who-we-are.mp4";

export default function WhoWeAreButton() {
  const [open, setOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // ESC closes; lock body scroll while open; reset video to start on close.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  // When closing, pause + rewind so reopening starts fresh.
  useEffect(() => {
    if (open) return;
    const v = videoRef.current;
    if (v) {
      try {
        v.pause();
        v.currentTime = 0;
      } catch {
        /* ignore */
      }
    }
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-[15px] text-[var(--fg)] border border-white/25 hover:bg-white/5 hover:border-[#16C7FF]/50 transition-colors"
        aria-haspopup="dialog"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M3 2 L11 7 L3 12 Z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinejoin="round"
          />
        </svg>
        Watch our story
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Watch our story video"
        >
          <div
            className="relative w-full max-w-[420px] sm:max-w-[440px] rounded-2xl border border-[#1E3556] overflow-hidden flex flex-col"
            style={{
              background: "linear-gradient(180deg, #0F1C32 0%, #000000 100%)",
              // Cap modal at viewport minus 2rem of breathing room so the
              // top header is never clipped on shorter laptop screens.
              maxHeight: "calc(100dvh - 2rem)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top accent stripe */}
            <div
              aria-hidden="true"
              className="absolute left-0 right-0 top-0 h-[3px] z-10"
              style={{
                background:
                  "linear-gradient(90deg, #16C7FF 0%, #16C7FF 50%, #5EE5FF 100%)",
              }}
            />

            {/* Header bar with close */}
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-[#1E3556] shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#16C7FF]">
                  X3 Fleet Safety
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/45">
                  · Who we are
                </span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-white/55 hover:text-white text-[20px] leading-none"
                aria-label="Close video"
              >
                ✕
              </button>
            </div>

            {/* Video container — flex-1 takes remaining height,
                video uses object-contain so the 9:16 video fits inside
                whatever space is available without overflowing the modal. */}
            <div className="flex-1 min-h-0 bg-black w-full grid place-items-center">
              <video
                ref={videoRef}
                src={VIDEO_SRC}
                className="w-full h-full object-contain"
                controls
                autoPlay
                playsInline
                preload="metadata"
              >
                Sorry, your browser doesn&apos;t support embedded videos.{" "}
                <a href={VIDEO_SRC} className="text-[#16C7FF] underline">
                  Download the video
                </a>{" "}
                instead.
              </video>
            </div>

            {/* Footer with ESC hint */}
            <div className="px-4 py-3 text-center text-[11px] text-white/45 border-t border-[#1E3556] shrink-0">
              Press{" "}
              <kbd className="px-1.5 py-0.5 rounded bg-[#1E3556] text-white/70 font-mono text-[10px]">
                Esc
              </kbd>{" "}
              or click outside to close
            </div>
          </div>
        </div>
      )}
    </>
  );
}
