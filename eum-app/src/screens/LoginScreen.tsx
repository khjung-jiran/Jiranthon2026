// 로그인 화면 - 디자인 v2 정확 반영

import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput } from 'react-native';
import { Colors } from '../theme';
import { api } from '../api';
import { useApp } from '../store';

export function LoginScreen() {
  const { setFamily, setMember } = useApp();
  const [mode, setMode] = useState<'select' | 'join' | 'create'>('select');
  const [inviteCode, setInviteCode] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [memberName, setMemberName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'parent' | 'child'>('parent');
  const [loading, setLoading] = useState(false);

  const startParent = () => { setRole('parent'); setMode('join'); };
  const startChild = () => { setRole('child'); setMode('join'); };

  const handleJoin = async () => {
    if (!inviteCode.trim() || !memberName.trim() || !username.trim() || !password.trim()) return;
    setLoading(true);
    try {
      const family = await api.joinFamily(inviteCode.trim());
      const member = await api.createMember({
        family_id: family.id, name: memberName.trim(), role,
        username: username.trim(), password: password.trim(),
      });
      setFamily(family);
      setMember(member);
    } catch (e: any) { alert(e.message); }
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!familyName.trim() || !memberName.trim() || !username.trim() || !password.trim()) return;
    setLoading(true);
    try {
      const family = await api.createFamily(familyName.trim());
      const member = await api.createMember({
        family_id: family.id, name: memberName.trim(), role,
        username: username.trim(), password: password.trim(),
      });
      setFamily(family);
      setMember(member);
    } catch (e: any) { alert(e.message); }
    setLoading(false);
  };

  if (mode === 'select') {
    return (
      <View style={styles.container}>
        <View style={styles.logoArea}>
          <View style={styles.logoBars}>
            <View style={[styles.bar, { height: 26 }]} />
            <View style={[styles.bar, { height: 52 }]} />
            <View style={[styles.bar, { height: 36, backgroundColor: '#7C8A55' }]} />
            <View style={[styles.bar, { height: 58 }]} />
            <View style={[styles.bar, { height: 30, backgroundColor: '#7C8A55' }]} />
          </View>
          <Text style={styles.logoText}>이음</Text>
          <Text style={styles.logoSub}>목소리로 잇는 우리 가족 이야기{'\n'}AI가 부모님의 기억을 이야기로 모아드려요</Text>
        </View>
        <View style={styles.btnArea}>
          <Text style={styles.btnLabel}>어떻게 시작할까요?</Text>
          <TouchableOpacity style={styles.roleBtn} onPress={startParent} activeOpacity={0.8}>
            <View style={[styles.roleIcon, { backgroundColor: Colors.accentSoft }]}>
              <Text style={{ fontSize: 30 }}>🧓</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.roleTitle}>부모님으로 시작</Text>
              <Text style={styles.roleSub}>받은 질문에 목소리로 답해요</Text>
            </View>
            <Text style={{ fontSize: 24, color: '#C4B398' }}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.roleBtn} onPress={startChild} activeOpacity={0.8}>
            <View style={[styles.roleIcon, { backgroundColor: '#ECEAE4' }]}>
              <Text style={{ fontSize: 30 }}>👨‍👩‍👧</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.roleTitle}>자녀로 시작</Text>
              <Text style={styles.roleSub}>질문을 보내고 이야기를 모아요</Text>
            </View>
            <Text style={{ fontSize: 24, color: '#C4B398' }}>›</Text>
          </TouchableOpacity>
          <Text style={styles.bottomHint}>가족 초대 코드로 함께 시작할 수 있어요</Text>
          <TouchableOpacity onPress={() => setMode('create')} style={{ marginTop: 12 }}>
            <Text style={styles.createLink}>새 가족 만들기</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (mode === 'create') {
    return (
      <View style={styles.container}>
        <Text style={styles.formTitle}>새 가족 만들기</Text>
        <TextInput style={styles.input} placeholder="가족 이름 (예: 김씨 가족)" value={familyName} onChangeText={setFamilyName} />
        <TextInput style={styles.input} placeholder="내 이름" value={memberName} onChangeText={setMemberName} />
        <TextInput style={styles.input} placeholder="아이디" value={username} onChangeText={setUsername} autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="비밀번호" value={password} onChangeText={setPassword} secureTextEntry />
        <Text style={styles.roleHint}>역할: {role === 'parent' ? '부모님' : '자녀'}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={[styles.roleChip, role === 'parent' && styles.roleChipActive]} onPress={() => setRole('parent')}>
            <Text style={{ color: role === 'parent' ? '#fff' : Colors.text }}>부모님</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.roleChip, role === 'child' && styles.roleChipActive]} onPress={() => setRole('child')}>
            <Text style={{ color: role === 'child' ? '#fff' : Colors.text }}>자녀</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.submitBtn} onPress={handleCreate} disabled={loading}>
          <Text style={styles.submitText}>{loading ? '생성 중...' : '가족 만들기'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setMode('select')}>
          <Text style={styles.backLink}>← 돌아가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.formTitle}>가족 참여</Text>
      <Text style={styles.roleHint}>역할: {role === 'parent' ? '부모님' : '자녀'}</Text>
      <TextInput style={styles.input} placeholder="초대 코드 (8자리)" value={inviteCode} onChangeText={setInviteCode} autoCapitalize="characters" />
      <TextInput style={styles.input} placeholder="내 이름" value={memberName} onChangeText={setMemberName} />
      <TextInput style={styles.input} placeholder="아이디" value={username} onChangeText={setUsername} autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="비밀번호" value={password} onChangeText={setPassword} secureTextEntry />
      <TouchableOpacity style={styles.submitBtn} onPress={handleJoin} disabled={loading}>
        <Text style={styles.submitText}>{loading ? '참여 중...' : '참여하기'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setMode('select')}>
        <Text style={styles.backLink}>← 돌아가기</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, paddingHorizontal: 30, justifyContent: 'center' },
  logoArea: { alignItems: 'center', marginBottom: 40 },
  logoBars: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 58, marginBottom: 30 },
  bar: { width: 7, borderRadius: 4, backgroundColor: Colors.accent },
  logoText: { fontSize: 38, fontWeight: '800', letterSpacing: -1.5, color: Colors.text },
  logoSub: { fontSize: 16, color: '#7C6A54', marginTop: 14, textAlign: 'center', lineHeight: 26 },
  btnArea: { gap: 14, paddingBottom: 38 },
  btnLabel: { fontSize: 13, fontWeight: '700', color: '#A8967E', letterSpacing: 0.4, paddingLeft: 4 },
  roleBtn: { flexDirection: 'row', alignItems: 'center', gap: 15, padding: 19, borderRadius: 20, borderWidth: 1.5, borderColor: '#E9DBC9', backgroundColor: '#fff' },
  roleIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  roleTitle: { fontSize: 19, fontWeight: '700', color: Colors.text },
  roleSub: { fontSize: 14, color: '#8C7961', marginTop: 3 },
  bottomHint: { textAlign: 'center', fontSize: 13, color: '#B5A48A', marginTop: 8 },
  createLink: { textAlign: 'center', fontSize: 14, fontWeight: '700', color: Colors.accent, marginTop: 4 },
  formTitle: { fontSize: 26, fontWeight: '800', marginBottom: 20, color: Colors.text },
  input: { borderWidth: 1.5, borderColor: '#E9DBC9', borderRadius: 16, padding: 16, fontSize: 17, backgroundColor: '#fff', marginBottom: 12, color: Colors.text },
  roleHint: { fontSize: 15, fontWeight: '700', color: Colors.textMuted, marginBottom: 8 },
  roleChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, borderWidth: 1.5, borderColor: '#E9DBC9', backgroundColor: '#fff' },
  roleChipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  submitBtn: { height: 60, borderRadius: 18, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  submitText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  backLink: { textAlign: 'center', color: Colors.textMuted, marginTop: 16 },
});
