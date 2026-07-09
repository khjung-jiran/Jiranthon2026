import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, TextInput, ScrollView, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ScreenContainer, Overlay, Icon } from '../../components';
import { colors, fonts, radius } from '../../theme';
import { useStore } from '../../store/useStore';
import * as api from '../../api';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Compose'>;

export function ComposeScreen({ navigation }: Props) {
  const target = useStore((s) => s.target);
  const setTarget = useStore((s) => s.setTarget);
  const showToast = useStore((s) => s.showToast);

  const [composeText, setComposeText] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [aiQuestions, setAiQuestions] = useState<string[]>([]);
  const [targetOptions, setTargetOptions] = useState<{ name: string; rel: string }[]>([]);

  useEffect(() => {
    const session = api.getSession();
    if (!session) return;
    api.listMembers(session.familyId).then((members) => {
      setTargetOptions(members.filter((m) => m.role === 'parent').map((m) => ({
        name: m.name,
        rel: m.role === 'parent' ? '어머니/아버지' : '자녀',
      })));
    }).catch(() => {});
    api.getAiSuggestions({ count: 4 }).then((r) => setAiQuestions(r.questions.map((q) => typeof q === 'string' ? q : q.content))).catch(() => {});
  }, []);

  const canSend = composeText.trim().length > 0 && !sending;

  const sendQuestion = async () => {
    if (!canSend) return;
    setSending(true);
    try {
      const session = api.getSession();
      if (session) {
        const targetMember = await api.listMembers(session.familyId);
        const match = targetMember.find((m) => m.name === target || target.includes(m.name));
        await api.createQuestion({
          family_id: session.familyId,
          content: composeText.trim(),
          source: 'manual',
          from_member_id: session.memberId,
          to_member_id: match?.id ?? targetMember.find((m) => m.role === 'parent')?.id ?? session.memberId,
        });
      }
    } catch (e) {
      console.warn('[eum] 질문 전송 실패 (로컬만 반영):', e);
    }
    setSent(true);
    setSending(false);
  };
  const closeSent = () => {
    setSent(false);
    setComposeText('');
    navigation.goBack();
  };

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      {/* 상단 바 */}
      <View style={styles.topBar}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow_back" size={26} color={colors.text} />
        </Pressable>
        <Text style={styles.topTitle}>질문 보내기</Text>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        {/* 대상 선택 */}
        <Text style={[styles.groupLabel, styles.groupLabelFirst]}>누구에게 보낼까요?</Text>
        <View style={styles.targetRow}>
          {targetOptions.map((t) => {
            const on = target === t.name;
            return (
              <Pressable
                key={t.name}
                style={[
                  styles.targetBtn,
                  {
                    borderColor: on ? colors.blue : colors.border2,
                    backgroundColor: on ? colors.neutral : colors.surface,
                  },
                ]}
                onPress={() => setTarget(t.name)}
              >
                <Text style={[styles.targetName, { color: on ? colors.blue : colors.text2 }]}>{t.name}</Text>
                <Text style={styles.targetRel}>{t.rel}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* AI 추천 질문 */}
        <View style={[styles.groupLabelRow, { marginTop: 24, marginBottom: 12 }]}>
          <Icon name="auto_awesome" size={19} color={colors.blue} />
          <Text style={styles.groupLabelInline}>AI 추천 질문</Text>
        </View>
        <View style={styles.aiList}>
          {aiQuestions.map((q) => {
            const sel = composeText === q;
            return (
              <Pressable
                key={q}
                style={[
                  styles.aiItem,
                  {
                    borderColor: sel ? colors.blue : colors.border2,
                    backgroundColor: sel ? colors.neutral : colors.surface,
                  },
                ]}
                onPress={() => setComposeText(q)}
              >
                <Text style={styles.aiItemText}>{q}</Text>
                <Icon
                  name={sel ? 'check_circle' : 'radio_button_unchecked'}
                  size={22}
                  color={sel ? colors.blue : colors.textFaint4}
                />
              </Pressable>
            );
          })}
        </View>

        {/* 구분선 */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>또는 직접 작성</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* 직접 작성 */}
        <TextInput
          style={styles.textarea}
          value={composeText}
          onChangeText={setComposeText}
          placeholder="부모님께 여쭤보고 싶은 이야기를 적어보세요"
          placeholderTextColor={colors.textFaint}
          multiline
          textAlignVertical="top"
        />
      </ScrollView>

      {/* 하단 전송 */}
      <View style={styles.footer}>
        <Pressable
          style={[styles.sendBtn, { backgroundColor: canSend ? colors.accent : colors.border4 }]}
          onPress={sendQuestion}
        >
          <Icon name="send" size={23} color={canSend ? colors.white : colors.textFaint} />
          <Text style={[styles.sendBtnText, { color: canSend ? colors.white : colors.textFaint }]}>
            {target}께 보내기
          </Text>
        </Pressable>
      </View>

      {/* 전송 완료 모달 */}
      <Overlay visible={sent} onClose={closeSent} scrim={colors.scrimLight} padding={34} cardStyle={styles.modalCard}>
        <View style={styles.modalIconCircle}>
          <Icon name="send" size={42} color={colors.accent} />
        </View>
        <Text style={styles.modalTitle}>질문을 보냈어요</Text>
        <Text style={styles.modalText}>
          {target}께 전달됐어요.{'\n'}답변이 도착하면 알려드릴게요.
        </Text>
        <Pressable style={styles.modalBtn} onPress={closeSent}>
          <Text style={styles.modalBtnText}>확인</Text>
        </Pressable>
      </Overlay>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },

  topBar: {
    paddingVertical: 10,
    paddingHorizontal: 20,
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
  topTitle: { fontFamily: fonts.extraBold, fontSize: 19, color: colors.text },

  body: { paddingVertical: 10, paddingHorizontal: 22 },

  groupLabel: {
    fontFamily: fonts.extraBold,
    fontSize: 15,
    color: colors.textFaint2,
    marginBottom: 12,
    marginLeft: 2,
  },
  groupLabelFirst: { marginTop: 6 },
  groupLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 2 },
  groupLabelInline: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.textFaint2 },

  targetRow: { flexDirection: 'row', gap: 10 },
  targetBtn: {
    flex: 1,
    padding: 14,
    borderRadius: radius.r16,
    borderWidth: 1.5,
  },
  targetName: { fontFamily: fonts.bold, fontSize: 16 },
  targetRel: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted3, marginTop: 2 },

  aiList: { gap: 10 },
  aiItem: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: radius.r16,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  aiItemText: { flex: 1, fontFamily: fonts.regular, fontSize: 16, lineHeight: 23, color: colors.text2 },

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 22, marginBottom: 14 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border2 },
  dividerText: { fontFamily: fonts.medium, fontSize: 13, color: colors.textFaint },

  textarea: {
    width: '100%',
    minHeight: 96,
    padding: 16,
    borderRadius: radius.r16,
    borderWidth: 1.5,
    borderColor: colors.border2,
    backgroundColor: colors.surface,
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
  },

  footer: {
    paddingTop: 14,
    paddingHorizontal: 22,
    paddingBottom: 22,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bgScreen,
  },
  sendBtn: {
    width: '100%',
    height: 60,
    borderRadius: radius.r18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  sendBtnText: { fontFamily: fonts.extraBold, fontSize: 18 },

  modalCard: { paddingVertical: 32, paddingHorizontal: 26, alignItems: 'center' },
  modalIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontFamily: fonts.extraBold, fontSize: 22, color: colors.text },
  modalText: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textMuted,
    lineHeight: 24,
    marginTop: 10,
    textAlign: 'center',
  },
  modalBtn: {
    width: '100%',
    height: 56,
    marginTop: 24,
    borderRadius: radius.r16,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnText: { fontFamily: fonts.extraBold, fontSize: 17, color: colors.white },
});

export default ComposeScreen;
