/**
 * mm:ss 포맷 (원본 fmt). RespondScreen(parent)·CapsuleNewScreen(family)에 동일 함수가
 * 중복 정의되어 있던 것을 Manager가 공용 유틸로 통합함(§3 중복 제거).
 */
export function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const ss = String(totalSeconds % 60).padStart(2, '0');
  return `${m}:${ss}`;
}
