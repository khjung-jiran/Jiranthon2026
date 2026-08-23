# 이음 Android 앱 (EIUM_APP)

php-server 가 서빙하는 웹 화면을 WebView 로 감싸는 네이티브 래퍼입니다.
FCM 푸시 수신, 파일 선택, 마이크 권한, 쿠키 유지를 네이티브가 담당합니다.

## 빌드 전 준비

### 1. google-services.json 배치 (필수)

Firebase 설정 파일은 저장소에 포함되어 있지 않습니다.
Firebase 콘솔에서 `jiransecurity.eium_app` 패키지의 설정 파일을 내려받아
아래 경로에 두어야 빌드가 됩니다.

```
EIUM_APP/app/google-services.json
```

### 2. 서버 주소 확인

`app/src/main/java/jiransecurity/eium_app/AppConfig.kt` 의 `BASE_URL` 을
접속할 php-server 주소로 맞춥니다.

```kotlin
const val BASE_URL = "https://10.52.7.140:443"
```

## 빌드

```bash
cd EIUM_APP
./gradlew assembleDebug
```

## 웹 ↔ 네이티브 연동

WebView 에 `Android` / `AndroidBridge` 두 이름으로 동일한 인터페이스가 주입됩니다.

| 메서드 | 설명 |
|--------|------|
| `registerFcm(memberId)` | FCM 토큰을 서버에 등록 |
| `callHandler("registerFcm", memberId)` | 위와 동일 |
| `callHandler("logout", memberId)` | 토큰 해제(로그아웃) |
| `showNotification(title, message)` | 로컬 알림 표시 |

푸시 페이로드의 `nav_target` 값으로 앱 실행 시 특정 페이지를 열 수 있습니다.

## 참고

- 개발 편의를 위해 자체 서명 인증서를 허용하도록 되어 있습니다
  (`MainActivity.onReceivedSslError`, `FcmClient.getUnsafeOkHttpClient`).
  운영 배포 전에는 정식 인증서로 교체하고 이 우회를 제거해야 합니다.
