import React, { useEffect } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ScreenContainer, Icon, ImageSlot } from '../../components';
import { colors, fonts, radius, typography } from '../../theme';
import { useStore } from '../../store/useStore';
import { aiHomeQuestionText } from '../../data/mock';
import { avatarColorFor as avColor } from '../../utils/avatar';
import type { ParentTabParamList, RootStackParamList } from '../../navigation/types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<ParentTabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;

/** 세션당 1회만 푸시 배너를 예약(원본 schedulePush의 _pushShown 가드 대응) */
let pushScheduled = false;

/**
 * 부모 홈 (sPHome, 원본 77~130).
 * 인사 헤더 + (AI 준비 질문 카드) + 오늘 답할 이야기 목록 / 완료 시 빈 상태.
 */
export function HomeScreen({ navigation }: Props) {
  const role = useStore((s) => s.role);
  const questions = useStore((s) => s.questions);
  const notifs = useStore((s) => s.notifs);
  const aiGapDays = useStore((s) => s.aiGapDays);
  const ensureAiQuestion = useStore((s) => s.ensureAiQuestion);
  const setPush = useStore((s) => s.setPush);

  const hasUnread = notifs.some((n) => n.unread);

  const pending = questions.filter((q) => q.status === 'pending');
  const pendingChild = pending.filter((q) => !q.ai);
  const hasAi = questions.some((q) => q.ai);
  const lastAnswerDaysAgo = 4;
  const aiDue = role === 'parent' && pendingChild.length === 0 && lastAnswerDaysAgo >= aiGapDays && !hasAi;
  const homeEmpty = pending.length === 0;

  const homeSub =
    pending.length > 0
      ? `오늘 답할 이야기가 ${pending.length}건 있어요`
      : aiDue
        ? '이음이 질문을 준비했어요'
        : '모든 이야기에 답하셨어요';

  // 원본 schedulePush: 부모 진입 1.4s 뒤 푸시 배너, 8s 뒤 자동 숨김 (세션 1회)
  useEffect(() => {
    if (role !== 'parent' || pushScheduled) return;
    pushScheduled = true;
    let hideTimer: ReturnType<typeof setTimeout> | undefined;
    const showTimer = setTimeout(() => {
      setPush({ qid: 2, title: '서연의 새 질문이 도착했어요' });
      hideTimer = setTimeout(() => setPush(null), 8000);
    }, 1400);
    return () => {
      clearTimeout(showTimer);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [role, setPush]);

  const openAI = () => {
    const id = ensureAiQuestion();
    navigation.navigate('QuestionDetail', { questionId: id });
  };

  return (
    <ScreenContainer edges={['top']}>
      {/* 인사 헤더 */}
      <View style={styles.head}>
        <View style={styles.headText}>
          <Text style={styles.eyebrow}>부모님 모드</Text>
          <Text style={styles.greeting}>안녕하세요, 순자님</Text>
          <Text style={styles.sub}>{homeSub}</Text>
        </View>
        <View style={styles.headBtns}>
          <Pressable style={styles.iconBtn} onPress={() => navigation.navigate('Notification')}>
            <Icon name="notifications" size={27} color={colors.textMuted4} />
            {hasUnread ? <View style={styles.unreadDot} /> : null}
          </Pressable>
          <Pressable style={styles.iconBtn} onPress={() => navigation.navigate('Settings')}>
            <Icon name="settings" size={27} color={colors.textMuted4} />
          </Pressable>
        </View>
      </View>

      <ScrollView style={styles.flex} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* 이음이 준비한 AI 질문 */}
        {aiDue ? (
          <Pressable style={styles.aiCard} onPress={openAI}>
            <View style={styles.aiEyebrowRow}>
              <Icon name="auto_awesome" size={19} color={colors.accent} />
              <Text style={styles.aiEyebrow}>이음이 준비한 질문 · 자녀 질문이 {aiGapDays}일째 없어요</Text>
            </View>
            <Text style={styles.aiQuestion}>{aiHomeQuestionText}</Text>
            <View style={styles.answerPill}>
              <Icon name="mic" size={19} color={colors.white} />
              <Text style={styles.answerPillText}>답변하기</Text>
            </View>
          </Pressable>
        ) : null}

        {/* 오늘 답할 이야기 */}
        {pending.length > 0 ? (
          <Text style={styles.sectionLabel}>오늘 답할 이야기 {pending.length}건</Text>
        ) : null}

        {pending.map((q) => (
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
            <View style={styles.answerPill}>
              <Icon name="mic" size={19} color={colors.white} />
              <Text style={styles.answerPillText}>답변하기</Text>
            </View>
          </Pressable>
        ))}

        {/* 모두 답한 빈 상태 */}
        {homeEmpty ? (
          <View style={styles.emptyWrap}>
            <ImageSlot placeholder="가족 사진을 넣어보세요" shape="rounded" radius={24} width="100%" height={320} />
            <View style={styles.emptyTextWrap}>
              <Text style={styles.emptyTitle}>모든 이야기에 답하셨어요</Text>
              <Text style={styles.emptySub}>새 질문이 도착하면 알려드릴게요</Text>
            </View>
          </View>
        ) : null}
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
  greeting: { ...typography.heading, color: colors.text, marginTop: 6 },
  sub: { fontFamily: fonts.regular, fontSize: 17, color: colors.textMuted2, marginTop: 10, lineHeight: 26 },
  headBtns: { flexDirection: 'row', gap: 8 },
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

  // AI 카드
  aiCard: {
    gap: 15,
    padding: 22,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  aiEyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  aiEyebrow: { flex: 1, fontFamily: fonts.extraBold, fontSize: 14, color: colors.accent },
  aiQuestion: { ...typography.question, color: colors.text2 },

  // 공용 답변하기 pill
  answerPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  answerPillText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.white },

  sectionLabel: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.textFaint2, letterSpacing: 0.3, paddingLeft: 2 },

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

  // 빈 상태
  emptyWrap: { gap: 16 },
  emptyTextWrap: { alignItems: 'center' },
  emptyTitle: { fontFamily: fonts.extraBold, fontSize: 20, color: colors.text },
  emptySub: { fontFamily: fonts.regular, fontSize: 15, color: colors.textMuted, marginTop: 8, lineHeight: 24, textAlign: 'center' },
});

export default HomeScreen;
