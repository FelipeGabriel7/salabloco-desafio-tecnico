export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="9" className="fill-primary" />
      <rect x="7" y="9" width="13" height="5" rx="2.5" className="fill-primary-foreground" />
      <rect x="12" y="18" width="13" height="5" rx="2.5" className="fill-primary-foreground" fillOpacity={0.7} />
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2.5 font-display text-xl font-extrabold tracking-[-0.03em] ${className}`}>
      <Logo size={30} />
      Salabloco
    </span>
  );
}
