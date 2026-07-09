import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ScreenContainer, VoiceBars, Icon } from '../../components';
import { colors, fonts } from '../../theme';
import { useStore } from '../../store/useStore';
import type { Role } from '../../types';

/**
 * 로그인 / 역할선택 (sLogin) — 원본 이음.dc.html 라인 47~76.
 * 로고 파형 + 타이틀 "이음" + 부모/자녀 선택 버튼 + 가족 초대 코드 안내.
 * 역할 진입은 store.login(role) → RootNavigator가 자동으로 탭으로 분기.
 */
export function LoginScreen() {
  const login = useStore((s) => s.login);

  const start = (role: Role) => login(role);

  return (
    <ScreenContainer>
      <View style={styles.root}>
        {/* 상단 로고/타이틀 (flex:1 center) */}
        <View style={styles.hero}>
          <VoiceBars style={styles.logo} />
          <Text style={styles.title}>이음</Text>
          <Text style={styles.subtitle}>
            목소리로 잇는 우리 가족 이야기{'\n'}AI가 부모님의 기억을 이야기로 모아드려요
          </Text>
        </View>

        {/* 하단 역할 선택 */}
        <View style={styles.bottom}>
          <Text style={styles.prompt}>어떻게 시작할까요?</Text>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => start('parent')}
            style={styles.roleBtn}
          >
            <View style={[styles.roleIcon, { backgroundColor: colors.accentSoft }]}>
              <Icon name="elderly" size={30} color={colors.accent} />
            </View>
            <View style={styles.roleText}>
              <Text style={styles.roleTitle}>부모님으로 시작</Text>
              <Text style={styles.roleSub}>받은 질문에 목소리로 답해요</Text>
            </View>
            <Icon name="chevron_right" size={24} color={colors.textFaint3} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => start('child')}
            style={styles.roleBtn}
          >
            <View style={[styles.roleIcon, { backgroundColor: colors.neutral }]}>
              <Icon name="family_restroom" size={30} color={colors.blue} />
            </View>
            <View style={styles.roleText}>
              <Text style={styles.roleTitle}>자녀로 시작</Text>
              <Text style={styles.roleSub}>질문을 보내고 이야기를 모아요</Text>
            </View>
            <Icon name="chevron_right" size={24} color={colors.textFaint3} />
          </TouchableOpacity>

          <Text style={styles.footer}>가족 초대 코드로 함께 시작할 수 있어요</Text>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'column', paddingHorizontal: 30 },
  hero: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logo: { marginBottom: 30 },
  title: { fontFamily: fonts.extraBold, fontSize: 38, letterSpacing: -1.5, color: colors.text },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.textMuted2,
    marginTop: 14,
    lineHeight: 26,
    textAlign: 'center',
  },
  bottom: { flexDirection: 'column', gap: 14, paddingBottom: 38 },
  prompt: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.textFaint2,
    letterSpacing: 0.4,
    paddingLeft: 4,
  },
  roleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    padding: 19,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border2,
    backgroundColor: colors.surface,
  },
  roleIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleText: { flex: 1 },
  roleTitle: { fontFamily: fonts.bold, fontSize: 19, color: colors.text },
  roleSub: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, marginTop: 3 },
  footer: {
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textFaint,
    marginTop: 8,
  },
});

export default LoginScreen;
