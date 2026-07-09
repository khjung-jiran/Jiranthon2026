# STT (Speech-to-Text) 실시간 음성 인식

> 부모님이 음성으로 답변하실 때, 실시간으로 음성을 텍스트로 변환합니다.

실시간으로 마이크 음성을 입력받아 텍스트로 변환하는 프로세스입니다.

## 파일 구성

| 파일 | 설명 |
|------|------|
| `realtime_stt.py` | Google Web Speech API 기반 (온라인) |
| `vosk_stt.py` | Vosk 기반 실시간 스트리밍 (오프라인) |
| `stt_runner.py` | 모드 선택 러너 |
| `requirements.txt` | Python 의존성 패키지 |

## 설치

```bash
pip install -r requirements.txt
```

### PyAudio 설치 (Windows)

```bash
pip install pyaudio
```

> Windows에서 오류 발생 시: `pip install pipwin && pipwin install pyaudio`

### Vosk 모델 다운로드 (Vosk 모드 사용 시)

1. [Vosk Models](https://alphacephei.com/vosk/models)에서 한국어 모델 다운로드
   - 추천: `vosk-model-small-ko-0.22` (경량)
2. 압축을 풀어 `stt/` 폴더 내에 배치
3. `vosk_stt.py`의 `MODEL_PATH`가 모델 폴더명과 일치하는지 확인

## 실행

### 러너로 실행 (권장)

```bash
python stt_runner.py google   # Google API 모드
python stt_runner.py vosk     # Vosk 오프라인 모드
```

### 개별 실행

```bash
python realtime_stt.py   # Google API 모드
python vosk_stt.py       # Vosk 모드
```

## 두 모드 비교

| 항목 | Google (realtime_stt.py) | Vosk (vosk_stt.py) |
|------|--------------------------|---------------------|
| 인터넷 | 필요 | 불필요 (오프라인) |
| 설정 | 간편 (설치만 하면 됨) | 모델 다운로드 필요 |
| 실시간성 | 발화 종료 후 인식 | 실시간 부분 인식 (스트리밍) |
| 정확도 | 높음 | 모델에 따라 다름 |
| 언어 | 다국어 지원 | 모델에 따라 다름 |

## 다른 모듈과의 관계

- **parent-app**: 부모 앱에서 STT 모듈을 호출하여 음성 응답을 텍스트로 변환
- **server**: 변환된 텍스트를 서버 API(`POST /api/responses`)로 전송하여 저장
- **shared**: 응답 데이터 스키마를 공통 모듈에서 참조

## 개발 시 구현해야 할 내용

- [ ] 부모 앱에서 import 가능한 함수 형태로 래핑 (`recognize_speech() -> str`)
- [ ] 변환된 텍스트를 서버 API로 전송하는 로직
- [ ] 음성 파일 저장 기능 (원본 음성 보존용)
- [ ] 인식 실패 시 재시도 및 수동 텍스트 입력 유도
- [ ] 한국어 인식 정확도 검증

## 확장 아이디어

- 화자 분리 (Speaker Diarization)로 잡음 환경에서도 부모님 음성만 인식
- 방언 인식 모델 적용 (경상도, 전라도, 제주도)
- 음성 감정 분석 모델 연동
