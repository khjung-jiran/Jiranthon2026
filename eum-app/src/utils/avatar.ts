/**
 * 발신자 아바타 배경색 계산 (renderVals: q.ai ? accent : (avPal[from] || olive)).
 * parent/HomeScreen·QuestionListScreen·QuestionDetailScreen에서 동일 로직이 3중 정의되어 있던 것을
 * Manager가 공용 유틸로 통합함(§3 중복 제거).
 */
import { colors } from '../theme';
import { avatarPalette } from '../data/mock';
import type { Question } from '../types';

export function avatarColorFor(q: Question): string {
  if (q.ai) return colors.accent;
  return avatarPalette[q.from] ?? colors.olive;
}
