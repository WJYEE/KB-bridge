import type { PersonaLabel } from "@/lib/recommendation/persona-label";

export function ProfileHeader({ persona }: { persona: PersonaLabel }) {
  return (
    <div className="text-center">
      <h1 className="text-2xl font-bold text-navy sm:text-3xl">
        당신은 <span className="text-brand">&lsquo;{persona.label}&rsquo;</span>에 가까워요
      </h1>
      <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">{persona.description}</p>
    </div>
  );
}
