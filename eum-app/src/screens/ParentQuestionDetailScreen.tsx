// 부모 질문 상세 + 답변 화면

import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Colors } from '../theme';
import { Header, Button } from '../components';
import { api } from '../api';
import { useApp } from '../store';
import { Question } from '../types';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { useAudioPlayer } from '../hooks/useAudioPlayer';

const API_BASE = 'http://localhost:8000';

export function ParentQuestionDetailScreen({
  questionId,
  onBack,
  onAnswered,
}: {
  questionId: string;
  onBack: () => void;
  onAnswered: () => void;
}) {
  const { member } = useApp();
  const [question, setQuestion] = useState<Question | null>(null);
  const [screen, setScreen] = useState<'detail' | 'respond'>('detail');
  const [scribe, setScribe] = useState(false);
  const [scribeText, setScribeText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [transcribing, setTranscribing] = useState(false);
  const [audioFilePath, setAudioFilePath] = useState<string | null>(null);

  const recorder = useAudioRecorder();
  const player = useAudioPlayer();

  useEffect(() => {
    api.getQuestion(questionId).then(q => { setQuestion(q); setLoading(false); }).catch(() => setLoading(false));
  }, [questionId]);

  const handlePlayQuestion = async () => {
    if (!question) return;
    try {
      const result = await api.synthesize(question.content);
      await player.play(`${API_BASE}${result.audio_url}`);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleRecordToggle = async () => {
    if (recorder.state === 'recording') {
      const recordedUri = await recorder.stopRecording();
      if (recordedUri) {
        setTranscribing(true);
        try {
          const uploadRes = await api.uploadAudio(recordedUri);
          const sttRes = await api.transcribe(uploadRes.file_path, 'whisper');
          setTranscript(sttRes.text);
          setAudioFilePath(uploadRes.file_path);
        } catch (e: any) {
          alert(`음성 인식 실패: ${e.message}`);
        }
        setTranscribing(false);
      }
    } else {
      setTranscript('');
      setAudioFilePath(null);
      await recorder.startRecording();
    }
  };

  const handleSend = async () => {
    if (!member || !question) return;
    const content = scribe ? scribeText.trim() : transcript.trim();
    if (!content) return;
    setSubmitting(true);
    try {
      await api.createResponse({
        question_id: question.id,
        member_id: member.id,
        content,
        input_method: scribe ? 'text' : 'stt',
        audio_file_path: audioFilePath || undefined,
        transcript: scribe ? scribeText.trim() : transcript.trim(),
      });
      onAnswered();
    } catch (e: any) {
      alert(e.message);
    }
    setSubmitting(false);
  };

  if (loading) return <View style={styles.container}><ActivityIndicator size="large" color={Colors.accent} /></View>;
  if (!question) return <View style={styles.container}><Text>질문을 찾을 수 없습니다</Text></View>;

  if (screen === 'detail') {
    return (
      <View style={styles.container}>
        <Header title="질문 상세" onBack={onBack} />
        <View style={styles.detailBody}>
          <Text style={styles.detailQ}>{question.content}</Text>
        </View>
        <View style={styles.detailFooter}>
          <Button
            title={player.playing ? '⏸ 재생 중지' : player.loading ? '⏳ 불러오는 중...' : '🔊 질문 듣기'}
            onPress={player.playing ? player.stop : handlePlayQuestion}
            loading={player.loading}
            color="#fff"
            textColor={Colors.accent}
            style={{ borderWidth: 1.5, borderColor: Colors.accent }}
          />
          <Button title="🎙 답변하기" onPress={() => setScreen('respond')} />
        </View>
      </View>
    );
  }

  const canSend = scribe ? scribeText.trim().length > 0 : transcript.trim().length > 0;

  return (
    <View style={styles.container}>
      <Header title="답변하기" onBack={() => setScreen('detail')} />
      <View style={styles.respondBody}>
        <View style={styles.qBox}>
          <Text style={styles.qBoxText}>Q. {question.content}</Text>
        </View>
        <View style={styles.recArea}>
          {transcribing ? (
            <>
              <ActivityIndicator size="large" color={Colors.accent} />
              <Text style={styles.recHint}>음성을 텍스트로 변환하는 중...</Text>
            </>
          ) : (
            <>
              <Text style={styles.recHint}>
                {recorder.state === 'recording' ? '녹음 중입니다...\n말씀을 멈추시려면 버튼을 눌러주세요' : '아래 버튼을 누르고\n편하게 말씀해 주세요'}
              </Text>
              <TouchableOpacity
                style={[styles.recBtn, recorder.state === 'recording' && styles.recBtnActive]}
                onPress={handleRecordToggle}
              >
                <Text style={{ fontSize: 48 }}>{recorder.state === 'recording' ? '⏹' : '🎙'}</Text>
              </TouchableOpacity>
              {recorder.state === 'recording' && <View style={styles.recPulse} />}
            </>
          )}
        </View>
        {transcript ? (
          <View style={styles.transcriptBox}>
            <Text style={styles.transcriptLabel}>📝 변환된 텍스트</Text>
            <Text style={styles.transcriptText}>{transcript}</Text>
          </View>
        ) : null}
        <TouchableOpacity onPress={() => setScribe(!scribe)} style={styles.scribeToggle}>
          <Text style={styles.scribeLabel}>{scribe ? '음성 답변으로 돌아가기' : '자녀가 대신 글로 입력하기 (대필)'}</Text>
        </TouchableOpacity>
        {scribe ? (
          <TextInput
            style={styles.scribeInput}
            placeholder="부모님이 말씀하신 내용을 대신 적어주세요"
            value={scribeText}
            onChangeText={setScribeText}
            multiline
            textAlignVertical="top"
          />
        ) : null}
      </View>
      <View style={styles.respondFooter}>
        <Button title="답변 보내기" onPress={handleSend} loading={submitting} disabled={!canSend} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  detailBody: { flex: 1, padding: 30, alignItems: 'center', justifyContent: 'center' },
  detailQ: { fontSize: 26, lineHeight: 40, fontWeight: '800', textAlign: 'center' },
  detailFooter: { padding: 22, gap: 12, borderTopWidth: 1, borderColor: '#EDEBE4', backgroundColor: Colors.bg },
  respondBody: { flex: 1, padding: 26 },
  qBox: { backgroundColor: '#EFEEE8', borderRadius: 16, padding: 16, marginBottom: 20 },
  qBoxText: { fontSize: 17, lineHeight: 25, color: '#4A544E', fontWeight: '600' },
  recArea: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 26 },
  recHint: { fontSize: 18, color: Colors.textSub, textAlign: 'center', lineHeight: 28 },
  recBtn: { width: 104, height: 104, borderRadius: 52, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },
  recBtnActive: { backgroundColor: Colors.red },
  recPulse: { position: 'absolute', width: 120, height: 120, borderRadius: 60, borderWidth: 2, borderColor: Colors.red + '40' },
  transcriptBox: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: Colors.accent, borderRadius: 16, padding: 16, marginBottom: 16 },
  transcriptLabel: { fontSize: 14, fontWeight: '800', color: Colors.accent, marginBottom: 8 },
  transcriptText: { fontSize: 16, lineHeight: 26, color: Colors.text },
  scribeToggle: { paddingVertical: 6, alignItems: 'center' },
  scribeLabel: { fontSize: 15, fontWeight: '700', color: Colors.textSub },
  scribeInput: { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 16, padding: 16, fontSize: 17, minHeight: 110, backgroundColor: '#fff', marginTop: 10 },
  respondFooter: { padding: 22, borderTopWidth: 1, borderColor: '#EDEBE4', backgroundColor: Colors.bg },
});
