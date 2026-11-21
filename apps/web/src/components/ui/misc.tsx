import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/utils/cn";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-lg bg-border", className)} {...props} />;
}

export function Badge({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap text-accent-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-[14px] border bg-card", className)} {...props} />;
}

type Option<T extends string> = { value: T; label: ReactNode; ariaLabel?: string };

/** Controle segmentado: usado para abas, tema e estado da demo. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className,
}: {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <div role="group" aria-label={ariaLabel} className={cn("inline-flex gap-0.5 rounded-[10px] border bg-background p-0.5", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          aria-label={o.ariaLabel}
          onClick={() => onChange(o.value)}
          className={cn(
            "inline-flex min-h-8 min-w-8 items-center justify-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary",
            value === o.value ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
