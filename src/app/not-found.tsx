import { Compass } from "lucide-react";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function NotFound() {
  return (
    <main>
      <SiteHeader />
      <div className="cw-container grid min-h-[55vh] place-items-center py-16 text-center">
        <div>
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-blue-50 text-[var(--brand)]"><Compass size={30} /></span>
          <span className="eyebrow mt-6 block">404 · Page not found</span>
          <h1 className="mt-2 text-3xl font-extrabold text-[var(--navy)]">We couldn&apos;t find that page</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">The link may be outdated, or the page may have moved. Let&apos;s get you back to care.</p>
          <Link href="/" className="cw-btn mt-6">Return to homepage</Link>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
