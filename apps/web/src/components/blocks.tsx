import type { ReactNode } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/services/types";
export function PageHeader({title, description, action}: {title: string; description?: string; action?: ReactNode}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="grid gap-1">
        <h1 className="text-[26px] font-extrabold md:text-[28px]">{title}</h1>
        {description ? <p className="text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({icon, title, description, action}: {icon: ReactNode; title: string; description: string; action?: ReactNode}) {
  return (
    <div className="grid justify-items-center gap-2 rounded-[14px] border border-dashed px-4 py-16 text-center">
      <div className="mb-1 grid size-12 place-items-center rounded-full bg-muted text-muted-foreground [&_svg]:size-5">
        {icon}
      </div>
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}

export function ErrorAlert({ error, onRetry }: { error: unknown; onRetry: () => void }) {

  const title = error instanceof ApiError ? `Erro ${error.status} (${error.code})` : "Erro inesperado";
  const message = error instanceof Error ? error.message : "Erro inesperado.";

  return (
    <Alert
      variant="destructive"
      title={title}
      action={
        <Button variant="outline" size="sm" onClick={onRetry} className="shrink-0 text-foreground">
          Tentar novamente
        </Button>
      }
    >
      {message}
    </Alert>
  );
}
