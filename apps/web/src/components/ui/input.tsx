import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";
import { cn } from "./cn";

const control ="h-11 w-full rounded-[10px] border border-input bg-card px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary aria-[invalid=true]:border-destructive";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => <input ref={ref} className={cn(control, className)} {...props} />,
);

Input.displayName = "Input";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select ref={ref} className={cn(control, className)} {...props}>
      {children}
    </select>
  ),
);
Select.displayName = "Select";

export function Field({ label, htmlFor, error, className, children}: {label: string; htmlFor: string; error?: string; className?: string; children: ReactNode}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-2 block text-[13px] font-semibold">
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className="mt-1.5 text-[13px] text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
