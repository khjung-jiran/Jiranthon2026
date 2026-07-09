// 가족 투표 화면

import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { Colors } from '../theme';
import { Header, EmptyState } from '../components';
import { api } from '../api';
import { useApp } from '../store';
import { Poll } from '../types';

export function PollScreen({ onBack }: { onBack: () => void }) {
  const { family, member } = useApp();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [votedPoll, setVotedPoll] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!family) return;
    setRefreshing(true);
    try {
      const list = await api.listPolls(family.id);
      setPolls(list);
    } catch (e) { console.error(e); }
    setRefreshing(false);
  }, [family]);

  useEffect(() => { load(); }, [load]);

  const handleVote = async (pollId: string, optionId: string) => {
    if (!member) return;
    try {
      await api.vote(pollId, member.id, optionId);
      setVotedPoll(pollId);
      load();
    } catch (e: any) { alert(e.message); }
  };

  return (
    <View style={styles.container}>
      <Header title="가족 투표" onBack={onBack} />
      <ScrollView
        contentContainerStyle={{ padding: 22, paddingBottom: 90 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
      >
        {polls.length === 0 ? (
          <EmptyState icon="🗳" text="진행 중인 투표가 없어요" />
        ) : (
          polls.map(poll => {
            const total = poll.options.reduce((a, o) => a + o.vote_count, 0);
            return (
              <View key={poll.id} style={styles.pollCard}>
                <Text style={styles.pollTitle}>{poll.title}</Text>
                <Text style={styles.pollMeta}>{total}명 참여</Text>
                <View style={{ gap: 10, marginTop: 16 }}>
                  {poll.options.map(opt => {
                    const pct = total ? Math.round((opt.vote_count / total) * 100) : 0;
                    const isVoted = votedPoll === poll.id;
                    return (
                      <TouchableOpacity
                        key={opt.id}
                        style={[styles.optBtn, isVoted && styles.optBtnVoted]}
                        onPress={() => handleVote(poll.id, opt.id)}
                      >
                        <Text style={{ fontSize: 22, color: Colors.purple }}>{isVoted ? '✓' : '○'}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.optLabel}>{opt.label}</Text>
                          {isVoted ? (
                            <View style={styles.optBarRow}>
                              <View style={styles.optBarBg}>
                                <View style={[styles.optBarFill, { width: `${pct}%` }]} />
                              </View>
                              <Text style={styles.optPct}>{pct}%</Text>
                            </View>
                          ) : null}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <Text style={styles.pollHint}>
                  {votedPoll === poll.id ? '다른 항목을 누르면 투표를 바꿀 수 있어요' : '하나를 선택하면 가족의 선택이 보여요'}
                </Text>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  pollCard: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: Colors.border, borderRadius: 20, padding: 20, marginBottom: 14 },
  pollTitle: { fontSize: 23, fontWeight: '800', lineHeight: 32 },
  pollMeta: { fontSize: 14, color: Colors.textMuted, marginTop: 10 },
  optBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 16, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: '#fff' },
  optBtnVoted: { borderColor: Colors.purple, backgroundColor: Colors.purple + '10' },
  optLabel: { fontSize: 16, fontWeight: '700' },
  optBarRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 9 },
  optBarBg: { flex: 1, height: 7, borderRadius: 6, backgroundColor: '#EFEEE8', overflow: 'hidden' },
  optBarFill: { height: '100%', borderRadius: 6, backgroundColor: Colors.purple },
  optPct: { fontSize: 13, fontWeight: '800', color: Colors.purple, minWidth: 34, textAlign: 'right' },
  pollHint: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', marginTop: 16, lineHeight: 20 },
});
