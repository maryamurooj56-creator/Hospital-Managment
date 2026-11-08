"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[CareWell] Unhandled UI error", error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center bg-[#f4f7fc] px-5">
      <div className="cw-card max-w-lg p-8 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-red-50 text-red-500"><AlertCircle size={28} /></span>
        <h1 className="mt-5 text-2xl font-extrabold text-[var(--navy)]">Something went wrong</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">We logged the issue. Please try again or return to the CareWell homepage.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={reset} className="cw-btn"><RefreshCw size={16} /> Try again</button>
          <Link href="/" className="cw-btn-outline">Go home</Link>
        </div>
      </div>
    </main>
  );
}
