/** 한글 음절의 마지막 글자에 받침이 있는지에 따라 "이"/"가" 조사를 고른다. */
export function subjectParticle(word: string): "이" | "가" {
  const lastChar = word.trimEnd().slice(-1);
  const code = lastChar.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return "가"; // 한글 음절이 아니면 기본값
  const hasBatchim = (code - 0xac00) % 28 !== 0;
  return hasBatchim ? "이" : "가";
}
