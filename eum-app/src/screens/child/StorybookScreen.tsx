import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ScreenContainer, Icon } from '../../components';
import { colors, fonts, radius, tint } from '../../theme';
import * as api from '../../api';
import type { StoryChapter } from '../../api';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Storybook'>;

type StoryView = 'toc' | 'page';

const ERA_TONE: Record<string, string> = {
  '유년기': '#7C8A55',
  '청년시절': '#9A7B3C',
  '황혼기': '#8C5F6E',
};

const ERA_ORDER = ['유년기', '청년시절', '황혼기'];

export function StorybookScreen({ navigation }: Props) {
  const [storyView, setStoryView] = useState<StoryView>('toc');
  const [storyPage, setStoryPage] = useState(0);
  const [storyPlaying, setStoryPlaying] = useState(false);
  const [pages, setPages] = useState<StoryChapter[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [hasNew, setHasNew] = useState(false);
  const playTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sortChapters = (chapters: StoryChapter[]) =>
    ERA_ORDER
      .map((label) => chapters.find((c) => c.label === label))
      .filter((c): c is StoryChapter => !!c);

  const loadStories = useCallback(async () => {
    const session = api.getSession();
    if (!session) return;
    setLoading(true);
    try {
      const { chapters } = await api.getStorybook(session.familyId);
      if (chapters.length === 0) {
        // 저장된 스토리가 없으면 최초 생성
        const { chapters: generated } = await api.generateStorybook(session.familyId);
        setPages(sortChapters(generated));
      } else {
        const sorted = sortChapters(chapters);
        setHasNew(chapters.some((c) => c.has_new));
        setPages(sorted.filter((c) => c.body));
      }
    } catch (e) { console.warn('[eum] 스토리북 조회 실패:', e); }
    setLoading(false);
  }, []);

  const updateStories = useCallback(async () => {
    const session = api.getSession();
    if (!session) return;
    setUpdating(true);
    try {
      const { chapters } = await api.generateStorybook(session.familyId);
      setPages(sortChapters(chapters));
      setHasNew(false);
    } catch (e) { console.warn('[eum] 스토리북 업데이트 실패:', e); }
    setUpdating(false);
  }, []);

  useEffect(() => { loadStories(); }, [loadStories]);
  useEffect(() => () => { if (playTimer.current) clearTimeout(playTimer.current); }, []);

  const chTotal = pages.reduce((a, p) => a + (p.count || 1), 0);

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
    setStoryPage((p) => Math.min(p + 1, pages.length - 1));
    setStoryPlaying(false);
  };
  const prevStory = () => {
    setStoryPage((p) => Math.max(p - 1, 0));
    setStoryPlaying(false);
  };

  const cur = pages[storyPage];
  const eraColor = cur ? (ERA_TONE[cur.label] || colors.olive) : colors.olive;
  const prNow = cur?.count || 1;
  const prTotal = 3;
  const progPct = Math.min(100, Math.round((prNow / prTotal) * 100));
  const progText =
    prNow >= prTotal ? '챕터 완성!' : `이야기 ${prNow}/${prTotal} · ${prTotal - prNow}개 더 모으면 완성`;

  if (pages.length === 0) {
    return (
      <ScreenContainer edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <Pressable style={styles.backBtn} onPress={back}>
            <Icon name="arrow_back" size={26} color={colors.text} />
          </Pressable>
          <View>
            <Text style={styles.topTitle}>이야기책</Text>
            <Text style={styles.topSub}>가족의 이야기</Text>
          </View>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
          <Icon name="auto_stories" size={48} color={colors.textFaint} />
          {loading ? (
            <Text style={{ fontFamily: fonts.bold, fontSize: 18, color: colors.textMuted, marginTop: 16, textAlign: 'center' }}>
              이야기를 만들고 있어요…
            </Text>
          ) : hasNew ? (
            <>
              <Text style={{ fontFamily: fonts.bold, fontSize: 18, color: colors.textMuted, marginTop: 16, textAlign: 'center' }}>
                모인 이야기가 있어요{'\n'}이야기책을 만들어보세요
              </Text>
              <Pressable style={[styles.updateBtn, { marginTop: 20 }]} onPress={updateStories} disabled={updating}>
                <Icon name="auto_awesome" size={19} color={colors.white} />
                <Text style={styles.updateBtnText}>{updating ? '이야기를 만들고 있어요…' : '이야기 만들기'}</Text>
              </Pressable>
            </>
          ) : (
            <Text style={{ fontFamily: fonts.bold, fontSize: 18, color: colors.textMuted, marginTop: 16, textAlign: 'center' }}>
              아직 모인 이야기가 없어요{'\n'}질문에 답하면 이야기가 쌓여요
            </Text>
          )}
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      {/* 상단 바 */}
      <View style={styles.topBar}>
        <Pressable style={styles.backBtn} onPress={back}>
          <Icon name="arrow_back" size={26} color={colors.text} />
        </Pressable>
        <View>
          <Text style={styles.topTitle}>이야기책</Text>
          <Text style={styles.topSub}>가족의 이야기</Text>
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
              <Text style={styles.tocHeaderTitle}>가족의 이야기</Text>
              <Text style={styles.tocHeaderSub}>모인 이야기 {chTotal}편 · 챕터 {pages.length}개</Text>
            </View>
          </View>

          <Text style={styles.sectionLabel}>목차</Text>

          <View style={styles.chapterList}>
            {pages.map((p, i) => {
              const cColor = ERA_TONE[p.label] || colors.olive;
              return (
                <Pressable key={p.label} style={styles.chapterCard} onPress={() => openCh(i)}>
                  <View style={[styles.chapterNum, { backgroundColor: tint(cColor, 12) }]}>
                    <Text style={[styles.chapterNumText, { color: cColor }]}>{i + 1}장</Text>
                  </View>
                  <View style={styles.chapterMid}>
                    <View style={styles.chapterTitleRow}>
                      <Text style={styles.chapterEra}>{p.label}</Text>
                    </View>
                    <Text style={styles.chapterMeta}>
                      {p.title} · 이야기 {p.count}편
                    </Text>
                  </View>
                  <Icon name="chevron_right" size={24} color={colors.textFaint3} />
                </Pressable>
              );
            })}
          </View>

          {hasNew ? (
            <Pressable style={styles.updateBtn} onPress={updateStories} disabled={updating}>
              <Icon name="auto_awesome" size={19} color={colors.white} />
              <Text style={styles.updateBtnText}>{updating ? '이야기를 만들고 있어요…' : '새 이야기 추가하기'}</Text>
            </Pressable>
          ) : null}

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
              <Text style={[styles.eraChipText, { color: eraColor }]}>{cur.label}</Text>
            </View>
            <Text style={styles.pageTitle}>{cur.title}</Text>
            <Text style={[styles.pageQuote, { color: eraColor }]}>“</Text>
            <Text style={styles.pageBodyText}>{cur.body}</Text>

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
              {pages.map((p, i) => (
                <View
                  key={p.label}
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
              style={[styles.navBtnAccent, { opacity: storyPage === pages.length - 1 ? 0.4 : 1 }]}
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
  chapterMeta: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted3, marginTop: 4 },

  updateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: radius.r14,
    backgroundColor: colors.accent,
    marginTop: 16,
  },
  updateBtnText: { fontFamily: fonts.bold, fontSize: 15, color: colors.white },

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
  pageTitle: { fontFamily: fonts.extraBold, fontSize: 27, lineHeight: 36, letterSpacing: -0.5, color: colors.text, marginTop: 8 },
  pageQuote: { fontFamily: fonts.extraBold, fontSize: 34, lineHeight: 20, marginTop: 26, marginBottom: -6 },
  pageBodyText: { fontFamily: fonts.regular, fontSize: 18, lineHeight: 33, color: colors.storyBody },

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
