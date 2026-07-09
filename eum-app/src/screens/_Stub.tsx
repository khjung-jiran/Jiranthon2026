import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScreenContainer } from '../components';
import { colors, fonts } from '../theme';

/**
 * 임시 stub. Foundation이 컴파일 일관성을 위해 각 화면 자리에 둔다.
 * 화면 에이전트가 해당 파일 전체를 실제 화면으로 교체한다.
 * (export 이름은 유지할 것 — RootNavigator/탭이 이 이름으로 import 함)
 */
export function Stub({ name }: { name: string }) {
  return (
    <ScreenContainer>
      <View style={styles.center}>
        <Text style={styles.title}>{name}</Text>
        <Text style={styles.sub}>준비 중 (stub) — 화면 에이전트가 구현 예정</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 30 },
  title: { fontFamily: fonts.extraBold, fontSize: 22, color: colors.text },
  sub: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, textAlign: 'center' },
});
