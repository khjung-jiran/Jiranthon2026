import React from 'react';
import { View, Pressable, Modal, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { colors, radius } from '../theme';

export interface OverlayProps {
  visible: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  /** 스크림 배경색 (기본 rgba(38,29,20,.55)) */
  scrim?: string;
  /** 백드롭 탭으로 닫기 (기본 true) */
  dismissOnBackdrop?: boolean;
  /** 카드 컨테이너 스타일 override */
  cardStyle?: StyleProp<ViewStyle>;
  /** 바깥 패딩 (기본 32) */
  padding?: number;
}

/**
 * 중앙 모달 오버레이 (원본 revealCap 라인 842~/ sentQuestion 라인 862~).
 * 스크림 + 중앙 흰 카드(radius26, padding 30/26). 내용은 children으로 주입.
 * 화면은 카드 안의 내용만 구성하면 된다.
 */
export function Overlay({
  visible,
  onClose,
  children,
  scrim = colors.scrim,
  dismissOnBackdrop = true,
  cardStyle,
  padding = 32,
}: OverlayProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable
        style={[styles.scrim, { backgroundColor: scrim, padding }]}
        onPress={dismissOnBackdrop ? onClose : undefined}
      >
        <Pressable style={[styles.card, cardStyle]} onPress={() => {}}>
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.modal,
    paddingVertical: 30,
    paddingHorizontal: 26,
  },
});
