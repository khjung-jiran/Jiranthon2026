import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from './types';

/** 화면 밖(스토어 호스트/푸시 배너 등)에서 네비게이션을 호출하기 위한 ref */
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigate<Name extends keyof RootStackParamList>(
  name: Name,
  params?: RootStackParamList[Name]
) {
  if (navigationRef.isReady()) {
    // @ts-expect-error params 타입은 라우트별로 상이 — 런타임 안전
    navigationRef.navigate(name, params);
  }
}
