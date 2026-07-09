import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ScreenContainer, Icon } from '../../components';
import { colors, fonts, radius, tint } from '../../theme';
import { storybookPages, eraTone } from '../../data/mock';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Storybook'>;

type StoryView = 'toc' | 'page';

export function StorybookScreen({ navigation }: Props) {
  const [storyView, setStoryView] = useState<StoryView>('toc');
  const [storyPage, setStoryPage] = useState(0);
  const [storyPlaying, setStoryPlaying] = useState(false);
  const playTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (playTimer.current) clearTimeout(playTimer.current);
  }, []);

  const chTotal = storybookPages.reduce((a, p) => a + (p.count || 1), 0);

  const back = () => {
    if (storyView === 'page') {
      setStoryView('toc');
      setStoryPlaying(false);
      return;
    }
    navigation.goBack();
  };

  const openCh = (i: number) => {
    setStoryPage(i);
    setStoryView('page');
    setStoryPlaying(false);
  };

  const playStory = () => {
    if (playTimer.current) clearTimeout(playTimer.current);
    if (storyPlaying) {
      setStoryPlaying(false);
      return;
    }
    setStoryPlaying(true);
    playTimer.current = setTimeout(() => setStoryPlaying(false), 5000);
  };

  const nextStory = () => {
    setStoryPage((p) => Math.min(p + 1, storybookPages.length - 1));
    setStoryPlaying(false);
  };
  const prevStory = () => {
    setStoryPage((p) => Math.max(p - 1, 0));
    setStoryPlaying(false);
  };

  const cur = storybookPages[storyPage];
  const eraColor = eraTone[cur.era] || colors.olive;
  const prNow = cur.count || 1;
  const prTotal = 3;
  const progPct = Math.min(100, Math.round((prNow / prTotal) * 100));
  const progText =
    prNow >= prTotal ? '챕터 완성!' : `이야기 ${prNow}/${prTotal} · ${prTotal - prNow}개 더 모으면 완성`;

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      {/* 상단 바 */}
      <View style={styles.topBar}>
        <Pressable style={styles.backBtn} onPress={back}>
          <Icon name="arrow_back" size={26} color={colors.text} />
        </Pressable>
        <View>
          <Text style={styles.topTitle}>이야기책</Text>
          <Text style={styles.topSub}>엄마 김순자의 이야기</Text>
        </View>
      </View>

      {storyView === 'toc' ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.tocBody}
          showsVerticalScrollIndicator={false}
        >
          {/* 헤더 카드 */}
          <View style={styles.tocHeaderCard}>
            <Icon name="auto_stories" size={34} color={colors.coverText} />
            <View style={styles.flex}>
              <Text style={styles.tocHeaderTitle}>엄마 김순자의 이야기</Text>
              <Text style={styles.tocHeaderSub}>모인 이야기 {chTotal}편 · 챕터 4개</Text>
            </View>
          </View>

          <Text style={styles.sectionLabel}>목차</Text>

          <View style={styles.chapterList}>
            {storybookPages.map((p, i) => {
              const cColor = eraTone[p.era] || colors.olive;
              return (
                <Pressable key={p.era} style={styles.chapterCard} onPress={() => openCh(i)}>
                  <View style={[styles.chapterNum, { backgroundColor: tint(cColor, 12) }]}>
                    <Text style={[styles.chapterNumText, { color: cColor }]}>{i + 1}장</Text>
                  </View>
                  <View style={styles.chapterMid}>
                    <View style={styles.chapterTitleRow}>
                      <Text style={styles.chapterEra}>{p.era}</Text>
                      {p.isNew ? (
                        <View style={styles.newBadge}>
                          <Text style={styles.newBadgeText}>NEW</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.chapterMeta}>
                      {p.years} · 이야기 {p.count}편
                    </Text>
                  </View>
                  <Icon name="chevron_right" size={24} color={colors.textFaint3} />
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.tocFootnote}>답변이 모일수록 챕터가 두꺼워져요</Text>
        </ScrollView>
      ) : (
        <View style={styles.flex}>
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.pageBody}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.eraChip, { backgroundColor: tint(eraColor, 13) }]}>
              <Text style={[styles.eraChipText, { color: eraColor }]}>{cur.era}</Text>
            </View>
            <Text style={styles.pageYears}>{cur.years}</Text>
            <Text style={styles.pageTitle}>{cur.title}</Text>
            <Text style={[styles.pageQuote, { color: eraColor }]}>“</Text>
            <Text style={styles.pageBodyText}>{cur.body}</Text>

            <Pressable style={styles.playStoryBtn} onPress={playStory}>
              <Icon name={storyPlaying ? 'pause_circle' : 'play_circle'} size={24} color={eraColor} />
              <Text style={styles.playStoryText}>엄마 목소리로 듣기 · {cur.dur}</Text>
            </Pressable>

            <View style={styles.progCard}>
              <View style={styles.progHeaderRow}>
                <Text style={styles.progLabel}>챕터 완성도</Text>
                <Text style={[styles.progValue, { color: eraColor }]}>{progText}</Text>
              </View>
              <View style={styles.progTrack}>
                <View style={[styles.progFill, { backgroundColor: eraColor, width: `${progPct}%` }]} />
              </View>
            </View>

            <Pressable style={styles.bookletBtn} onPress={() => navigation.navigate('Booklet')}>
              <Icon name="menu_book" size={21} color={colors.textMuted} />
              <Text style={styles.bookletText}>이 이야기로 소책자 만들기</Text>
            </Pressable>
          </ScrollView>

          {/* 페이지 넘김 푸터 */}
          <View style={styles.pageFooter}>
            <Pressable
              style={[styles.navBtnGhost, { opacity: storyPage === 0 ? 0.4 : 1 }]}
              onPress={prevStory}
            >
              <Icon name="chevron_left" size={26} color={colors.text} />
            </Pressable>
            <View style={styles.dotsRow}>
              {storybookPages.map((p, i) => (
                <View
                  key={p.era}
                  style={{
                    width: i === storyPage ? 22 : 8,
                    height: 8,
                    borderRadius: 6,
                    backgroundColor: i === storyPage ? eraColor : colors.border4,
                  }}
                />
              ))}
            </View>
            <Pressable
              style={[styles.navBtnAccent, { opacity: storyPage === storybookPages.length - 1 ? 0.4 : 1 }]}
              onPress={nextStory}
            >
              <Icon name="chevron_right" size={26} color={colors.white} />
            </Pressable>
          </View>
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },

  topBar: {
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: { fontFamily: fonts.extraBold, fontSize: 18, color: colors.text },
  topSub: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted3 },

  // ── TOC ──
  tocBody: { paddingTop: 10, paddingHorizontal: 22, paddingBottom: 26 },
  tocHeaderCard: {
    backgroundColor: colors.accentStrong,
    borderRadius: radius.r20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  tocHeaderTitle: { fontFamily: fonts.extraBold, fontSize: 18, color: colors.coverText },
  tocHeaderSub: { fontFamily: fonts.regular, fontSize: 13, color: colors.coverText, opacity: 0.8, marginTop: 3 },

  sectionLabel: {
    fontFamily: fonts.extraBold,
    fontSize: 15,
    color: colors.textFaint2,
    letterSpacing: 0.3,
    marginTop: 20,
    marginBottom: 12,
    marginLeft: 2,
  },

  chapterList: { gap: 11 },
  chapterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border3,
    borderRadius: radius.r20,
    padding: 18,
  },
  chapterNum: {
    width: 46,
    height: 46,
    borderRadius: radius.r14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chapterNumText: { fontFamily: fonts.extraBold, fontSize: 14 },
  chapterMid: { flex: 1, minWidth: 0 },
  chapterTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chapterEra: { fontFamily: fonts.extraBold, fontSize: 17, color: colors.text },
  newBadge: {
    backgroundColor: colors.danger,
    borderRadius: radius.pill,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  newBadgeText: { fontFamily: fonts.extraBold, fontSize: 10, color: colors.white, letterSpacing: 0.5 },
  chapterMeta: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted3, marginTop: 4 },

  tocFootnote: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textFaint,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 21,
  },

  // ── PAGE ──
  pageBody: { paddingVertical: 14, paddingHorizontal: 26 },
  eraChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
  },
  eraChipText: { fontFamily: fonts.extraBold, fontSize: 14 },
  pageYears: { fontFamily: fonts.medium, fontSize: 14, color: colors.textFaint, marginTop: 14, letterSpacing: 0.5 },
  pageTitle: { fontFamily: fonts.extraBold, fontSize: 27, lineHeight: 36, letterSpacing: -0.5, color: colors.text, marginTop: 8 },
  pageQuote: { fontFamily: fonts.extraBold, fontSize: 34, lineHeight: 20, marginTop: 26, marginBottom: -6 },
  pageBodyText: { fontFamily: fonts.regular, fontSize: 18, lineHeight: 33, color: colors.storyBody },

  playStoryBtn: {
    alignSelf: 'flex-start',
    marginTop: 26,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: radius.r14,
    borderWidth: 1.5,
    borderColor: colors.border2,
    backgroundColor: colors.surface,
  },
  playStoryText: { fontFamily: fonts.bold, fontSize: 15, color: colors.text2 },

  progCard: {
    width: '100%',
    marginTop: 18,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border3,
    borderRadius: radius.r14,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  progHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progLabel: { fontFamily: fonts.bold, fontSize: 13, color: colors.textMuted },
  progValue: { fontFamily: fonts.bold, fontSize: 13 },
  progTrack: { height: 7, borderRadius: 6, backgroundColor: colors.surfaceSoft3, overflow: 'hidden', marginTop: 8 },
  progFill: { height: '100%', borderRadius: 6 },

  bookletBtn: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    padding: 14,
    borderRadius: radius.r14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.borderDashed,
  },
  bookletText: { fontFamily: fonts.bold, fontSize: 15, color: colors.textMuted },

  pageFooter: {
    paddingTop: 14,
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bgScreen,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navBtnGhost: {
    width: 52,
    height: 52,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: colors.border2,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnAccent: {
    width: 52,
    height: 52,
    borderRadius: 15,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});

export default StorybookScreen;
