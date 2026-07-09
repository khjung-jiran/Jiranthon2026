// 자녀 대시보드

import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { Colors } from '../theme';
import { Avatar, Header } from '../components';
import { api } from '../api';
import { useApp } from '../store';
import { Question } from '../types';
import { useAudioPlayer } from '../hooks/useAudioPlayer';

const API_BASE = 'http://localhost:8000';

export function ChildDashboardScreen({
  onCompose,
  onResponses,
  onStory,
  onCapsule,
  onPoll,
}: {
  onCompose: () => void;
  onResponses: () => void;
  onStory: () => void;
  onCapsule?: () => void;
  onPoll?: () => void;
}) {
  const { member, family, members } = useApp();
  const [stats, setStats] = useState({ pending: 0, answered: 0 });
  const [recent, setRecent] = useState<Question[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const player = useAudioPlayer();

  const load = useCallback(async () => {
    if (!family || !member) return;
    setRefreshing(true);
    try {
      const s = await api.responseStats(family.id);
      setStats(s);
      const list = await api.listQuestions({ from_member_id: member.id });
      const answered = list.filter(q => q.status === 'answered');
      setRecent(answered);
    } catch (e) {
      console.error(e);
    }
    setRefreshing(false);
  }, [family, member]);

  useEffect(() => { load(); }, [load]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 22, paddingBottom: 90 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.modeLabel}>자녀 모드</Text>
          <Text style={styles.greeting}>안녕하세요, {member?.name}님</Text>
        </View>
        <Avatar initial={member?.name?.[0] || '나'} color={Colors.childBlue} size={44} />
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: '#B87A2E' }]}>{stats.pending}</Text>
          <Text style={styles.statLabel}>답변 대기</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: Colors.green }]}>{stats.answered}</Text>
          <Text style={styles.statLabel}>받은 답변</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>최근 도착한 이야기</Text>
      {recent.length > 0 ? (
        <TouchableOpacity
          style={styles.recentCard}
          onPress={async () => {
            try {
              const responses = await api.listResponses({ question_id: recent[0].id });
              if (responses.length > 0) {
                const r = responses[0];
                if (r.audio_file_path) {
                  const filename = r.audio_file_path.split(/[\\/]/).pop();
                  if (filename) {
                    await player.play(`${API_BASE}/api/audio/${filename}`);
                    return;
                  }
                }
                const ttsRes = await api.synthesize(r.content);
                await player.play(`${API_BASE}${ttsRes.audio_url}`);
              }
            } catch (e: any) { alert(e.message); }
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.recentQ}>Q. {recent[0].content}</Text>
          <Text style={styles.recentPlay}>{player.playing ? '⏸ 재생 중지' : '▶ 엄마/아빠 목소리로 듣기'}</Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.emptyHint}>아직 받은 답변이 없어요</Text>
      )}

      <TouchableOpacity style={styles.actionBtn} onPress={onCompose} activeOpacity={0.8}>
        <Text style={styles.actionBtnText}>✏️ 질문 보내기</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.subBtn} onPress={onStory} activeOpacity={0.8}>
        <Text style={styles.subBtnText}>📖 이야기책 열어보기</Text>
      </TouchableOpacity>
      {onCapsule && (
        <TouchableOpacity style={styles.subBtn} onPress={onCapsule} activeOpacity={0.8}>
          <Text style={styles.subBtnText}>⏳ 타임캡슐</Text>
        </TouchableOpacity>
      )}
      {onPoll && (
        <TouchableOpacity style={styles.subBtn} onPress={onPoll} activeOpacity={0.8}>
          <Text style={styles.subBtnText}>🗳 가족 투표</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.sectionTitle}>우리 가족</Text>
      <View style={styles.familyRow}>
        {members.map(m => (
          <View key={m.id} style={styles.familyMember}>
            <Avatar initial={m.name[0]} color={m.role === 'parent' ? Colors.olive : Colors.childBlue} size={52} />
            <Text style={styles.familyName}>{m.name}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 },
  modeLabel: { fontSize: 13, color: Colors.childBlue, fontWeight: '800', letterSpacing: 0.4 },
  greeting: { fontSize: 26, fontWeight: '800', marginTop: 5, letterSpacing: -0.5 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, backgroundColor: '#fff', borderWidth: 1.5, borderColor: Colors.border, borderRadius: 18, padding: 16 },
  statNum: { fontSize: 30, fontWeight: '800' },
  statLabel: { fontSize: 14, color: Colors.textSub, marginTop: 2, fontWeight: '600' },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: Colors.textMuted, letterSpacing: 0.3, marginTop: 24, marginBottom: 12 },
  recentCard: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: Colors.border, borderRadius: 20, padding: 18, gap: 12 },
  recentQ: { fontSize: 14, color: Colors.textSub, fontWeight: '600' },
  recentPlay: { fontSize: 16, color: Colors.childBlue, fontWeight: '700' },
  emptyHint: { fontSize: 15, color: Colors.textMuted, textAlign: 'center', paddingVertical: 20 },
  actionBtn: { height: 62, borderRadius: 18, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  actionBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  subBtn: { height: 56, borderRadius: 18, backgroundColor: '#EFEEE8', alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  subBtnText: { fontSize: 17, fontWeight: '700', color: Colors.text },
  familyRow: { flexDirection: 'row', gap: 16 },
  familyMember: { alignItems: 'center', gap: 7 },
  familyName: { fontSize: 12, color: Colors.textSub, fontWeight: '600' },
});
