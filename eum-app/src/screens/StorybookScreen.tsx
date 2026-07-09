// 스토리북 화면 - 목차 + 페이지 뷰어

import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { Colors, EraColors } from '../theme';
import { Header } from '../components';
import { api } from '../api';
import { useApp } from '../store';
import { ResponseData } from '../types';
import { useAudioPlayer } from '../hooks/useAudioPlayer';

const API_BASE = 'http://localhost:8000';

const CHAPTERS = [
  { era: '유년기', years: '1955 – 1968', color: EraColors['유년기'] },
  { era: '청소년기', years: '1968 – 1974', color: EraColors['청소년기'] },
  { era: '청년 시절', years: '1974 – 1983', color: EraColors['청년 시절'] },
  { era: '부모 시절', years: '1983 – 지금', color: EraColors['부모 시절'] },
];

export function StorybookScreen({ onBack, onBooklet }: { onBack: () => void; onBooklet: () => void }) {
  const { family } = useApp();
  const [responses, setResponses] = useState<ResponseData[]>([]);
  const [view, setView] = useState<'toc' | 'page'>('toc');
  const [pageIndex, setPageIndex] = useState(0);
  const player = useAudioPlayer();

  const load = useCallback(async () => {
    if (!family) return;
    try {
      const list = await api.listResponses({ family_id: family.id });
      setResponses(list);
    } catch (e) { console.error(e); }
  }, [family]);

  useEffect(() => { load(); }, [load]);

  const byEra = CHAPTERS.map((ch, i) => ({
    ...ch,
    num: i + 1,
    stories: responses.filter(r => r.era === ch.era),
  }));
  const totalStories = responses.length;
  const flatStories = byEra.filter(ch => ch.stories.length > 0);

  if (view === 'page' && flatStories.length > 0) {
    const story = flatStories[pageIndex];
    if (story && story.stories.length > 0) {
      const s = story.stories[0];
      return (
        <View style={styles.container}>
          <Header title="이야기책" subtitle="엄마의 이야기" onBack={() => { setView('toc'); }} />
          <ScrollView contentContainerStyle={{ padding: 26, paddingBottom: 90 }}>
            <View style={[styles.eraBadge, { backgroundColor: story.color + '20' }]}>
              <Text style={[styles.eraBadgeText, { color: story.color }]}>{story.era}</Text>
            </View>
            <Text style={styles.storyYears}>{story.years}</Text>
            <Text style={styles.storyTitle}>{s.content.slice(0, 20)}...</Text>
            <Text style={styles.storyBody}>"{s.content}"</Text>
            <TouchableOpacity
              style={styles.playBtn}
              onPress={async () => {
                try {
                  if (s.audio_file_path) {
                    const filename = s.audio_file_path.split(/[\\/]/).pop();
                    if (filename) { await player.play(`${API_BASE}/api/audio/${filename}`); return; }
                  }
                  const ttsRes = await api.synthesize(s.content);
                  await player.play(`${API_BASE}${ttsRes.audio_url}`);
                } catch (e: any) { alert(e.message); }
              }}
            >
              <Text style={styles.playBtnText}>{player.playing ? '⏸ 재생 중지' : '▶ 엄마 목소리로 듣기'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.bookletBtn} onPress={onBooklet}>
              <Text style={styles.bookletBtnText}>📖 이 이야기로 소책자 만들기</Text>
            </TouchableOpacity>
          </ScrollView>
          <View style={styles.pageNav}>
            <TouchableOpacity
              style={[styles.navBtn, { opacity: pageIndex === 0 ? 0.4 : 1 }]}
              onPress={() => setPageIndex(Math.max(0, pageIndex - 1))}
              disabled={pageIndex === 0}
            >
              <Text style={{ fontSize: 24 }}>‹</Text>
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              {flatStories.map((_, i) => (
                <View key={i} style={[styles.dot, { width: i === pageIndex ? 22 : 8, backgroundColor: i === pageIndex ? story.color : '#E0D2BF' }]} />
              ))}
            </View>
            <TouchableOpacity
              style={[styles.navBtn, { backgroundColor: Colors.accent, opacity: pageIndex === flatStories.length - 1 ? 0.4 : 1 }]}
              onPress={() => setPageIndex(Math.min(flatStories.length - 1, pageIndex + 1))}
              disabled={pageIndex === flatStories.length - 1}
            >
              <Text style={{ fontSize: 24, color: '#fff' }}>›</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
  }

  return (
    <View style={styles.container}>
      <Header title="이야기책" subtitle="엄마의 이야기" onBack={onBack} />
      <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 90 }}>
        <View style={styles.heroCard}>
          <Text style={{ fontSize: 34 }}>📖</Text>
          <View>
            <Text style={styles.heroTitle}>엄마의 이야기</Text>
            <Text style={styles.heroSub}>모인 이야기 {totalStories}편 · 챕터 {CHAPTERS.length}개</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>목차</Text>
        {CHAPTERS.map((ch, i) => {
          const count = byEra[i].stories.length;
          return (
            <TouchableOpacity
              key={i}
              style={styles.chapterCard}
              onPress={() => {
                const idx = flatStories.findIndex(f => f.era === ch.era);
                if (idx >= 0) { setPageIndex(idx); setView('page'); }
              }}
              activeOpacity={0.8}
            >
              <View style={[styles.chapterNum, { backgroundColor: ch.color + '20' }]}>
                <Text style={[styles.chapterNumText, { color: ch.color }]}>{i + 1}장</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.chapterEra}>{ch.era}</Text>
                <Text style={styles.chapterMeta}>{ch.years} · 이야기 {count}편</Text>
              </View>
              {count > 0 ? <Text style={{ fontSize: 22, color: Colors.textMuted }}>›</Text> : <Text style={{ fontSize: 12, color: Colors.textMuted }}>모으는 중</Text>}
            </TouchableOpacity>
          );
        })}
        <Text style={styles.hint}>답변이 모일수록 챕터가 두꺼워져요</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  heroCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: Colors.accentStrong, borderRadius: 20, padding: 20 },
  heroTitle: { fontSize: 18, fontWeight: '800', color: '#F7EFE1' },
  heroSub: { fontSize: 13, color: '#F7EFE1', opacity: 0.8, marginTop: 3 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: Colors.textMuted, letterSpacing: 0.3, marginTop: 20, marginBottom: 12 },
  chapterCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', borderWidth: 1.5, borderColor: Colors.border, borderRadius: 20, padding: 18, marginBottom: 11 },
  chapterNum: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  chapterNumText: { fontSize: 14, fontWeight: '800' },
  chapterEra: { fontSize: 17, fontWeight: '800' },
  chapterMeta: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },
  hint: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', marginTop: 16, lineHeight: 20 },
  eraBadge: { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  eraBadgeText: { fontSize: 14, fontWeight: '800' },
  storyYears: { fontSize: 14, color: Colors.textMuted, fontWeight: '600', marginTop: 14 },
  storyTitle: { fontSize: 27, fontWeight: '800', lineHeight: 37, letterSpacing: -0.5, marginTop: 8 },
  storyBody: { fontSize: 18, lineHeight: 34, color: '#4C3C2B', marginTop: 20 },
  playBtn: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18, paddingVertical: 13, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: '#fff', marginTop: 26 },
  playBtnText: { fontSize: 15, fontWeight: '700', color: Colors.text },
  bookletBtn: { marginTop: 12, padding: 14, borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#D3C3AA', alignItems: 'center' },
  bookletBtnText: { fontSize: 15, fontWeight: '700', color: Colors.textSub },
  pageNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderTopWidth: 1, borderColor: '#EEE2D1', backgroundColor: Colors.bg },
  navBtn: { width: 52, height: 52, borderRadius: 15, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  dot: { height: 8, borderRadius: 6 },
});
