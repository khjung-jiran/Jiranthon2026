# STT (Speech-to-Text) 음성 인식

## 진행률: 60% ████████████░░░░░░░░

| 항목 | 상태 |
|------|------|
| Whisper 파일 변환 구현 (오프라인) | ✅ 완료 |
| Google 파일 변환 구현 (온라인) | ✅ 완료 |
| Whisper 실시간 마이크 인식 | ✅ 완료 |
| Google 실시간 마이크 인식 | ✅ 완료 |
| 모드 선택 러너 구현 | ✅ 완료 |
| m4a/mp3 등 비WAV 파일 자동 변환 | ✅ 완료 |
| 앱에서 import 가능한 함수 래핑 | ⬜ 미완료 |
| 변환된 텍스트를 서버 API로 전송 | ⬜ 미완료 |
| 인식 실패 시 재시도 및 수동 입력 유도 | ⬜ 미완료 |
| 한국어 인식 정확도 검증 | ⬜ 미완료 |

오디오 파일 또는 마이크 입력을 텍스트로 변환합니다.

## 파일 구성

| 파일 | 설명 |
|------|------|
| `file_transcribe.py` | 녹음 파일 → 텍스트 변환 (Whisper + Google 지원) |
| `realtime_stt.py` | Whisper 기반 실시간 마이크 인식 (오프라인) |
| `stt_runner.py` | 모드 선택 러너 |
| `requirements.txt` | Python 의존성 패키지 |

## 설치

```bash
# 전체 프로젝트 의존성 (루트에서)
pip install -r requirements.txt

# FFmpeg 설치 (오디오 변환용)
# Windows: winget install Gyan.FFmpeg
# macOS:   brew install ffmpeg
# Ubuntu:  sudo apt install ffmpeg
```

## 실행

### 러너로 실행 (권장)

```bash
# 녹음 파일 변환
python stt/stt_runner.py file recording.m4a whisper   # Whisper (오프라인)
python stt/stt_runner.py file recording.m4a google    # Google (온라인)

# 실시간 마이크 인식
python stt/stt_runner.py whisper    # Whisper 실시간
python stt/stt_runner.py google     # Google 실시간
```

### 개별 실행

```bash
python stt/file_transcribe.py recording.wav whisper
python stt/realtime_stt.py
```

### Python 코드에서 import

```python
from file_transcribe import transcribe

# Whisper (오프라인, 높은 인식률)
text = transcribe("recording.m4a", engine="whisper")

# Google (온라인)
text = transcribe("recording.m4a", engine="google")
```

## 두 엔진 비교

| 항목 | Whisper | Google |
|------|---------|--------|
| 인터넷 | 불필요 (오프라인) | 필요 |
| 인식률 | 높음 (한국어 우수) | 높음 |
| 속도 | CPU에서 다소 느림 | 빠름 |
| 모델 | 자동 다운로드 (~466MB, small) | 별도 모델 불필요 |
| 파일 포맷 | wav, mp3, m4a, flac 등 | wav, aiff, flac (m4a는 변환 필요) |
| 설정 | torch 설치 필요 | 간편 |

## Whisper 모델 크기

`file_transcribe.py`의 `MODEL_SIZE`에서 변경 가능:

| 크기 | 용량 | 속도 | 인식률 |
|------|------|------|--------|
| tiny | ~75MB | 매우 빠름 | 낮음 |
| base | ~142MB | 빠름 | 보통 |
| small | ~466MB | 보통 | 좋음 (기본값) |
| medium | ~1.5GB | 느림 | 매우 좋음 |
| large | ~2.9GB | 매우 느림 | 최고 |

## 다른 모듈과의 관계

- **app**: 부모 모드/캘린더에서 음성 댓글 시 STT 모듈 호출
- **server**: 변환된 텍스트를 서버 API로 전송하여 저장
- **shared**: 응답 데이터 스키마를 공통 모듈에서 참조

## 확장 아이디어

- 화자 분리 (Speaker Diarization)로 잡음 환경에서도 부모님 음성만 인식
- 방언 인식 모델 적용 (경상도, 전라도, 제주도)
- 음성 감정 분석 모델 연동
- Whisper medium/large 모델로 인식률 추가 향상 (GPU 권장)
