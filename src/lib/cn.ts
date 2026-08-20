import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * clsx로 조건부 클래스를 조합한 뒤 tailwind-merge로 충돌하는 유틸리티 클래스를
 * 정리한다. Tailwind는 클래스 문자열의 DOM 순서가 아니라 내부 스타일시트 생성
 * 순서로 우선순위가 정해지므로, `clsx("bg-white", override)`처럼 base와 override를
 * 단순 연결만 하면 override가 항상 이기지 않는다 (실제로 Card의 bg-white가
 * 페이지에서 넘긴 bg-navy를 가려버리는 버그가 있었다). twMerge는 같은 속성의
 * 클래스가 여러 개 있으면 뒤에 오는 것만 남기므로 이 문제를 근본적으로 해결한다.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
