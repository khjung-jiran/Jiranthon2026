import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer, Icon } from '../../components';
import { colors, fonts, radius } from '../../theme';
import { useStore } from '../../store/useStore';
import { fontSizeOptions, aiGapOptions } from '../../data/mock';
import * as api from '../../api';
import type { RootStackParamList } from '../../navigation/types';
import type { FontSizeOption } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

/** 환경설정 (sSetting, 725~801) — 원본에는 back 버튼이 없다(홈 기어로 진입, 시스템 뒤로가기/스와이프로 복귀) */
export function SettingsScreen(_props: Props) {
  const role = useStore((s) => s.role);
  const currentUser = useStore((s) => s.currentUser);
  const settings = useStore((s) => s.settings);
  const aiGapDays = useStore((s) => s.aiGapDays);
  const switchRole = useStore((s) => s.switchRole);
  const setAiGapDays = useStore((s) => s.setAiGapDays);
  const toggleVoiceGuide = useStore((s) => s.toggleVoiceGuide);
  const toggleAutoTranslate = useStore((s) => s.toggleAutoTranslate);
  const setFontSize = useStore((s) => s.setFontSize);
  const showToast = useStore((s) => s.showToast);
  const logout = useStore((s) => s.logout);

  const isP = role === 'parent';
  const meColor = isP ? colors.olive : colors.blue;
  const meName = currentUser?.name ?? (isP ? '부모님' : '자녀');
  const meInitial = meName[0] ?? '나';
  const meRole = isP ? '부모님 모드 이용 중' : '자녀 모드 이용 중';
  const roleSwitchLabel = isP ? '자녀 모드로' : '부모님 모드로';

  const [familySet, setFamilySet] = useState<{ label: string; name: string; color: string; roleChip: string }[]>([]);
  React.useEffect(() => {
    const sess = api.getSession();
    if (!sess) return;
    api.listMembers(sess.familyId).then((members) => {
      setFamilySet(members.map((m) => ({
        label: m.name,
        name: m.name,
        color: m.role === 'parent' ? colors.olive : colors.blue,
        roleChip: m.role === 'parent' ? '부모님' : '자녀',
      })));
    }).catch(() => {});
  }, []);

  return (
    <ScreenContainer edges={['top']}>
      <View style={s.head}>
        <Text style={s.eyebrow}>환경설정</Text>
        <Text style={s.h26}>설정</Text>
      </View>

      <ScrollView style={s.flex} contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
        {/* 프로필 + 역할 전환 */}
        <View style={s.card}>
          <View style={s.profileRow}>
            <View style={[s.avatar, { backgroundColor: meColor }]}>
              <Text style={s.avatarText}>{meInitial}</Text>
            </View>
            <View style={s.flex}>
              <Text style={s.profileName} numberOfLines={1}>{meName}</Text>
              <Text style={s.profileSub}>{meRole}</Text>
            </View>
          </View>
          <Pressable style={s.switchBtn} onPress={switchRole}>
            <Icon name="swap_horiz" size={18} color={colors.textMuted4} />
            <Text style={s.switchBtnText}>{roleSwitchLabel} 전환 (대필 방문)</Text>
          </Pressable>
        </View>

        {/* 부모님 화면 */}
        <View style={s.card}>
          <Text style={s.sectionLabel}>부모님 화면</Text>
          <View>
            <Text style={s.rowTitle}>글씨 크기</Text>
            <Text style={s.rowSub}>부모님 모드의 화면 전체가 커져요</Text>
            <View style={s.evenChipRow}>
              {fontSizeOptions.map((label) => {
                const on = settings.fontSize === label;
                return (
                  <Pressable
                    key={label}
                    onPress={() => setFontSize(label as FontSizeOption)}
                    style={[s.evenChip, { backgroundColor: on ? colors.accent : colors.surface, borderColor: on ? colors.accent : colors.border2 }]}
                  >
                    <Text style={[s.evenChipText, { color: on ? colors.white : colors.textMuted4 }]}>{label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <Pressable style={s.toggleRow} onPress={toggleVoiceGuide}>
            <View style={s.flex}>
              <Text style={s.rowTitle}>음성 안내</Text>
              <Text style={s.rowSub}>주요 동작을 소리로 알려드려요</Text>
            </View>
            <View style={[s.toggleTrack, { backgroundColor: settings.voiceGuide ? colors.accent : colors.border4 }]}>
              <View style={[s.toggleKnob, { left: settings.voiceGuide ? 23 : 3 }]} />
            </View>
          </Pressable>
        </View>

        {/* AI 질문 */}
        <View style={s.card}>
          <Text style={s.sectionLabel}>AI 질문</Text>
          <View>
            <Text style={s.rowTitle}>이음이 대신 질문하기</Text>
            <Text style={s.rowSubMultiline}>
              마지막 답변 후 자녀의 새 질문이 이 기간 동안 없으면, 이음이 질문을 준비해요
            </Text>
            <View style={s.evenChipRow}>
              {aiGapOptions.map((n) => {
                const on = aiGapDays === n;
                return (
                  <Pressable
                    key={n}
                    onPress={() => setAiGapDays(n)}
                    style={[s.evenChip, { backgroundColor: on ? colors.accent : colors.surface, borderColor: on ? colors.accent : colors.border2 }]}
                  >
                    <Text style={[s.evenChipText, { color: on ? colors.white : colors.textMuted4 }]}>{n}일</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        {/* 언어 */}
        <View style={s.card}>
          <Text style={s.sectionLabel}>언어</Text>
          <Pressable style={s.toggleRowNoTopGap} onPress={toggleAutoTranslate}>
            <View style={s.flex}>
              <Text style={s.rowTitle}>자동 번역</Text>
              <Text style={s.rowSub}>답변을 영어로 함께 보여줘요 · 글로벌 가족</Text>
            </View>
            <View style={[s.toggleTrack, { backgroundColor: settings.autoTranslate ? colors.accent : colors.border4 }]}>
              <View style={[s.toggleKnob, { left: settings.autoTranslate ? 23 : 3 }]} />
            </View>
          </Pressable>
        </View>

        {/* 가족 관리 */}
        <View style={s.card}>
          <Text style={s.sectionLabel}>가족 관리</Text>
          {familySet.map((m) => (
            <View key={m.label} style={s.familyRow}>
              <View style={[s.familyAvatar, { backgroundColor: m.color }]}>
                <Text style={s.familyAvatarText}>{m.name.slice(0, 1)}</Text>
              </View>
              <Text style={s.familyLabel}>{m.label}</Text>
              <View style={s.familyChip}>
                <Text style={s.familyChipText}>{m.roleChip}</Text>
              </View>
            </View>
          ))}
          <Pressable style={s.inviteBtn} onPress={() => showToast('초대 링크를 복사했어요')}>
            <Icon name="person_add" size={19} color={colors.textMuted} />
            <Text style={s.inviteBtnText}>가족 초대하기</Text>
          </Pressable>
        </View>

        {/* 구독 */}
        <View style={s.card}>
          <Text style={s.sectionLabel}>구독</Text>
          <View style={s.planRow}>
            <View>
              <Text style={s.planTitle}>패밀리 플랜</Text>
              <Text style={s.planSub}>월 6,900원 · 데이터 사용량 기반</Text>
            </View>
            <View style={s.planChip}>
              <Text style={s.planChipText}>이용 중</Text>
            </View>
          </View>
          <View>
            <View style={s.usageRow}>
              <Text style={s.usageLabel}>가족 데이터</Text>
              <Text style={s.usageLabel}>2.4GB / 10GB</Text>
            </View>
            <View style={s.usageTrack}>
              <View style={s.usageFill} />
            </View>
          </View>
          <Text style={s.planCaption}>해지 후에도 가족 데이터는 1년간 안전하게 보관돼요</Text>
        </View>

        <Pressable style={s.logoutBtn} onPress={logout}>
          <Text style={s.logoutText}>로그아웃</Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  head: { paddingTop: 20, paddingHorizontal: 24, paddingBottom: 12 },
  eyebrow: { fontFamily: fonts.extraBold, fontSize: 13, color: colors.accent, letterSpacing: 0.4 },
  h26: { fontFamily: fonts.extraBold, fontSize: 26, color: colors.text, marginTop: 5, letterSpacing: -0.5 },

  body: { paddingTop: 4, paddingHorizontal: 22, paddingBottom: 26, gap: 12 },

  card: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border3,
    borderRadius: radius.r20,
    padding: 18,
    gap: 14,
  },
  sectionLabel: { fontFamily: fonts.extraBold, fontSize: 13, color: colors.textFaint2, letterSpacing: 0.3 },

  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.bold, fontSize: 19, color: colors.white },
  profileName: { fontFamily: fonts.extraBold, fontSize: 18, color: colors.text },
  profileSub: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted3, marginTop: 2 },
  switchBtn: {
    height: 46,
    borderRadius: radius.r13,
    borderWidth: 1.5,
    borderColor: colors.border2,
    backgroundColor: colors.bgScreen,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  switchBtnText: { fontFamily: fonts.extraBold, fontSize: 14, color: colors.textMuted4 },

  rowTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  rowSub: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted3, marginTop: 3 },
  rowSubMultiline: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted3, marginTop: 3, lineHeight: 20 },

  evenChipRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  evenChip: { flex: 1, paddingVertical: 11, borderRadius: radius.r12, borderWidth: 1.5, alignItems: 'center' },
  evenChipText: { fontFamily: fonts.bold, fontSize: 14 },

  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  toggleRowNoTopGap: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  toggleTrack: { width: 52, height: 32, borderRadius: radius.pill, justifyContent: 'center' },
  toggleKnob: { position: 'absolute', top: 3, width: 26, height: 26, borderRadius: 13, backgroundColor: colors.white },

  familyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  familyAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  familyAvatarText: { fontFamily: fonts.bold, fontSize: 15, color: colors.white },
  familyLabel: { flex: 1, fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  familyChip: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: radius.pill, backgroundColor: colors.chipMuted },
  familyChipText: { fontFamily: fonts.extraBold, fontSize: 12, color: colors.textMuted3 },
  inviteBtn: {
    height: 46,
    borderRadius: radius.r13,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.borderDashed,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  inviteBtnText: { fontFamily: fonts.bold, fontSize: 14, color: colors.textMuted },

  planRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  planTitle: { fontFamily: fonts.extraBold, fontSize: 16, color: colors.text },
  planSub: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted3, marginTop: 2 },
  planChip: { paddingVertical: 6, paddingHorizontal: 11, borderRadius: radius.pill, backgroundColor: colors.oliveSoft },
  planChipText: { fontFamily: fonts.extraBold, fontSize: 12, color: colors.oliveDeep },
  usageRow: { flexDirection: 'row', justifyContent: 'space-between' },
  usageLabel: { fontFamily: fonts.medium, fontSize: 13, color: colors.textMuted },
  usageTrack: { height: 7, borderRadius: 6, backgroundColor: colors.surfaceSoft3, overflow: 'hidden', marginTop: 7 },
  usageFill: { width: '24%', height: '100%', borderRadius: 6, backgroundColor: colors.accent },
  planCaption: { fontFamily: fonts.regular, fontSize: 12, color: colors.textFaint, lineHeight: 18 },

  logoutBtn: { padding: 10 },
  logoutText: { fontFamily: fonts.bold, fontSize: 14, color: colors.danger },
});

export default SettingsScreen;
