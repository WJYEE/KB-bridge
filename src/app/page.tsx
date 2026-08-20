import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { StatTile } from "@/components/ui/StatTile";
import { formatArea, formatCount, formatManwon } from "@/lib/format";
import { calculateFinance } from "@/lib/finance/calc";
import {
  getBudgetAreaSpreadExample,
  getDataTrustStats,
  getNewnessPremiumExample,
} from "@/lib/insights/landing";

const STEPS = [
  { no: "01", title: "나의 예산과 선호 입력", desc: "예산, 희망 지역, 최소 면적, 신축 여부, 중요도를 직접 입력합니다." },
  { no: "02", title: "서울 실거래 데이터 분석", desc: "2024~2026년 서울 실거래 데이터에서 조건에 맞는 거래를 찾습니다." },
  { no: "03", title: "선택 가능한 조건 비교", desc: "지역·면적·신축·가격을 서로 바꿔보며 Trade-off를 확인합니다." },
  { no: "04", title: "나에게 맞는 주거·금융 전략", desc: "선택한 조건을 실제로 감당할 수 있는지 금융 시뮬레이션으로 확인합니다." },
];

export default function LandingPage() {
  const trust = getDataTrustStats();
  const areaSpread = getBudgetAreaSpreadExample(30000);
  const newnessPremium = getNewnessPremiumExample();

  // Card 3: 예시 가정에 기반한 금융 시뮬레이션 (실거래 데이터가 아닌 수식 계산 — 가정값 명시)
  const financeExample = calculateFinance({
    housePrice: 30000,
    equity: 8000,
    annualRatePercent: 4.5,
    years: 30,
  });

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-border bg-white">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-navy sm:text-5xl">
            첫 집, 어디를 살지보다
            <br />
            무엇을 선택할지부터.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-slate-600 sm:text-lg">
            서울 3개년 실거래 데이터를 기반으로 내 예산과 우선순위에 맞는 첫 주택 전략을 찾아보세요.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <LinkButton href="/assessment">내 첫 집 분석하기</LinkButton>
            <LinkButton href="#how-it-works" variant="secondary">
              어떻게 분석하나요?
            </LinkButton>
          </div>
        </div>
      </section>

      {/* 핵심 질문 카드 3종 */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-5 sm:grid-cols-3">
          <Card>
            <p className="text-sm font-semibold text-brand">같은 3억원이라도</p>
            <p className="mt-2 text-base font-medium text-navy">
              지역에 따라 확보 가능한 면적은 얼마나 다를까요?
            </p>
            {areaSpread ? (
              <p className="mt-4 text-sm text-slate-600">
                실거래 기준 {areaSpread.widest.district}는 중앙 {formatArea(areaSpread.widest.stats.medianAffordableArea)},{" "}
                {areaSpread.narrowest.district}는 중앙 {formatArea(areaSpread.narrowest.stats.medianAffordableArea)}
                입니다.
              </p>
            ) : (
              <p className="mt-4 text-sm text-slate-500">데이터 분석 중</p>
            )}
          </Card>
          <Card>
            <p className="text-sm font-semibold text-brand">신축을 포기하면</p>
            <p className="mt-2 text-base font-medium text-navy">
              얼마나 넓거나 저렴한 집을 선택할 수 있을까요?
            </p>
            {newnessPremium ? (
              <p className="mt-4 text-sm text-slate-600">
                아파트 기준 신축(5년 이하)은 구축(16~30년) 대비 ㎡당가격이 약{" "}
                {newnessPremium.premiumPct.toFixed(0)}% 높습니다.
              </p>
            ) : (
              <p className="mt-4 text-sm text-slate-500">데이터 분석 중</p>
            )}
          </Card>
          <Card>
            <p className="text-sm font-semibold text-brand">지금 구매한다면</p>
            <p className="mt-2 text-base font-medium text-navy">실제 금융부담은 어느 정도일까요?</p>
            <p className="mt-4 text-sm text-slate-600">
              예: 3억원 주택, 자기자본 8천만원, 금리 4.5%, 30년 원리금균등 기준 월 약{" "}
              {Math.round(financeExample.monthlyPayment)}만원
            </p>
          </Card>
        </div>
      </section>

      {/* 서비스 원리 4-step */}
      <section id="how-it-works" className="bg-white py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h2 className="text-center text-2xl font-bold text-navy">어떻게 분석하나요?</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-4">
            {STEPS.map((step) => (
              <div key={step.no} className="flex flex-col gap-2">
                <span className="text-sm font-bold text-brand">{step.no}</span>
                <span className="text-base font-semibold text-navy">{step.title}</span>
                <span className="text-sm text-slate-500">{step.desc}</span>
              </div>
            ))}
          </div>
          <p className="mx-auto mt-12 max-w-2xl text-center text-base font-medium text-navy">
            첫집ON은 청년의 선호를 추측하지 않습니다.
            <br />
            당신이 중요하게 생각하는 조건을 실거래 데이터로 검증합니다.
          </p>
        </div>
      </section>

      {/* Data Trust */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <Card className="bg-navy text-white">
          <p className="text-sm font-medium text-blue-200">
            {trust.years[0]}–{trust.years[trust.years.length - 1]} 서울 실거래 데이터
          </p>
          <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-3">
            <StatTile tone="inverted" value={formatCount(trust.transactionCount)} label="분석 거래" />
            <StatTile tone="inverted" value={`${trust.districtCount}`} label="서울 자치구" />
            <StatTile tone="inverted" value={`${trust.years.length}개년`} label="분석 기간" />
          </div>
          <p className="mt-6 text-xs leading-relaxed text-blue-200">
            취소 거래 및 주요 오류값 정제 · 가격·면적·건축연도·주택유형 기반 분석
          </p>
        </Card>
      </section>

      <section className="border-t border-border bg-white py-14">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <h2 className="text-xl font-bold text-navy">지금 내 조건으로 확인해보세요</h2>
          <p className="mt-2 text-sm text-slate-500">{formatManwon(30000)}으로 어디까지 가능할지, 3분이면 확인할 수 있습니다.</p>
          <div className="mt-6">
            <LinkButton href="/assessment">내 첫 집 분석하기</LinkButton>
          </div>
        </div>
      </section>
    </div>
  );
}
