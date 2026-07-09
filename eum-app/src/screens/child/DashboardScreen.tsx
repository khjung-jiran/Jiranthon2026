import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ScreenContainer, Icon } from '../../components';
import { colors, fonts, radius, shadow } from '../../theme';
import { useStore } from '../../store/useStore';
import * as api from '../../api';
import type { ChildTabParamList, RootStackParamList } from '../../navigation/types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<ChildTabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function DashboardScreen({ navigation }: Props) {
  const questions = useStore((s) => s.questions);
  const capsules = useStore((s) => s.capsules);
  const notifs = useStore((s) => s.notifs);
  const pollVoted = useStore((s) => s.pollVoted);
  const currentUser = useStore((s) => s.currentUser);

  const pending = questions.filter((q) => q.status === 'pending');
  const answered = questions.filter((q) => q.status === 'answered');
  const recent = answered[0] ?? null;
  const preview = recent?.transcript ? recent.transcript.slice(0, 42) + '…' : '';
  const hasUnread = notifs.some((n) => n.unread);
  const readyCount = capsules.filter((c) => c.status === 'ready').length;
  const capsSub = readyCount > 0 ? `오늘 열리는 음성 편지 ${readyCount}통` : '정해진 날에 열리는 음성 편지';
  const pollStatusLabel = pollVoted !== null ? '참여 완료' : '아직 참여 전이에요';

  const myName = currentUser?.name ?? '회원';
  const myInitial = myName[0] ?? '나';

  const [familyMembers, setFamilyMembers] = useState<{ label: string; name: string; color: string }[]>([]);
  useEffect(() => {
    const session = api.getSession();
    if (!session) return;
    api.listMembers(session.familyId).then((members) => {
      setFamilyMembers(members.map((m) => ({
        label: m.name,
        name: m.name,
        color: m.role === 'parent' ? colors.olive : colors.blue,
      })));
    }).catch(() => {});
  }, []);

  return (
    <ScreenContainer edges={['top']} scroll contentContainerStyle={styles.content}>
      {/* 헤더 */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.eyebrow}>자녀 모드</Text>
          <Text style={styles.greeting}>안녕하세요, {myName}님</Text>
          <Text style={styles.subGreeting}>가족과의 이야기를 모아요</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable style={styles.iconCircle} onPress={() => navigation.navigate('Notification')}>
            <Icon name="notifications" size={23} color={colors.textMuted4} />
            {hasUnread ? <View style={styles.unreadDot} /> : null}
          </Pressable>
          <Pressable style={styles.iconCircle} onPress={() => navigation.navigate('Settings')}>
            <Icon name="settings" size={23} color={colors.textMuted4} />
          </Pressable>
          <View style={styles.meAvatar}>
            <Text style={styles.meAvatarText}>{myInitial}</Text>
          </View>
        </View>
      </View>

      {/* 카운트 */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: colors.statPendingFg }]}>{pending.length}</Text>
          <Text style={styles.statLabel}>답변 대기</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: colors.oliveDeep }]}>{answered.length}</Text>
          <Text style={styles.statLabel}>받은 답변</Text>
        </View>
      </View>

      {/* 최근 도착한 이야기 */}
      <Text style={styles.sectionLabel}>최근 도착한 이야기</Text>
      {recent ? (
        <Pressable style={styles.recentCard} onPress={() => navigation.navigate('Voice')}>
          <Text style={styles.recentQ}>Q. {recent.text}</Text>
          <Text style={styles.recentPreview}>"{preview}"</Text>
          <View style={styles.recentPlayRow}>
            <Icon name="play_circle" size={20} color={colors.blue} />
            <Text style={styles.recentPlayText}>엄마 목소리로 듣기 · {recent.dur}</Text>
          </View>
        </Pressable>
      ) : null}

      {/* 질문 보내기 */}
      <Pressable style={styles.composeBtn} onPress={() => navigation.navigate('Compose')}>
        <Icon name="add_comment" size={24} color={colors.white} />
        <Text style={styles.composeBtnText}>질문 보내기</Text>
      </Pressable>

      {/* 이야기책 */}
      <MenuRow
        color={colors.olive}
        icon="auto_stories"
        title="이야기책 열어보기"
        sub="모인 답변이 연대기로 정리됐어요"
        onPress={() => navigation.navigate('Storybook')}
      />
      {/* 타임캡슐 */}
      <MenuRow
        color={colors.mauve}
        icon="hourglass_top"
        title="타임캡슐"
        sub={capsSub}
        onPress={() => navigation.navigate('Capsule')}
      />
      {/* 가족 투표 */}
      <MenuRow
        color={colors.gold}
        icon="how_to_vote"
        title="가족 투표"
        sub={`추석 모임 날짜 정하기 · ${pollStatusLabel}`}
        onPress={() => navigation.navigate('Poll')}
      />

      {/* 우리 가족 */}
      <Text style={styles.sectionLabel}>우리 가족</Text>
      <View style={styles.familyRow}>
        {familyMembers.map((m) => (
          <View key={m.label} style={styles.familyItem}>
            <View style={[styles.familyAvatar, { backgroundColor: m.color }]}>
              <Text style={styles.familyAvatarText}>{m.name.slice(0, 1)}</Text>
            </View>
            <Text style={styles.familyLabel}>{m.label}</Text>
          </View>
        ))}
      </View>
    </ScreenContainer>
  );
}

function MenuRow({
  color,
  icon,
  title,
  sub,
  onPress,
}: {
  color: string;
  icon: string;
  title: string;
  sub: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.menuRow} onPress={onPress}>
      <View style={[styles.menuIconBox, { backgroundColor: color }]}>
        <Icon name={icon} size={26} color={colors.white} />
      </View>
      <View style={styles.menuTextWrap}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuSub}>{sub}</Text>
      </View>
      <Icon name="chevron_right" size={24} color={colors.textFaint3} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 20, paddingHorizontal: 22, paddingBottom: 26 },

  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  eyebrow: { fontFamily: fonts.extraBold, fontSize: 13, color: colors.blue, letterSpacing: 0.4 },
  greeting: { fontFamily: fonts.extraBold, fontSize: 26, color: colors.text, marginTop: 5, letterSpacing: -0.5 },
  subGreeting: { fontFamily: fonts.regular, fontSize: 15, color: colors.textMuted, marginTop: 6 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadDot: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: colors.danger,
    borderWidth: 2,
    borderColor: colors.surfaceSoft,
  },
  meAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meAvatarText: { fontFamily: fonts.bold, fontSize: 17, color: colors.white },

  statsRow: { flexDirection: 'row', gap: 12, marginTop: 22 },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border3,
    borderRadius: radius.r18,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  statNum: { fontFamily: fonts.extraBold, fontSize: 30 },
  statLabel: { fontFamily: fonts.medium, fontSize: 14, color: colors.textMuted, marginTop: 2 },

  sectionLabel: {
    fontFamily: fonts.extraBold,
    fontSize: 15,
    color: colors.textFaint2,
    letterSpacing: 0.3,
    marginTop: 24,
    marginBottom: 12,
    marginLeft: 2,
  },

  recentCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border3,
    borderRadius: radius.r20,
    padding: 18,
    gap: 12,
  },
  recentQ: { fontFamily: fonts.medium, fontSize: 14, color: colors.textMuted },
  recentPreview: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 25, color: colors.text2 },
  recentPlayRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recentPlayText: { fontFamily: fonts.bold, fontSize: 14, color: colors.blue },

  composeBtn: {
    width: '100%',
    height: 62,
    marginTop: 20,
    borderRadius: radius.r18,
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    ...shadow.accentButton,
  },
  composeBtnText: { fontFamily: fonts.extraBold, fontSize: 18, color: colors.white },

  menuRow: {
    width: '100%',
    marginTop: 12,
    backgroundColor: colors.surfaceSoft3,
    borderRadius: radius.r18,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  menuIconBox: {
    width: 46,
    height: 46,
    borderRadius: radius.r14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextWrap: { flex: 1 },
  menuTitle: { fontFamily: fonts.bold, fontSize: 17, color: colors.text },
  menuSub: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted, marginTop: 2 },

  familyRow: { flexDirection: 'row', gap: 16 },
  familyItem: { alignItems: 'center', gap: 7 },
  familyAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  familyAvatarText: { fontFamily: fonts.bold, fontSize: 18, color: colors.white },
  familyLabel: { fontFamily: fonts.medium, fontSize: 12, color: colors.textMuted },
});

export default DashboardScreen;
