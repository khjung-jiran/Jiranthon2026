import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { colors } from '../theme';
import { useStore } from '../store/useStore';
import { fontZoomMap } from '../data/mock';

export interface ScreenContainerProps {
  children: React.ReactNode;
  /** 배경색 (기본: bgScreen #FAF3EA) */
  backgroundColor?: string;
  /** SafeArea 적용 가장자리. 탭 화면은 ['top'] 권장(하단은 탭바가 처리). 기본 ['top','bottom'] */
  edges?: Edge[];
  /** true면 내용을 ScrollView로 감쌈 */
  scroll?: boolean;
  /** 바깥 컨테이너 스타일 */
  style?: StyleProp<ViewStyle>;
  /** scroll일 때 contentContainerStyle */
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** scroll일 때 고정 헤더 인덱스 (ScrollView.stickyHeaderIndices) */
  stickyHeaderIndices?: number[];
}

/**
 * 화면 최상위 래퍼. 원본의 가짜 상태바(9:41)는 렌더하지 않고 SafeAreaView로 처리.
 * 원본 프레임 chrome(둥근 폰 프레임)도 렌더하지 않는다.
 *
 * 접근성(부모 모드 글씨 크기): 원본 `zoom: {{ pZoom }}`(이음.dc.html 45행) 재현.
 * role==='parent'일 때 settings.fontSize → fontZoomMap 배율(1/1.12/1.25)로
 * 콘텐츠를 역크기(100/zoom%) + transform scale 하여 CSS zoom처럼 리플로우 확대한다.
 * (원본과 동일하게 탭바/오버레이는 확대 대상에서 제외 — 콘텐츠 영역만 적용)
 */
export function ScreenContainer({
  children,
  backgroundColor = colors.bgScreen,
  edges = ['top', 'bottom'],
  scroll = false,
  style,
  contentContainerStyle,
  stickyHeaderIndices,
}: ScreenContainerProps) {
  const zoom = useStore((s) =>
    s.role === 'parent' ? fontZoomMap[s.settings.fontSize] ?? 1 : 1,
  );

  const content = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={contentContainerStyle}
      stickyHeaderIndices={stickyHeaderIndices}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    children
  );

  return (
    <SafeAreaView edges={edges} style={[styles.root, { backgroundColor }, style]}>
      {zoom === 1 ? (
        content
      ) : (
        <View style={styles.zoomClip}>
          <View
            style={{
              width: `${(100 / zoom).toFixed(3)}%` as `${number}%`,
              height: `${(100 / zoom).toFixed(3)}%` as `${number}%`,
              transform: [{ scale: zoom }],
              transformOrigin: 'top left',
            }}
          >
            {content}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  zoomClip: { flex: 1, overflow: 'hidden' },
});
