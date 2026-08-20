/** 만원 단위 금액을 "3억 5,000만원" 같은 사람이 읽기 쉬운 형태로 변환 */
export function formatManwon(manwon: number): string {
  if (!Number.isFinite(manwon)) return "-";
  const sign = manwon < 0 ? "-" : "";
  const abs = Math.abs(Math.round(manwon));
  const eok = Math.floor(abs / 10000);
  const rest = abs % 10000;
  if (eok === 0) return `${sign}${rest.toLocaleString("ko-KR")}만원`;
  if (rest === 0) return `${sign}${eok}억원`;
  return `${sign}${eok}억 ${rest.toLocaleString("ko-KR")}만원`;
}

export function formatArea(areaSqm: number): string {
  if (!Number.isFinite(areaSqm)) return "-";
  return `${areaSqm.toFixed(1)}㎡`;
}

export function formatPyeong(areaSqm: number): string {
  if (!Number.isFinite(areaSqm)) return "-";
  return `${(areaSqm / 3.3058).toFixed(1)}평`;
}

export function formatPercent(ratio: number, digits = 0): string {
  if (!Number.isFinite(ratio)) return "-";
  return `${(ratio * 100).toFixed(digits)}%`;
}

export function formatCount(n: number): string {
  if (!Number.isFinite(n)) return "-";
  return n.toLocaleString("ko-KR");
}

export function formatYear(n: number | null): string {
  if (n === null || !Number.isFinite(n)) return "정보 없음";
  return `${Math.round(n)}년`;
}

export function formatPricePerArea(manwonPerSqm: number): string {
  if (!Number.isFinite(manwonPerSqm)) return "-";
  return `${manwonPerSqm.toLocaleString("ko-KR")}만원/㎡`;
}

/** Trade-off 등에서 변화량을 부호와 함께 중립적으로 표기한다 (좋고 나쁨 판단 없음) */
function withSign(formatted: string, value: number): string {
  if (value === 0) return formatted;
  return value > 0 ? `+${formatted}` : `-${formatted}`;
}

export function formatSignedCount(n: number, unit = "건"): string {
  if (!Number.isFinite(n)) return "-";
  return withSign(`${Math.abs(n).toLocaleString("ko-KR")}${unit}`, n);
}

export function formatSignedArea(n: number): string {
  if (!Number.isFinite(n)) return "-";
  return withSign(`${Math.abs(n).toFixed(1)}㎡`, n);
}

export function formatSignedManwon(n: number): string {
  if (!Number.isFinite(n)) return "-";
  return withSign(formatManwon(Math.abs(n)), n);
}

export function formatSignedYear(n: number): string {
  if (!Number.isFinite(n)) return "-";
  return withSign(`${Math.abs(Math.round(n))}년`, n);
}
