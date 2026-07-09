# 이음(Ieum) 앱 구축 — 진행상황 (process.md)

> view/design 디자인을 훼손 없이 iOS/Android(Expo RN) 앱으로 이식하는 멀티에이전트 작업 실시간 기록.
> 각 에이전트 상세 로그: `docs/process/<unit>.md` · 공유 계약: `docs/design-map.md`

## 파이프라인 — ✅ 전체 완료
```
Foundation(1) ─▶ [common · parent · child · family] 병렬(4) ─▶ Manager 통합(병목관리) ─▶ 시니어 코드리뷰(10년차)
```

## 단계별 상태
| 단계 | 담당(에이전트 단위) | 상태 | 산출물 | 상세 로그 |
|------|--------------------|------|--------|-----------|
| 0 | Foundation (스캐폴드·테마·타입·스토어·목업·공통컴포넌트·네비) | ✅ 완료 | 37개 파일 (App.tsx, src/theme·types·store·data·components·navigation) | docs/process/foundation.md |
| 1a | common (Login, Notification) | ✅ 완료 | screens/common/* | docs/process/common.md |
| 1b | parent (Home, QuestionList, Detail, Respond) | ✅ 완료 | screens/parent/* (renderVals 1:1 대조검증) | docs/process/parent.md |
| 1c | child (Dashboard, Compose, ResponseList, Storybook) | ✅ 완료 | screens/child/* (감사+버그 1건 수정) | docs/process/child.md |
| 1d | family (Calendar, Album, Poll, Capsule×2, Booklet, Settings, Soon) | ✅ 완료 | screens/family/* 8개 화면 | docs/process/family.md |
| 2 | Manager 통합 | ✅ 완료 | babel-preset-expo 결함 수정 · 토큰 4건 추가 · avColor/fmt/PulseRing 중복 통합 · 죽은 API 제거 | docs/process/manager.md |
| 3 | 시니어 코드리뷰 (10년차+) | ✅ 완료 | High 1 · Medium 1 · Low 3 | docs/process/review.md |

## 시니어 리뷰 요약
- **종합**: "완성도가 매우 높다. 18개 화면 전체 실구현, 스토어 파생 로직이 원본 렌더 스크립트와 1:1 일치."
- **디자인 충실도**: 12개+ 화면 표본 대조에서 색/radius/padding/폰트/문구 거의 완벽 일치. 애니메이션 keyframe 수치 정확 일치.
- **Findings**: [High] 부모모드 '글씨 크기' 설정 미적용(접근성) · [Medium] #F4EADA→#F5EADA 오차 2곳 · [Low] 하드코딩 리터럴 2건, QR monospace iOS 보장, _Stub.tsx 정리

## 환경 설치 현황 — ✅ 완료
- WSL2 Ubuntu + Node v24.18.0 / npm 11.16.0 (nvm)
- eum-app 의존성 519 패키지 설치 + `expo install --fix` SDK 57 정합 완료 (WSL ~/Jiranthon2026)
- `expo config` 검증 통과. `/mnt/c` EPERM 이슈로 설치는 WSL 네이티브 경로 사용

## 병목/이슈 로그 (Manager 취합·해소)
| 병목 | 상태 |
|------|------|
| 세션 사용량 한도로 에이전트 5개 중단 | ✅ 19:10 초기화 후 캐시 재개로 해소 |
| Node/npm 미설치 (전 에이전트 공통 보고) | ✅ nvm으로 설치 완료 |
| babel-preset-expo 누락 (빌드 즉시 깨질 결함) | ✅ Manager가 수정 |
| 테마 토큰 누락 색 4건 | ✅ Manager가 토큰 추가·교체 |
| avColor/fmt/펄스링 중복 정의 | ✅ src/utils + PulseRing으로 통합 |
| settings.scribe 죽은 API | ✅ 원본 대조 후 제거 |
| support.js 오인(실제 로직은 이음.dc.html 877~1365) | ✅ design-map에 정정 공지 |
| tsc/앱 부팅 검증 | 🔄 push 후 WSL에서 수행 (다음 단계) |
| [High] 글씨 크기 설정 미적용 | 🔄 수정 예정 |

## 다음 단계
1. ✅ **서버 연동 완료** — `src/api/`(client+도메인 매핑) 신설, 스토어 `hydrate()`+`serverOnline`+쓰기 액션 best-effort 동기화. 서버 다운 시 목업 폴백(오프라인 모드). 화면 파일 무수정. 상세: `docs/process/integration.md`
2. ✅ **회원가입/로그인 화면 완료** — `screens/common/AuthScreen.tsx` 신설(역할 선택 → 가입/로그인, 가족 생성·초대코드 참여, 초대코드 안내 모달, 오프라인 폴백). `api.signup/signin` + 스토어 `authLogin` 추가(기존 `login(role)`은 데모/오프라인용 유지, 기존 액션 시그니처 무변경). 세션은 메모리 전용(재시작 시 재로그인 — MVP). 상세: `docs/process/auth.md`
3. 커밋·push (solji) → WSL pull → `npx tsc --noEmit` 타입검증 → 서버(`uvicorn main:app --host 0.0.0.0`) 띄우고 왕복 스모크 테스트 (+가입/로그인/초대코드/오프라인 폴백 4경로)
4. 리뷰 High/Medium 수정 → `expo start`로 실기기(QR)/웹 확인 (실기기는 `setApiBase('http://<PC-LAN-IP>:8000')` 필요)
5. 음성 업로드(`/api/uploads/audio`)·STT/TTS 연동, 캘린더/앨범 하이드레이트(화면의 mock 직접 참조 해소 필요), 세션 영속화(AsyncStorage) 및 hydrate 빈 배열 반영 정책 전환(신규 가족 목업 노출 해소)
