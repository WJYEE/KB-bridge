import type { BuildingType } from "@/lib/realestate/types";
import type { FloorPreference, ScoreWeights, UserPreferences } from "@/lib/recommendation/types";

export interface AssessmentFormState {
  budget: number; // 만원
  cash: number; // 만원
  preferredDistricts: string[];
  minArea: number | undefined; // ㎡, undefined = 상관없음
  maxBuildingAge: number | undefined; // 년, undefined = 상관없음
  preferredBuildingTypes: BuildingType[];
  floorPreference: FloorPreference;
  weights: Partial<ScoreWeights>;
  presetId?: string;
}

export const DEFAULT_FORM_STATE: AssessmentFormState = {
  budget: 30000,
  cash: 8000,
  preferredDistricts: [],
  minArea: undefined,
  maxBuildingAge: undefined,
  preferredBuildingTypes: [],
  floorPreference: "무관",
  weights: {},
};

export function toUserPreferences(state: AssessmentFormState): UserPreferences {
  return {
    budget: state.budget,
    cash: state.cash,
    minArea: state.minArea,
    maxBuildingAge: state.maxBuildingAge,
    preferredDistricts: state.preferredDistricts,
    preferredBuildingTypes: state.preferredBuildingTypes,
    floorPreference: state.floorPreference,
    weights: state.weights,
  };
}

export const BUDGET_PRESETS = [
  { label: "1.5억", value: 15000 },
  { label: "2억", value: 20000 },
  { label: "2.5억", value: 25000 },
  { label: "3억", value: 30000 },
  { label: "4억", value: 40000 },
  { label: "5억+", value: 50000 },
];

export const MIN_AREA_PRESETS = [
  { label: "20㎡", value: 20 },
  { label: "25㎡", value: 25 },
  { label: "30㎡", value: 30 },
  { label: "40㎡", value: 40 },
  { label: "상관없음", value: undefined },
];

export const MAX_AGE_PRESETS = [
  { label: "5년 이하", value: 5 },
  { label: "10년 이하", value: 10 },
  { label: "15년 이하", value: 15 },
  { label: "20년 이하", value: 20 },
  { label: "상관없음", value: undefined },
];

export const FLOOR_PREFERENCE_OPTIONS: FloorPreference[] = ["저층", "중층", "고층", "무관"];
