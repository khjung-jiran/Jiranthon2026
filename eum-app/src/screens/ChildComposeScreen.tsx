// 자녀 질문 작성 화면 - AI 추천 + 직접 작성

import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { Colors } from '../theme';
import { Header, Button } from '../components';
import { api } from '../api';
import { useApp } from '../store';
import { AIQuestion } from '../types';

export function ChildComposeScreen({
  onBack,
  onSent,
}: {
  onBack: () => void;
  onSent: () => void;
}) {
  const { member, family, members } = useApp();
  const [aiQuestions, setAiQuestions] = useState<AIQuestion[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [composeText, setComposeText] = useState('');
  const [targetId, setTargetId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const parents = members.filter(m => m.role === 'parent');

  useEffect(() => {
    api.getAIQuestions(undefined, 4)
      .then(res => { setAiQuestions(res.questions); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (parents.length > 0 && !targetId) setTargetId(parents[0].id);
  }, [parents]);

  const handleSend = async () => {
    const content = selected || composeText.trim();
    if (!content || !member || !family || !targetId) return;
    setSending(true);
    try {
      await api.createQuestion({
        family_id: family.id,
        content,
        from_member_id: member.id,
        to_member_id: targetId,
        source: selected ? 'auto' : 'manual',
      });
      onSent();
    } catch (e: any) {
      alert(e.message);
    }
    setSending(false);
  };

  return (
    <View style={styles.container}>
      <Header title="질문 보내기" onBack={onBack} />
      <ScrollView contentContainerStyle={{ padding: 22 }}>
        <Text style={styles.label}>누구에게 보낼까요?</Text>
        <View style={styles.targetRow}>
          {parents.map(t => (
            <TouchableOpacity
              key={t.id}
              style={[styles.targetBtn, targetId === t.id && styles.targetActive]}
              onPress={() => setTargetId(t.id)}
            >
              <Text style={{ color: targetId === t.id ? '#fff' : Colors.text, fontWeight: '700', fontSize: 16 }}>{t.name}</Text>
              <Text style={{ color: targetId === t.id ? '#fff' : Colors.textMuted, fontSize: 12 }}>부모님</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>✨ AI 추천 질문</Text>
        {loading ? (
          <ActivityIndicator color={Colors.childBlue} style={{ padding: 20 }} />
        ) : (
          aiQuestions.map((q, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.aiCard, selected === q.content && styles.aiCardActive]}
              onPress={() => { setSelected(q.content); setComposeText(''); }}
            >
              <Text style={{ flex: 1, fontSize: 16, lineHeight: 23, color: Colors.text }}>{q.content}</Text>
              <Text style={{ fontSize: 22, color: selected === q.content ? Colors.childBlue : '#C7CEC7' }}>
                {selected === q.content ? '✓' : '○'}
              </Text>
            </TouchableOpacity>
          ))
        )}

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>또는 직접 작성</Text>
          <View style={styles.dividerLine} />
        </View>

        <TextInput
          style={styles.composeInput}
          placeholder="부모님께 여쭤보고 싶은 이야기를 적어보세요"
          value={composeText}
          onChangeText={(t) => { setComposeText(t); setSelected(''); }}
          multiline
          textAlignVertical="top"
        />
      </ScrollView>
      <View style={styles.footer}>
        <Button
          title={`보내기`}
          onPress={handleSend}
          loading={sending}
          disabled={!selected && !composeText.trim()}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  label: { fontSize: 15, fontWeight: '800', color: Colors.textMuted, marginBottom: 12, marginTop: 6 },
  targetRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  targetBtn: { flex: 1, padding: 14, borderRadius: 16, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: '#fff' },
  targetActive: { backgroundColor: Colors.childBlue, borderColor: Colors.childBlue },
  aiCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 16, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: '#fff', marginBottom: 10, gap: 12 },
  aiCardActive: { borderColor: Colors.childBlue, backgroundColor: Colors.childBlueSoft },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 22 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { fontSize: 13, color: Colors.textMuted, fontWeight: '600' },
  composeInput: { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 16, padding: 16, fontSize: 16, minHeight: 96, backgroundColor: '#fff', lineHeight: 24 },
  footer: { padding: 22, borderTopWidth: 1, borderColor: '#EDEBE4', backgroundColor: Colors.bg },
});
