import type { ReactNode } from "react";
import { CircleAlert } from "lucide-react";
import { cn } from "./cn";

export function Alert({variant = "default", title, children, action, className}: { variant?: "default" | "destructive"; title: string; children?: ReactNode; action?: ReactNode; className?: string}) {
  return (
    <div
      role={variant === "destructive" ? "alert" : "status"}
      className={cn(
        "rounded-xl border px-4 py-3.5",
        variant === "destructive"
          ? "border-destructive-border bg-destructive-soft text-destructive"
          : "bg-card text-foreground",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <CircleAlert className="mt-0.5 size-[18px] shrink-0" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{title}</p>
          {children ? <div className="mt-0.5 text-[13px]">{children}</div> : null}
        </div>
        {action}
      </div>
    </div>
  );
}
