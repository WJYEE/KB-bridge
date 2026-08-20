"use client";

import { useState } from "react";
import { WeightSlider } from "./WeightSlider";
import type { AssessmentFormState } from "./state";
import { normalizeWeights } from "@/lib/recommendation/normalize";
import { PERSONA_PRESETS } from "@/lib/recommendation/presets";
import type { ScoreKey } from "@/lib/recommendation/types";

const PRESET_EMOJI: Record<string, string> = {
  "price-first": "💰",
  "space-first": "🏠",
  "newness-first": "✨",
  "district-first": "📍",
  balanced: "⚖️",
};

const PRIMARY: { key: ScoreKey; label: string }[] = [
  { key: "price", label: "가격" },
  { key: "space", label: "공간" },
  { key: "newness", label: "신축" },
  { key: "stability", label: "시장 안정성" },
];

const DETAIL: { key: ScoreKey; label: string }[] = [
  { key: "district", label: "지역" },
  { key: "buildingType", label: "주택유형" },
  { key: "floor", label: "층" },
  { key: "liquidity", label: "거래 활성도" },
];

export function WeightsStep({
  value,
  onChange,
}: {
  value: AssessmentFormState;
  onChange: (patch: Partial<AssessmentFormState>) => void;
}) {
  const [detailOpen, setDetailOpen] = useState(false);
  const normalized = normalizeWeights(value.weights);

  function setWeight(key: ScoreKey, v: number) {
    onChange({ weights: { ...value.weights, [key]: v }, presetId: undefined });
  }

  function applyPreset(id: string) {
    const preset = PERSONA_PRESETS.find((p) => p.id === id);
    if (!preset) return;
    onChange({ weights: preset.weights, presetId: id });
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-xl font-bold text-navy">무엇이 가장 중요한가요?</h2>
        <p className="mt-1 text-sm text-slate-500">
          중요도를 조정하면 추천 결과가 바뀝니다. 합계는 자동으로 조정되니 편하게 움직여보세요.
        </p>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-navy">빠른 선택</p>
        <div className="flex flex-wrap gap-2">
          {PERSONA_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset.id)}
              className={`rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                value.presetId === preset.id
                  ? "border-brand bg-brand-light text-brand-dark"
                  : "border-border bg-white text-slate-600 hover:bg-surface-alt"
              }`}
            >
              <span className="mr-1.5">{PRESET_EMOJI[preset.id]}</span>
              <span className="font-semibold">{preset.label}</span>
              <p className="mt-0.5 text-xs opacity-80">{preset.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-5">
        {PRIMARY.map(({ key, label }) => (
          <WeightSlider
            key={key}
            label={label}
            value={value.weights[key] ?? 0}
            sharePercent={Math.round(normalized[key] * 100)}
            onChange={(v) => setWeight(key, v)}
          />
        ))}
      </div>

      <div>
        <button
          type="button"
          onClick={() => setDetailOpen((v) => !v)}
          className="text-sm font-semibold text-brand hover:underline"
          aria-expanded={detailOpen}
        >
          {detailOpen ? "상세 설정 접기 ▲" : "상세 설정 펼치기 (지역·주택유형·층·거래활성도) ▼"}
        </button>
        {detailOpen && (
          <div className="mt-4 flex flex-col gap-5 border-t border-border pt-4">
            {DETAIL.map(({ key, label }) => (
              <WeightSlider
                key={key}
                label={label}
                value={value.weights[key] ?? 0}
                sharePercent={Math.round(normalized[key] * 100)}
                onChange={(v) => setWeight(key, v)}
              />
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-slate-500">총합은 자동으로 조정됩니다.</p>
    </div>
  );
}
