import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer, Icon } from '../../components';
import { colors, fonts, radius } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ComingSoon'>;

const SOON_ICON: Record<string, string> = {
  캘린더: 'calendar_month',
  앨범: 'photo_library',
  설정: 'settings',
};

/** 준비중 placeholder (sSoon, 802~808) */
export function ComingSoonScreen({ route }: Props) {
  const label = route.params?.label ?? '';
  const icon = SOON_ICON[label] ?? 'construction';

  return (
    <ScreenContainer edges={['top']} style={s.root}>
      <View style={s.iconBox}>
        <Icon name={icon} size={44} color={colors.textFaint3} />
      </View>
      <Text style={s.title}>{label} 준비 중</Text>
      <Text style={s.sub}>
        MVP에서는 보이스 기능에 집중하고 있어요.{'\n'}
        {label}은 다음 단계에서 만나요.
      </Text>
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  root: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 18 },
  iconBox: { width: 88, height: 88, borderRadius: radius.modal, backgroundColor: colors.surfaceSoft, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.extraBold, fontSize: 22, color: colors.text },
  sub: { fontFamily: fonts.regular, fontSize: 16, color: colors.textMuted, lineHeight: 26, textAlign: 'center' },
});

export default ComingSoonScreen;
