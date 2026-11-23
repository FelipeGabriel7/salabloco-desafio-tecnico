import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { CircleCheck } from "lucide-react";

const ToastContext = createContext<(message: string) => void>(() => undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const show = useCallback((text: string) => {
    window.clearTimeout(timer.current);
    setToast({ id: Date.now(), text });
    timer.current = window.setTimeout(() => setToast(null), 3600);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-20 z-50 flex justify-end md:right-6 md:bottom-6 md:left-auto"
      >
        {toast ? (
          <div
            key={toast.id}
            className="pointer-events-auto flex max-w-sm items-center gap-2.5 rounded-xl border bg-card px-4 py-3 text-sm shadow-lg"
          >
            <CircleCheck className="size-4 shrink-0 text-success" aria-hidden="true" />
            {toast.text}
          </div>
        ) : null}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
