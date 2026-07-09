# auth — 회원가입/로그인 화면 (AuthScreen)

> 담당: auth 에이전트 · 브랜치 solji · 계약: `docs/design-map.md` (Foundation 산출물 100% 준수)

## ① 한 일

| 파일 | 내용 |
|------|------|
| `eum-app/src/screens/common/AuthScreen.tsx` | **신규.** 역할 선택 후 진입하는 가입/로그인 화면. 가입(이름/아이디/비밀번호 + 가족 만들기·초대코드 참여) / 로그인(아이디/비밀번호) 세그먼트 토글. 성공 시 `authLogin`, 새 가족 생성 시 초대코드 안내 모달(Overlay), 서버 미응답 시 "오프라인으로 계속하기"(데모 `login(role)`) 폴백 |
| `eum-app/src/screens/common/LoginScreen.tsx` | **최소 수정.** 역할 버튼 onPress: `store.login(role)` → `navigation.navigate('Auth', { role })`. 시각 변경 없음(스타일/마크업 그대로) |
| `eum-app/src/navigation/types.ts` | `Auth: { role: Role }` 라우트 추가 |
| `eum-app/src/navigation/RootNavigator.tsx` | role===null 그룹을 `Stack.Group`으로 묶고 `Auth` 등록 |
| `eum-app/src/api/index.ts` | `signup()`(가족 생성 or 초대코드 참여 → 멤버 생성 → 로그인 체인), `signin()`, `AuthResult` 타입, `establishSession()`(모듈 세션 확정 + 구성원 라벨 등록) 추가. 기존 함수 무수정 |
| `eum-app/src/store/useStore.ts` | `authLogin(auth: api.AuthResult)` 액션 추가 — 서버 member를 `currentUser`에 반영하고 `hydrate()` 호출. 기존 `login(role)`은 데모/오프라인용으로 유지, **기존 액션 시그니처 전부 무변경** |

### UX 흐름
1. sLogin(원본 그대로) → 역할 선택 → `Auth` push (Header 뒤로가기로 역할 선택 복귀)
2. 기본 모드 = 가입("처음 시작해요"). 가족 섹션: ○ 새 가족 만들기(가족 이름) / ○ 초대 코드로 참여(코드) radio 카드
3. 제출 → `api.signup` 체인 → 새 가족이면 초대코드 모달("가족 초대 코드: XXXX — 공유 안내") → "이음 시작하기" → `authLogin` → RootNavigator가 자동으로 역할 탭 전환
4. 초대코드 참여 가입/로그인은 모달 없이 토스트 후 즉시 입장
5. 네트워크 실패 시 danger 에러 + "오프라인으로 계속하기" 보조 버튼 → `login(role)` 목업 모드

### 에러 처리
- 409 → "아이디가 이미 사용 중이에요"
- 404(가입 모드) → "초대 코드를 찾을 수 없어요"
- 401 → "아이디 또는 비밀번호가 맞지 않아요"
- 기타 4xx/5xx → "요청을 처리하지 못했어요 — 잠시 후 다시 시도해 주세요"
- 네트워크/타임아웃(ApiError.status===null) → "서버에 연결할 수 없어요 — 오프라인으로 계속할 수 있어요" + 오프라인 버튼
- 클라이언트 검증: 빈 필드별 한국어 안내("이름을 입력해 주세요" 등)

## ② 설계 결정 (디자인 근거)

- **원본에 없는 화면 → 기존 화면의 디자인 언어로 조립**: 히어로 아이콘은 sLogin의 역할 아이콘(elderly/accentSoft·accent, family_restroom/neutral/blue)을 그대로 재사용해 "역할 선택의 연장"으로 읽히게 함. 입력은 sCapsNew 입력 패턴(surface + border2 1.5 + r16)을 부모 접근성 기준으로 키움(minHeight 56 ≥54, 폰트 17, 포커스 시 accent 보더). radio 카드는 원본의 radio_button_unchecked/check_circle 글리프 패턴.
- **세그먼트 토글**: surfaceSoft 트랙 + surface 활성 탭(패딩 5, r16/r13) — 원본 칩/토글 계열의 웜 톤 유지. 하드코딩 색 0건, 전부 테마 토큰(+`tint(danger,8)` 에러 배경).
- **제출 버튼**: role==='parent'면 `parentPrimary`(64/19 + 그림자), 아니면 `primary`. 로딩은 라벨 교체("가입하는 중…") + disabled(토큰 정의 disabled 시각).
- **초대코드 모달**: `Overlay`(radius26 흰 카드) + 점선 borderDashed/surfaceSoft2 코드 박스(원본 점선 박스 계열) + accent 26/800 자간 3 코드. `dismissOnBackdrop=false` — 코드를 못 보고 닫는 사고 방지, 확인 버튼으로만 입장.
- **authLogin 진입 방식**: role만 set하면 RootNavigator 조건 분기가 스택을 통째로 교체하므로 별도 navigate 불필요(기존 `login(role)`과 동일 메커니즘).
- **세션 재사용**: `api.signup/signin`이 데모 부트스트랩과 같은 모듈 세션 변수를 확정하므로, `authLogin → hydrate() → bootstrapSession(role)`이 `session.role===role` 조기반환으로 **실계정 세션을 그대로 재사용**한다(데모 계정 자동 생성 안 됨). `signin`의 role은 사용자가 고른 role이 아니라 **서버 member.role**을 따른다(부모 화면에서 자녀 계정으로 로그인해도 올바른 탭 진입).
- **가족 이름 미입력 보호**: signup에서 familyName이 비면 `"{이름}네 가족"` 폴백(화면에선 필수 검증하므로 API 방어용).
- **초대코드 대문자 정규화**: 서버가 `token_hex(4).upper()`로 발급하므로 제출 시 `trim().toUpperCase()`.

## ③ 리스크

- **세션 영속화 없음(제약 준수)**: 메모리 세션 — 앱 재시작 시 재로그인 필요. MVP 허용 사항.
- **가입 중 부분 실패 시 고아 가족**: "새 가족 만들기" 흐름에서 가족 생성 후 createMember가 409(아이디 중복)로 실패하면 멤버 없는 가족 레코드가 서버에 남는다(서버에 삭제/트랜잭션 API 없음 — server/ 수정 금지 제약). 사용자는 아이디만 바꿔 재시도 가능하나 그때 또 새 가족이 생긴다. 서버에 가족 삭제 또는 가입 원자 엔드포인트 추가가 근본 해결.
- **신규 가족은 데이터가 비어 목업이 보임**: 기존 `hydrate()` 정책이 "서버가 빈 값을 주면 목업 유지(빈 화면 방지)"라, 실계정 새 가족도 김순자네 목업 질문/캡슐/알림이 보인다. 데모 UX 정책을 그대로 따른 것 — 실서비스 전 "serverOnline이면 빈 배열도 반영"으로 정책 전환 필요.
- **currentUser 색상**: 서버 member에 색 정보가 없어 역할별 기본색(#7C8A55/#5B7086, makeUser와 동일)을 사용. 화면 표시명도 기존 목업 라벨 매핑(LABEL_BY_NAME)에 없는 이름은 실명 그대로 노출.
- **비밀번호 정책 없음**: 서버가 길이/복잡도 제약이 없어 클라이언트도 비어있음만 검증(임의 규칙 발명 금지 판단).
- **node 미설치 환경**: tsc/실행 검증 못 함 — 네비 타입·스토어 시그니처·API 반환 타입·테마 토큰 존재 여부를 수동 대조로 검증(아래 ④에서 WSL tsc 필요).

## ④ 남은 일

1. WSL에서 `npx tsc --noEmit` 타입 검증 + `expo start` 실기기/웹 스모크(가입→초대코드 모달→홈, 코드 참여, 로그인, 서버 다운 폴백 4경로)
2. 앱 재시작 세션 복원(AsyncStorage 등 — 새 패키지 필요라 이번 제약에서 제외)
3. hydrate 빈 배열 반영 정책 전환(신규 가족 목업 노출 해소) 검토
4. 로그아웃 시 api 모듈 세션도 초기화(`session=null`)하는 정리 훅 — 현재는 재로그인 시 establishSession이 덮어써 실害 없음
