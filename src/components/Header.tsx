"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const NAV = [
  { href: "/assessment", label: "내 집 분석" },
  { href: "/result", label: "지역 비교" },
  { href: "/tradeoff", label: "Trade-off" },
  { href: "/finance", label: "금융 시뮬레이션" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-1.5 text-lg font-bold text-brand">
          <span>내집내산</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="주요 메뉴">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                  active ? "bg-brand-light text-brand-dark" : "text-slate-600 hover:bg-surface-alt",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/assessment"
          className="rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-navy-light"
        >
          내 첫 집 분석하기
        </Link>
      </div>
    </header>
  );
}
