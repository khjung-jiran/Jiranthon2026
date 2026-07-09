import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Platform } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer, Icon } from '../../components';
import { colors, fonts, radius, shadow } from '../../theme';
import { useStore } from '../../store/useStore';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Booklet'>;

/** 소책자 미리보기 (sBooklet, 696~724) */
export function BookletScreen({ navigation }: Props) {
  const showToast = useStore((s) => s.showToast);
  const orderBooklet = () => showToast('인쇄 주문이 접수되었어요 · 배송 5~7일');

  return (
    <ScreenContainer edges={['top']}>
      <View style={s.header}>
        <Pressable style={s.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow_back" size={26} color={colors.text} />
        </Pressable>
        <View>
          <Text style={s.headerTitle}>소책자 미리보기</Text>
          <Text style={s.headerSub}>모인 이야기를 책으로 간직해요</Text>
        </View>
      </View>

      <ScrollView style={s.flex} contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
        <View style={s.cover}>
          <Text style={s.coverEyebrow}>이음 · 가족 이야기</Text>
          <Text style={s.coverTitle}>
            골목 끝,{'\n'}파란 대문 집
          </Text>
          <Text style={s.coverSub}>김순자 이야기 · 2026 여름호</Text>
          <View style={s.flex1} />
          <View style={s.qrRow}>
            <View style={s.qrBox}>
              <Text style={s.qrText}>QR</Text>
            </View>
            <Text style={s.qrCaption}>
              스캔하면 엄마 목소리로{'\n'}이야기를 들을 수 있어요
            </Text>
          </View>
        </View>

        <View style={s.infoCard}>
          <View style={[s.infoRow, s.infoRowBorder]}>
            <Icon name="menu_book" size={21} color={colors.accent} />
            <Text style={s.infoText}>24쪽 · 이야기 4편 · 음성 QR 4개</Text>
          </View>
          <View style={[s.infoRow, s.infoRowBorder]}>
            <Icon name="event_repeat" size={21} color={colors.accent} />
            <Text style={s.infoText}>매월 1일 발행 · 다음 호 8월 1일</Text>
          </View>
          <View style={s.infoRow}>
            <Icon name="sell" size={21} color={colors.accent} />
            <Text style={s.infoText}>한 권 9,900원 · 패밀리 플랜은 연 2권 포함</Text>
          </View>
        </View>
      </ScrollView>

      <View style={s.footer}>
        <Pressable style={s.orderBtn} onPress={orderBooklet}>
          <Icon name="print" size={23} color={colors.white} />
          <Text style={s.orderBtnText}>인쇄 주문하기</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  flex1: { flex: 1 },
  header: { paddingHorizontal: 20, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn: { width: 48, height: 48, borderRadius: 15, backgroundColor: colors.surfaceSoft, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: fonts.extraBold, fontSize: 19, color: colors.text },
  headerSub: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted3 },

  body: { paddingTop: 12, paddingHorizontal: 26, paddingBottom: 26 },

  cover: {
    width: 230,
    marginTop: 6,
    alignSelf: 'center',
    aspectRatio: 3 / 4,
    borderRadius: radius.r16,
    backgroundColor: colors.accentStrong,
    padding: 22,
    ...shadow.push,
  },
  coverEyebrow: { fontFamily: fonts.bold, fontSize: 11, letterSpacing: 2, color: colors.coverText, opacity: 0.75 },
  coverTitle: { fontFamily: fonts.extraBold, fontSize: 21, lineHeight: 30, color: colors.coverText, marginTop: 14 },
  coverSub: { fontFamily: fonts.regular, fontSize: 12, color: colors.coverText, opacity: 0.8, marginTop: 8 },
  qrRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qrBox: { width: 44, height: 44, borderRadius: 8, backgroundColor: colors.coverText, alignItems: 'center', justifyContent: 'center' },
  qrText: { fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }), fontSize: 11, fontWeight: '700', color: colors.accentStrong },
  qrCaption: { flex: 1, fontFamily: fonts.regular, fontSize: 11, lineHeight: 17, color: colors.coverText, opacity: 0.85 },

  infoCard: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border3,
    borderRadius: radius.r18,
    paddingHorizontal: 18,
    marginTop: 22,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13 },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.chipMuted },
  infoText: { flex: 1, fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted4 },

  footer: { paddingHorizontal: 22, paddingTop: 12, paddingBottom: 20, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bgScreen },
  orderBtn: {
    height: 58,
    borderRadius: radius.r18,
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    ...shadow.accentButton,
  },
  orderBtnText: { fontFamily: fonts.extraBold, fontSize: 17, color: colors.white },
});

export default BookletScreen;
