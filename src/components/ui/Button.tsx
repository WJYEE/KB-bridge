import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost";

const VARIANT_CLASS: Record<Variant, string> = {
  primary:
    "bg-brand text-white hover:bg-brand-dark focus-visible:outline-brand-dark disabled:bg-slate-300",
  secondary:
    // disabled 상태의 낮은 대비는 WCAG 대비 기준 예외 대상(비활성 컨트롤)이라 slate-400 유지
    "bg-white text-navy border border-border hover:bg-surface-alt focus-visible:outline-brand disabled:text-slate-400",
  ghost: "text-brand hover:bg-brand-light focus-visible:outline-brand disabled:text-slate-400",
};

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed";

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button className={cn(BASE, VARIANT_CLASS[variant], className)} {...props} />;
}

export function LinkButton({
  href,
  variant = "primary",
  className,
  children,
}: {
  href: string;
  variant?: Variant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={cn(BASE, VARIANT_CLASS[variant], className)}>
      {children}
    </Link>
  );
}
