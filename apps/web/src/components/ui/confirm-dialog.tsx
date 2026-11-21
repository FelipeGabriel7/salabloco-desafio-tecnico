import { useEffect, useRef, type ReactNode } from "react";
import { Button } from "./button";

/** Diálogo de confirmação sobre o <dialog> nativo: foco preso, Esc fecha, fundo bloqueado. */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  cancelLabel,
  busy,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="confirm-title"
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onCancel();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-[14px] border bg-card p-0 text-foreground backdrop:bg-black/60"
    >
      <div className="grid gap-3 p-6">
        <h2 id="confirm-title" className="text-xl font-extrabold">
          {title}
        </h2>
        <div className="grid gap-3 text-sm text-muted-foreground">{children}</div>
        <div className="mt-2 flex flex-wrap justify-end gap-2">
          <Button variant="outline" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={busy}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
