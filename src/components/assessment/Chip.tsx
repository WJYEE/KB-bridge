import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes } from "react";

export function Chip({
  selected,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { selected: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
        selected
          ? "border-brand bg-brand-light text-brand-dark"
          : "border-border bg-white text-slate-600 hover:bg-surface-alt",
        className,
      )}
      {...props}
    />
  );
}
