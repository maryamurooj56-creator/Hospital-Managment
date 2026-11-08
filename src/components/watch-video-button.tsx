"use client";

import { Play, X } from "lucide-react";
import { useEffect, useState } from "react";

const VIDEO_URL =
  "https://videos.pexels.com/video-files/34261641/14516997_1920_1080_30fps.mp4";

export function WatchVideoButton() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    if (open) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="group inline-flex items-center gap-3 font-bold text-[var(--navy)]">
        <span className="grid h-11 w-11 place-items-center rounded-full border border-[#cfddf4] bg-white text-[var(--brand)] shadow-sm transition group-hover:scale-105">
          <Play size={16} fill="currentColor" />
        </span>
        Watch Video
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-[#071936]/80 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="CareWell Hospital video tour"
        >
          <div className="w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
              <div>
                <h3 className="text-sm font-extrabold text-[var(--navy)]">A look inside CareWell</h3>
                <p className="text-xs text-slate-500">Modern facilities, designed around your care.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-full hover:bg-slate-100" aria-label="Close video">
                <X size={18} />
              </button>
            </div>
            <video controls autoPlay playsInline className="aspect-video w-full bg-black" src={VIDEO_URL} />
          </div>
        </div>
      )}
    </>
  );
}
