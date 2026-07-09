// 부모 질문 목록 화면

import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Colors, AvatarColors } from '../theme';
import { Avatar, Badge, EmptyState, Header } from '../components';
import { api } from '../api';
import { useApp } from '../store';
import { Question } from '../types';

export function ParentQuestionListScreen({ onOpenQuestion }: { onOpenQuestion: (id: string) => void }) {
  const { member } = useApp();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!member) return;
    setRefreshing(true);
    try {
      const list = await api.listQuestions({ to_member_id: member.id });
      setQuestions(list);
    } catch (e) {
      console.error(e);
    }
    setRefreshing(false);
  }, [member]);

  useEffect(() => { load(); }, [load]);

  const pending = questions.filter(q => q.status === 'pending');
  const answered = questions.filter(q => q.status === 'answered');

  const renderItem = ({ item }: { item: Question }) => (
    <TouchableOpacity style={styles.qCard} onPress={() => onOpenQuestion(item.id)} activeOpacity={0.8}>
      <View style={styles.qHeader}>
        <Avatar initial="?" color={Colors.accent} size={38} />
        <Text style={styles.qByline}>질문</Text>
      </View>
      <Text style={styles.qText}>{item.content}</Text>
      {item.status === 'pending' ? (
        <Badge label="답변 기다리는 중" bg="#F6ECDA" fg="#9A6B1E" icon="⏳" />
      ) : (
        <Badge label="답변 완료" bg="#E7F0EA" fg={Colors.green} icon="✓" />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header title="받은 질문" subtitle="자녀들이 궁금해하는 이야기예요" />
      <FlatList
        data={questions}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 22, gap: 14, paddingBottom: 90 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
        ListEmptyComponent={<EmptyState icon="📭" text="아직 받은 질문이 없어요" />}
        ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  qCard: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: Colors.border, borderRadius: 22, padding: 22, gap: 15 },
  qHeader: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  qByline: { fontSize: 15, color: Colors.textSub, fontWeight: '500' },
  qText: { fontSize: 22, lineHeight: 33, fontWeight: '700', letterSpacing: -0.3 },
});
