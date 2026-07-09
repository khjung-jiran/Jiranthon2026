import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ScreenContainer, Header, Icon, EqBars } from '../../components';
import { colors, fonts, radius } from '../../theme';
import { useStore } from '../../store/useStore';
import { avatarColorFor as avColor } from '../../utils/avatar';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'QuestionDetail'>;

/**
 * 부모 질문 상세 (sPDetail, 원본 174~200).
 * 큰 질문 텍스트 + "질문 듣기" TTS 버튼(재생상태 ttsPlaying: 이퀄/진행바) + 답변하기.
 * TTS는 목업 타이머(130ms마다 +3%, 100%에서 정지)로 재현.
 */
export function QuestionDetailScreen({ route, navigation }: Props) {
  const { questionId } = route.params;
  const questions = useStore((s) => s.questions);
  const curQ = questions.find((q) => q.id === questionId) ?? questions[0];

  const [ttsPlaying, setTtsPlaying] = useState(false);
  const [ttsPct, setTtsPct] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const clear = () => {
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
  };

  useEffect(() => clear, []);

  const toggleTTS = () => {
    if (ttsPlaying) {
      clear();
      setTtsPlaying(false);
      return;
    }
    setTtsPlaying(true);
    setTtsPct(0);
    timer.current = setInterval(() => {
      setTtsPct((p) => {
        const next = p + 3;
        if (next >= 100) {
          clear();
          setTtsPlaying(false);
          return 100;
        }
        return next;
      });
    }, 130);
  };

  const goRespond = () => {
    clear();
    navigation.navigate('Respond', { questionId });
  };

  return (
    <ScreenContainer>
      <Header title="질문 상세" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.byRow}>
          <View style={[styles.avatar, { backgroundColor: avColor(curQ) }]}>
            <Text style={styles.avatarText}>{curQ.from.slice(0, 1)}</Text>
          </View>
          <Text style={styles.byline}>{`${curQ.from} · ${curQ.rel} · ${curQ.ago}`}</Text>
        </View>

        <Text style={styles.question}>{curQ.text}</Text>

        {ttsPlaying ? (
          <View style={styles.ttsBox}>
            <View style={styles.eqWrap}>
              <EqBars color={colors.accent} active count={5} />
            </View>
            <Text style={styles.ttsLabel}>질문을 듣고 계세요…</Text>
            <View style={styles.track}>
              <View style={[styles.trackFill, { width: `${ttsPct}%` }]} />
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.ttsBtn} onPress={toggleTTS}>
          <Icon name={ttsPlaying ? 'pause_circle' : 'play_circle'} size={26} color={colors.accent} />
          <Text style={styles.ttsBtnText}>{ttsPlaying ? '그만 듣기' : '질문 듣기'}</Text>
        </Pressable>
        <Pressable style={styles.respondBtn} onPress={goRespond}>
          <Icon name="mic" size={26} color={colors.white} />
          <Text style={styles.respondBtnText}>답변하기</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: { paddingTop: 12, paddingHorizontal: 30, paddingBottom: 20, alignItems: 'center' },
  byRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.bold, fontSize: 15, color: colors.white },
  byline: { fontFamily: fonts.medium, fontSize: 16, color: colors.textMuted },
  question: {
    fontFamily: fonts.extraBold,
    fontSize: 26,
    lineHeight: 40,
    letterSpacing: -0.5,
    color: colors.text,
    textAlign: 'center',
    marginVertical: 26,
  },

  // TTS 재생 상태
  ttsBox: { alignItems: 'center', gap: 14, marginBottom: 6 },
  eqWrap: { height: 26, justifyContent: 'flex-end' },
  ttsLabel: { fontFamily: fonts.bold, fontSize: 16, color: colors.accent },
  track: { width: 220, height: 8, borderRadius: 6, backgroundColor: colors.track, overflow: 'hidden' },
  trackFill: { height: '100%', borderRadius: 6, backgroundColor: colors.accent },

  // 하단 고정 버튼
  footer: {
    paddingTop: 16,
    paddingHorizontal: 22,
    paddingBottom: 22,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bgScreen,
  },
  ttsBtn: {
    height: 60,
    borderRadius: radius.r18,
    borderWidth: 1.5,
    borderColor: colors.accent,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  ttsBtnText: { fontFamily: fonts.bold, fontSize: 18, color: colors.accent },
  respondBtn: {
    height: 64,
    borderRadius: radius.r18,
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 13,
    elevation: 6,
  },
  respondBtnText: { fontFamily: fonts.extraBold, fontSize: 19, color: colors.white },
});

export default QuestionDetailScreen;
