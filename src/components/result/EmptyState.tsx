import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { UserPreferences } from "@/lib/recommendation/types";

interface RelaxAction {
  label: string;
  apply: (prefs: UserPreferences) => UserPreferences;
}

function buildActions(prefs: UserPreferences): RelaxAction[] {
  const actions: RelaxAction[] = [];

  actions.push({
    label: "예산 20% 늘리기",
    apply: (p) => ({ ...p, budget: Math.round((p.budget * 1.2) / 500) * 500 }),
  });

  if (prefs.minArea !== undefined) {
    actions.push({ label: "최소면적 조건 해제", apply: (p) => ({ ...p, minArea: undefined }) });
  }
  if (prefs.maxBuildingAge !== undefined) {
    actions.push({ label: "연식조건 완화", apply: (p) => ({ ...p, maxBuildingAge: undefined }) });
  }
  if (prefs.preferredDistricts && prefs.preferredDistricts.length > 0) {
    actions.push({ label: "지역조건 해제 (서울 전체)", apply: (p) => ({ ...p, preferredDistricts: [] }) });
  }
  if (prefs.preferredBuildingTypes && prefs.preferredBuildingTypes.length > 0) {
    actions.push({ label: "주택유형 조건 해제", apply: (p) => ({ ...p, preferredBuildingTypes: [] }) });
  }

  return actions;
}

export function EmptyState({
  prefs,
  onRelax,
}: {
  prefs: UserPreferences;
  onRelax: (next: UserPreferences) => void;
}) {
  const actions = buildActions(prefs);

  return (
    <Card className="mt-8 text-center">
      <p className="text-base font-semibold text-navy">
        현재 조건과 일치하는 충분한 실거래 데이터가 없습니다.
      </p>
      <p className="mt-2 text-sm text-slate-500">
        아래 조건을 완화하면 실제 데이터로 다시 계산해 바로 보여드립니다.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {actions.map((action) => (
          <Button key={action.label} variant="secondary" onClick={() => onRelax(action.apply(prefs))}>
            {action.label}
          </Button>
        ))}
      </div>
    </Card>
  );
}
