export function Logo({ size = 28 }: { size?: number }) {
  return <img src="/favicon.svg" width={size} height={size} alt="" aria-hidden="true" />;
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2.5 font-display text-xl font-extrabold tracking-[-0.03em] ${className}`}>
      <Logo size={30} />
      Salabloco
    </span>
  );
}
