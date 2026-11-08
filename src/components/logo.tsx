import Link from "next/link";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="CareWell Hospital home">
      <svg width="38" height="38" viewBox="0 0 40 40" aria-hidden="true">
        <rect x="2" y="14" width="14" height="12" rx="2.5" fill="#1657e5" />
        <rect x="14" y="2" width="12" height="36" rx="2.5" fill="#1657e5" />
        <rect x="24" y="14" width="14" height="12" rx="2.5" fill="#1657e5" />
        <rect x="14" y="2" width="12" height="36" rx="2.5" fill="#1657e5" />
        <rect x="14" y="14" width="12" height="12" fill="#1657e5" />
      </svg>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="text-[20px] font-extrabold tracking-[-0.04em] text-[#123b85]">CareWell</span>
          <span className="mt-[3px] text-[9px] font-extrabold tracking-[0.33em] text-[#1657e5]">HOSPITAL</span>
        </span>
      )}
    </Link>
  );
}
