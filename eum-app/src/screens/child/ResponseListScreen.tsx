import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';

import { ScreenContainer, EqBars, Icon } from '../../components';
import { colors, fonts, radius } from '../../theme';
import { useStore } from '../../store/useStore';

export function ResponseListScreen() {
  const questions = useStore((s) => s.questions);
  const autoTranslate = useStore((s) => s.settings.autoTranslate);
  const translatedIds = useStore((s) => s.translatedIds);
  const toggleTranslate = useStore((s) => s.toggleTranslate);

  const answered = questions.filter((q) => q.status === 'answered');

  const [playingAnswer, setPlayingAnswer] = useState<number | null>(null);
  const playTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (playTimer.current) clearTimeout(playTimer.current);
  }, []);

  const playAnswer = (id: number) => {
    if (playTimer.current) clearTimeout(playTimer.current);
    if (playingAnswer === id) {
      setPlayingAnswer(null);
      return;
    }
    setPlayingAnswer(id);
    playTimer.current = setTimeout(() => setPlayingAnswer(null), 5000);
  };

  return (
    <ScreenContainer edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>부모님의 답변</Text>
        <Text style={styles.title}>받은 이야기</Text>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {answered.map((a) => {
          const showEn = !!a.transcriptEn && (autoTranslate || translatedIds.includes(a.id));
          const showEnBtn = !!a.transcriptEn && !autoTranslate;
          const enLabel = translatedIds.includes(a.id) ? '원문만 보기' : '영어로 보기';
          const playing = playingAnswer === a.id;

          return (
            <View key={a.id} style={styles.card}>
              <Text style={styles.cardQ}>Q. {a.text}</Text>
              <Text style={styles.transcript}>"{a.transcript}"</Text>

              {showEn ? <Text style={styles.transcriptEn}>{a.transcriptEn}</Text> : null}

              {showEnBtn ? (
                <Pressable style={styles.enBtn} onPress={() => toggleTranslate(a.id)}>
                  <Icon name="translate" size={15} color={colors.textMuted} />
                  <Text style={styles.enBtnText}>{enLabel}</Text>
                </Pressable>
              ) : null}

              <Pressable style={styles.playBtn} onPress={() => playAnswer(a.id)}>
                <Icon name={playing ? 'pause_circle' : 'play_circle'} size={30} color={colors.accent} />
                <View style={styles.playTrackWrap}>
                  {playing ? (
                    <EqBars color={colors.accent} active />
                  ) : (
                    <View style={styles.playTrack} />
                  )}
                </View>
                <Text style={styles.playDur}>{a.dur}</Text>
              </Pressable>

              <View style={styles.eraRow}>
                <Icon name="auto_stories" size={17} color={colors.olive} />
                <Text style={styles.eraText}>이야기책 · {a.era}에 담겼어요</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },

  header: { paddingTop: 20, paddingHorizontal: 24, paddingBottom: 12 },
  eyebrow: { fontFamily: fonts.extraBold, fontSize: 13, color: colors.blue, letterSpacing: 0.4 },
  title: { fontFamily: fonts.extraBold, fontSize: 26, color: colors.text, marginTop: 5, letterSpacing: -0.5 },

  list: { paddingTop: 6, paddingHorizontal: 22, paddingBottom: 26, gap: 14 },

  card: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border3,
    borderRadius: radius.r20,
    padding: 20,
    gap: 14,
  },
  cardQ: { fontFamily: fonts.medium, fontSize: 14, color: colors.textMuted },
  transcript: { fontFamily: fonts.regular, fontSize: 17, lineHeight: 27, color: colors.text2 },
  transcriptEn: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textMuted,
    borderLeftWidth: 3,
    borderLeftColor: colors.borderWarm,
    paddingLeft: 10,
  },
  enBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.border2,
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  enBtnText: { fontFamily: fonts.extraBold, fontSize: 12, color: colors.textMuted },

  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius.r14,
    backgroundColor: colors.surfaceSoft2,
  },
  playTrackWrap: { flex: 1, height: 26, justifyContent: 'center' },
  playTrack: { width: '100%', height: 6, borderRadius: 6, backgroundColor: colors.borderWarm },
  playDur: { fontFamily: fonts.bold, fontSize: 13, color: colors.textMuted },

  eraRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  eraText: { fontFamily: fonts.bold, fontSize: 13, color: colors.olive },
});

export default ResponseListScreen;
