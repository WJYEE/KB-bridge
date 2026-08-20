export function Disclaimer({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-amber-200 bg-warn-bg px-4 py-3 text-xs leading-relaxed text-amber-900">
      {children}
    </div>
  );
}
