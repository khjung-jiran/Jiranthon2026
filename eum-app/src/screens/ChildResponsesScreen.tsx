// 자녀 받은 이야기 화면

import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { Colors, EraColors } from '../theme';
import { Header, EmptyState, Badge } from '../components';
import { api } from '../api';
import { useApp } from '../store';
import { ResponseData } from '../types';
import { useAudioPlayer } from '../hooks/useAudioPlayer';

const API_BASE = 'http://localhost:8000';

export function ChildResponsesScreen({ onBack }: { onBack: () => void }) {
  const { family } = useApp();
  const [responses, setResponses] = useState<ResponseData[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const player = useAudioPlayer();

  const load = useCallback(async () => {
    if (!family) return;
    setRefreshing(true);
    try {
      const list = await api.listResponses({ family_id: family.id });
      setResponses(list);
    } catch (e) {
      console.error(e);
    }
    setRefreshing(false);
  }, [family]);

  useEffect(() => { load(); }, [load]);

  const handlePlay = async (item: ResponseData) => {
    if (playingId === item.id) {
      await player.stop();
      setPlayingId(null);
      return;
    }
    try {
      if (item.audio_file_path) {
        const filename = item.audio_file_path.split(/[\\/]/).pop();
        if (filename) {
          await player.play(`${API_BASE}/api/audio/${filename}`);
          setPlayingId(item.id);
          return;
        }
      }
      const result = await api.synthesize(item.content);
      await player.play(`${API_BASE}${result.audio_url}`);
      setPlayingId(item.id);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const renderItem = ({ item }: { item: ResponseData }) => (
    <View style={styles.card}>
      <Text style={styles.cardQ}>Q. 답변</Text>
      <Text style={styles.cardText}>"{item.content}"</Text>
      <View style={styles.cardFooter}>
        <TouchableOpacity style={styles.playBtn} onPress={() => handlePlay(item)}>
          {playingId === item.id ? (
            <Text style={styles.playBtnText}>⏸ 재생 중지</Text>
          ) : (
            <Text style={styles.playBtnText}>▶ 부모님 목소리 듣기</Text>
          )}
        </TouchableOpacity>
      </View>
      {item.era ? (
        <View style={styles.eraRow}>
          <Text style={styles.eraText}>📖 이야기책 · {item.era}에 담겼어요</Text>
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={styles.container}>
      <Header title="받은 이야기" subtitle="부모님의 답변" onBack={onBack} />
      <FlatList
        data={responses}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 22, gap: 14 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
        ListEmptyComponent={<EmptyState icon="📬" text="아직 받은 답변이 없어요" />}
        ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  card: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: Colors.border, borderRadius: 20, padding: 20, gap: 14 },
  cardQ: { fontSize: 14, color: Colors.textSub, fontWeight: '600' },
  cardText: { fontSize: 17, lineHeight: 27, color: Colors.text },
  cardFooter: { flexDirection: 'row', marginTop: 4 },
  playBtn: { backgroundColor: Colors.accentSoft, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 18, alignSelf: 'flex-start' },
  playBtnText: { fontSize: 15, fontWeight: '700', color: Colors.accent },
  eraRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  eraText: { fontSize: 13, color: Colors.olive, fontWeight: '700' },
});
