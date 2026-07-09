import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ScreenContainer, Icon } from '../../components';
import { colors, fonts, radius, typography, tint } from '../../theme';
import { useStore } from '../../store/useStore';
import { avatarColorFor as avColor } from '../../utils/avatar';
import type { ParentTabParamList, RootStackParamList } from '../../navigation/types';
import type { QuestionStatus } from '../../types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<ParentTabParamList, 'Voice'>,
  NativeStackScreenProps<RootStackParamList>
>;

/** 상태 배지 (renderVals.badge) */
function badge(status: QuestionStatus) {
  return status === 'pending'
    ? { label: '답변 기다리는 중', bg: colors.pendingBg, fg: colors.pendingFg, icon: 'schedule' }
    : { label: '답변 완료', bg: colors.answeredBg, fg: colors.answeredFg, icon: 'check_circle' };
}

/**
 * 부모 받은 질문 목록 (sPList, 원본 131~173).
 * 상단 인사 + 타임캡슐/가족투표 진입 + 받은 질문 카드(답변대기/완료 배지).
 */
export function QuestionListScreen({ navigation }: Props) {
  const questions = useStore((s) => s.questions);
  const notifs = useStore((s) => s.notifs);
  const capsules = useStore((s) => s.capsules);
  const pollVoted = useStore((s) => s.pollVoted);

  const hasUnread = notifs.some((n) => n.unread);
  const readyCount = capsules.filter((c) => c.status === 'ready').length;
  const capsSub = readyCount > 0 ? `오늘 열리는 음성 편지 ${readyCount}통` : '정해진 날에 열리는 음성 편지';
  const pollStatusLabel = pollVoted !== null ? '참여 완료' : '아직 참여 전이에요';

  return (
    <ScreenContainer edges={['top']}>
      {/* 헤더 */}
      <View style={styles.head}>
        <View style={styles.headText}>
          <Text style={styles.eyebrow}>부모님 모드</Text>
          <Text style={styles.title}>받은 질문</Text>
          <Text style={styles.sub}>자녀들이 궁금해하는 이야기예요.{'\n'}천천히 답해 주세요.</Text>
        </View>
        <Pressable style={styles.iconBtn} onPress={() => navigation.navigate('Notification')}>
          <Icon name="notifications" size={27} color={colors.textMuted4} />
          {hasUnread ? <View style={styles.unreadDot} /> : null}
        </Pressable>
      </View>

      <ScrollView style={styles.flex} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* 타임캡슐 진입 */}
        <Pressable style={styles.capsBtn} onPress={() => navigation.navigate('Capsule')}>
          <View style={[styles.entryIcon, { backgroundColor: colors.mauve }]}>
            <Icon name="hourglass_top" size={28} color={colors.white} />
          </View>
          <View style={styles.entryTextCol}>
            <Text style={styles.capsTitle}>타임캡슐</Text>
            <Text style={styles.capsSub}>{capsSub}</Text>
          </View>
          <Icon name="chevron_right" size={26} color={colors.accent} />
        </Pressable>

        {/* 가족 투표 진입 */}
        <Pressable style={styles.pollBtn} onPress={() => navigation.navigate('Poll')}>
          <View style={[styles.entryIcon, { backgroundColor: tint(colors.gold, 14) }]}>
            <Icon name="how_to_vote" size={28} color={colors.gold} />
          </View>
          <View style={styles.entryTextCol}>
            <Text style={styles.pollTitle}>가족 투표</Text>
            <Text style={styles.pollSub}>추석 모임 날짜 · {pollStatusLabel}</Text>
          </View>
          <Icon name="chevron_right" size={26} color={colors.textFaint3} />
        </Pressable>

        {/* 받은 질문 카드 */}
        {questions.map((q) => {
          const b = badge(q.status);
          return (
            <Pressable
              key={q.id}
              style={styles.qCard}
              onPress={() => navigation.navigate('QuestionDetail', { questionId: q.id })}
            >
              <View style={styles.qByRow}>
                <View style={[styles.avatar, { backgroundColor: avColor(q) }]}>
                  <Text style={styles.avatarText}>{q.from.slice(0, 1)}</Text>
                </View>
                <Text style={styles.byline}>{`${q.from} · ${q.rel} · ${q.ago}`}</Text>
              </View>
              <Text style={styles.qText}>{q.text}</Text>
              <View style={[styles.badge, { backgroundColor: b.bg }]}>
                <Icon name={b.icon} size={18} color={b.fg} />
                <Text style={[styles.badgeText, { color: b.fg }]}>{b.label}</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  head: {
    paddingTop: 22,
    paddingHorizontal: 26,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  headText: { flex: 1 },
  eyebrow: { fontFamily: fonts.extraBold, fontSize: 13, color: colors.accent, letterSpacing: 0.4 },
  title: { ...typography.heading, color: colors.text, marginTop: 6 },
  sub: { fontFamily: fonts.regular, fontSize: 17, color: colors.textMuted2, marginTop: 10, lineHeight: 26 },
  iconBtn: {
    position: 'relative',
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadDot: {
    position: 'absolute',
    top: 9,
    right: 11,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.danger,
    borderWidth: 2,
    borderColor: colors.surfaceSoft,
  },
  body: { paddingTop: 6, paddingHorizontal: 22, paddingBottom: 26, gap: 14 },

  // 타임캡슐 / 투표 진입
  capsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 19,
    paddingHorizontal: 18,
    borderRadius: radius.r20,
    backgroundColor: colors.accentSoft,
    minHeight: 60,
  },
  pollBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 19,
    paddingHorizontal: 18,
    borderRadius: radius.r20,
    borderWidth: 1.5,
    borderColor: colors.border3,
    backgroundColor: colors.surface,
  },
  entryIcon: { width: 52, height: 52, borderRadius: radius.r16, alignItems: 'center', justifyContent: 'center' },
  entryTextCol: { flex: 1 },
  capsTitle: { fontFamily: fonts.bold, fontSize: 19, color: colors.accentStrong },
  capsSub: { fontFamily: fonts.regular, fontSize: 15, color: colors.textMuted4, marginTop: 3, lineHeight: 21 },
  pollTitle: { fontFamily: fonts.bold, fontSize: 19, color: colors.text },
  pollSub: { fontFamily: fonts.regular, fontSize: 15, color: colors.textMuted, marginTop: 3 },

  // 질문 카드
  qCard: {
    gap: 15,
    padding: 22,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border3,
    backgroundColor: colors.surface,
  },
  qByRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.bold, fontSize: 15, color: colors.white },
  byline: { fontFamily: fonts.medium, fontSize: 15, color: colors.textMuted },
  qText: { ...typography.question, color: colors.text },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 9,
    paddingHorizontal: 15,
    borderRadius: radius.pill,
  },
  badgeText: { fontFamily: fonts.bold, fontSize: 14 },
});

export default QuestionListScreen;
