import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import type { TextInputProps } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ScreenContainer,
  Header,
  Button,
  SectionLabel,
  Overlay,
  Icon,
} from '../../components';
import { colors, fonts, radius, spacing, tint } from '../../theme';
import { useStore } from '../../store/useStore';
import * as api from '../../api';
import { ApiError } from '../../api';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Auth'>;

type AuthMode = 'signup' | 'login';
type FamMode = 'create' | 'join';

/**
 * 가입/로그인 (Auth) — 원본 디자인에는 없는 신규 화면.
 * 로그인 화면(sLogin)에서 역할 선택 후 진입한다. 디자인은 원본의 언어를 그대로 확장:
 *  - 히어로: 로그인 화면의 역할 아이콘(elderly/accentSoft · family_restroom/neutral)을 재사용
 *  - 입력: 캡슐 작성 화면(sCapsNew)의 입력 패턴 + 부모 접근성(높이 56 / 폰트 17 / radius 16)
 *  - 가족 선택: 응답 화면류의 radio 선택 카드 패턴 (radio_button_unchecked ↔ check_circle)
 * 성공 시 store.authLogin(서버 세션), 서버 미응답 시 store.login(role) 오프라인 폴백.
 */
export function AuthScreen({ route, navigation }: Props) {
  const role = route.params.role;
  const isParent = role === 'parent';

  const authLogin = useStore((s) => s.authLogin);
  const demoLogin = useStore((s) => s.login);
  const showToast = useStore((s) => s.showToast);

  const [mode, setMode] = useState<AuthMode>('signup');
  const [famMode, setFamMode] = useState<FamMode>('create');

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  /** 가족을 새로 만든 가입 성공 — 초대코드 안내 모달 후 입장 */
  const [pendingAuth, setPendingAuth] = useState<api.AuthResult | null>(null);

  const switchMode = (m: AuthMode) => {
    if (m === mode) return;
    setMode(m);
    setError(null);
    setOffline(false);
  };

  const applyError = (e: unknown) => {
    if (e instanceof ApiError && e.status !== null) {
      if (e.status === 409) setError('아이디가 이미 사용 중이에요');
      else if (mode === 'signup' && e.status === 404) setError('초대 코드를 찾을 수 없어요');
      else if (e.status === 401) setError('아이디 또는 비밀번호가 맞지 않아요');
      else setError('요청을 처리하지 못했어요 — 잠시 후 다시 시도해 주세요');
    } else {
      // 네트워크/타임아웃 — 오프라인 폴백 안내
      setError('서버에 연결할 수 없어요 — 오프라인으로 계속할 수 있어요');
      setOffline(true);
    }
  };

  const submit = async () => {
    if (loading) return;
    setError(null);
    setOffline(false);

    if (mode === 'signup') {
      if (!name.trim()) return setError('이름을 입력해 주세요');
      if (!username.trim()) return setError('아이디를 입력해 주세요');
      if (!password) return setError('비밀번호를 입력해 주세요');
      if (famMode === 'create' && !familyName.trim()) return setError('가족 이름을 입력해 주세요');
      if (famMode === 'join' && !inviteCode.trim()) return setError('초대 코드를 입력해 주세요');
    } else {
      if (!username.trim()) return setError('아이디를 입력해 주세요');
      if (!password) return setError('비밀번호를 입력해 주세요');
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        const auth = await api.signup({
          name: name.trim(),
          username: username.trim(),
          password,
          role,
          familyName: famMode === 'create' ? familyName.trim() : undefined,
          inviteCode: famMode === 'join' ? inviteCode.trim().toUpperCase() : undefined,
        });
        if (auth.createdFamily && auth.inviteCode) {
          setPendingAuth(auth); // 초대코드 안내 모달 → 확인 시 입장
        } else {
          showToast(`${auth.member.name}님, 가족과 연결되었어요`);
          authLogin(auth);
        }
      } else {
        const auth = await api.signin({ username: username.trim(), password });
        showToast(`다시 만나 반가워요, ${auth.member.name}님`);
        authLogin(auth);
      }
    } catch (e) {
      applyError(e);
    } finally {
      setLoading(false);
    }
  };

  const continueOffline = () => {
    showToast('오프라인으로 시작해요 — 예시 데이터가 보여요');
    demoLogin(role);
  };

  const enterFromModal = () => {
    if (!pendingAuth) return;
    showToast(`${pendingAuth.member.name}님, 환영해요`);
    authLogin(pendingAuth);
  };

  const submitLabel =
    mode === 'signup'
      ? loading
        ? '가입하는 중…'
        : '이음 시작하기'
      : loading
        ? '로그인하는 중…'
        : '로그인';

  return (
    <ScreenContainer>
      <Header onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={s.flex}
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* 히어로 — 로그인 화면의 역할 아이콘 언어 재사용 */}
          <View style={s.hero}>
            <View
              style={[
                s.heroIcon,
                { backgroundColor: isParent ? colors.accentSoft : colors.neutral },
              ]}
            >
              <Icon
                name={isParent ? 'elderly' : 'family_restroom'}
                size={34}
                color={isParent ? colors.accent : colors.blue}
              />
            </View>
            <Text style={s.heroTitle}>
              {isParent ? '부모님으로 시작해요' : '자녀로 시작해요'}
            </Text>
            <Text style={s.heroSub}>
              {isParent ? '받은 질문에 목소리로 답해요' : '질문을 보내고 이야기를 모아요'}
            </Text>
          </View>

          {/* 모드 토글 — 처음 시작(가입) / 이미 계정이 있어요(로그인) */}
          <View style={s.segment}>
            <Pressable
              onPress={() => switchMode('signup')}
              style={[s.segBtn, mode === 'signup' && s.segBtnActive]}
            >
              <Text style={[s.segText, mode === 'signup' && s.segTextActive]}>처음 시작해요</Text>
            </Pressable>
            <Pressable
              onPress={() => switchMode('login')}
              style={[s.segBtn, mode === 'login' && s.segBtnActive]}
            >
              <Text style={[s.segText, mode === 'login' && s.segTextActive]}>
                이미 계정이 있어요
              </Text>
            </Pressable>
          </View>

          {mode === 'signup' ? (
            <>
              <Field
                label="이름"
                value={name}
                onChangeText={setName}
                placeholder={isParent ? '예: 김순자' : '예: 지훈'}
              />
              <Field
                label="아이디"
                value={username}
                onChangeText={setUsername}
                placeholder="로그인에 사용할 아이디"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Field
                label="비밀번호"
                value={password}
                onChangeText={setPassword}
                placeholder="비밀번호"
                secureTextEntry
              />

              {/* 가족 — 새로 만들기 / 초대 코드로 참여 */}
              <SectionLabel style={s.famLabel}>가족</SectionLabel>

              <Pressable
                onPress={() => setFamMode('create')}
                style={[s.famOpt, famMode === 'create' && s.famOptActive]}
              >
                <View style={s.famOptRow}>
                  <Icon
                    name={famMode === 'create' ? 'check_circle' : 'radio_button_unchecked'}
                    size={24}
                    color={famMode === 'create' ? colors.accent : colors.textFaint4}
                  />
                  <View style={s.famOptTexts}>
                    <Text style={s.famOptTitle}>새 가족 만들기</Text>
                    <Text style={s.famOptSub}>우리 가족의 첫 이야기 공간을 만들어요</Text>
                  </View>
                </View>
                {famMode === 'create' ? (
                  <PlainInput
                    value={familyName}
                    onChangeText={setFamilyName}
                    placeholder="가족 이름 (예: 김순자네 가족)"
                    style={s.famInput}
                  />
                ) : null}
              </Pressable>

              <Pressable
                onPress={() => setFamMode('join')}
                style={[s.famOpt, famMode === 'join' && s.famOptActive]}
              >
                <View style={s.famOptRow}>
                  <Icon
                    name={famMode === 'join' ? 'check_circle' : 'radio_button_unchecked'}
                    size={24}
                    color={famMode === 'join' ? colors.accent : colors.textFaint4}
                  />
                  <View style={s.famOptTexts}>
                    <Text style={s.famOptTitle}>초대 코드로 참여</Text>
                    <Text style={s.famOptSub}>가족이 알려준 코드로 함께해요</Text>
                  </View>
                </View>
                {famMode === 'join' ? (
                  <PlainInput
                    value={inviteCode}
                    onChangeText={setInviteCode}
                    placeholder="초대 코드 (예: 3F9A21BC)"
                    autoCapitalize="characters"
                    autoCorrect={false}
                    style={[s.famInput, s.codeInput]}
                  />
                ) : null}
              </Pressable>
            </>
          ) : (
            <>
              <Field
                label="아이디"
                value={username}
                onChangeText={setUsername}
                placeholder="아이디"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Field
                label="비밀번호"
                value={password}
                onChangeText={setPassword}
                placeholder="비밀번호"
                secureTextEntry
              />
            </>
          )}

          {error ? (
            <View style={s.errorBox}>
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={s.submitWrap}>
            <Button
              label={submitLabel}
              variant={isParent ? 'parentPrimary' : 'primary'}
              disabled={loading}
              onPress={submit}
            />
            {offline ? (
              <Button label="오프라인으로 계속하기" variant="secondary" onPress={continueOffline} />
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 가입 성공(새 가족) — 초대코드 안내 모달 */}
      <Overlay visible={pendingAuth !== null} dismissOnBackdrop={false}>
        <View style={s.modalBody}>
          <View style={s.modalIcon}>
            <Icon name="check_circle" size={34} color={colors.accent} />
          </View>
          <Text style={s.modalTitle}>가족 공간이 만들어졌어요</Text>
          <Text style={s.modalCaption}>가족 초대 코드</Text>
          <View style={s.codeBox}>
            <Text style={s.codeText}>{pendingAuth?.inviteCode}</Text>
          </View>
          <Text style={s.modalSub}>
            가족에게 이 코드를 공유하면{'\n'}함께 이야기를 모을 수 있어요
          </Text>
          <Button
            label="이음 시작하기"
            variant={isParent ? 'parentPrimary' : 'primary'}
            onPress={enterFromModal}
          />
        </View>
      </Overlay>
    </ScreenContainer>
  );
}

/** 라벨 + 포커스 시 accent 보더 입력. 부모 접근성: 높이 56 / 폰트 17 / radius 16 */
function Field({ label, style, ...inputProps }: { label: string } & TextInputProps) {
  return (
    <View style={s.field}>
      <SectionLabel style={s.fieldLabel}>{label}</SectionLabel>
      <PlainInput {...inputProps} style={style} />
    </View>
  );
}

function PlainInput({ style, onFocus, onBlur, ...inputProps }: TextInputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      {...inputProps}
      placeholderTextColor={colors.textFaint}
      onFocus={(e) => {
        setFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        onBlur?.(e);
      }}
      style={[s.input, focused && s.inputFocused, style]}
    />
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: spacing.screenX, paddingBottom: 38 },

  hero: { alignItems: 'center', paddingTop: 6, paddingBottom: 24 },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.r18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  heroTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 26,
    letterSpacing: -0.5,
    color: colors.text,
  },
  heroSub: { fontFamily: fonts.regular, fontSize: 15, color: colors.textMuted2, marginTop: 6 },

  segment: {
    flexDirection: 'row',
    gap: 5,
    padding: 5,
    borderRadius: radius.r16,
    backgroundColor: colors.surfaceSoft,
    marginBottom: 24,
  },
  segBtn: {
    flex: 1,
    height: 46,
    borderRadius: radius.r13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segBtnActive: { backgroundColor: colors.surface },
  segText: { fontFamily: fonts.bold, fontSize: 15, color: colors.textMuted },
  segTextActive: { color: colors.text },

  field: { marginBottom: 16 },
  fieldLabel: { marginBottom: 8, marginLeft: 2 },
  input: {
    width: '100%',
    minHeight: 56,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: radius.r16,
    borderWidth: 1.5,
    borderColor: colors.border2,
    backgroundColor: colors.surface,
    fontFamily: fonts.medium,
    fontSize: 17,
    color: colors.text,
  },
  inputFocused: { borderColor: colors.accent },

  famLabel: { marginTop: 8, marginBottom: 10, marginLeft: 2 },
  famOpt: {
    borderRadius: radius.r16,
    borderWidth: 1.5,
    borderColor: colors.border2,
    backgroundColor: colors.surface,
    padding: 16,
    marginBottom: 12,
  },
  famOptActive: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  famOptRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  famOptTexts: { flex: 1 },
  famOptTitle: { fontFamily: fonts.bold, fontSize: 17, color: colors.text },
  famOptSub: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted, marginTop: 2 },
  famInput: { marginTop: 12 },
  codeInput: { fontFamily: fonts.bold, letterSpacing: 1.5 },

  errorBox: {
    backgroundColor: tint(colors.danger, 8),
    borderRadius: radius.r14,
    paddingVertical: 13,
    paddingHorizontal: 16,
    marginTop: 4,
    marginBottom: 4,
  },
  errorText: {
    fontFamily: fonts.bold,
    fontSize: 15,
    lineHeight: 22,
    color: colors.danger,
    textAlign: 'center',
  },

  submitWrap: { marginTop: 14, gap: 12 },

  modalBody: { alignItems: 'center' },
  modalIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 20,
    letterSpacing: -0.3,
    color: colors.text,
    marginBottom: 18,
  },
  modalCaption: {
    fontFamily: fonts.extraBold,
    fontSize: 13,
    letterSpacing: 0.3,
    color: colors.textFaint2,
    marginBottom: 8,
  },
  codeBox: {
    alignSelf: 'stretch',
    borderRadius: radius.r14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.borderDashed,
    backgroundColor: colors.surfaceSoft2,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 14,
  },
  codeText: {
    fontFamily: fonts.extraBold,
    fontSize: 26,
    letterSpacing: 3,
    color: colors.accent,
  },
  modalSub: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 22,
  },
});
