"""
녹음 파일 음성 인식 (파일 → 텍스트)
오디오 파일(wav, mp3, m4a, flac 등)을 입력받아 텍스트로 변환합니다.
Whisper(오프라인)와 Google Web Speech API(온라인)를 지원합니다.
"""

import os
import sys
import tempfile

import whisper

MODEL_SIZE = "small"
SAMPLE_RATE = 16000

_whisper_model = None


def _get_whisper_model():
    """Whisper 모델 싱글톤 (최초 호출 시 로드, 이후 캐시)"""
    global _whisper_model
    if _whisper_model is None:
        print(f"[Whisper] '{MODEL_SIZE}' 모델 로딩 중...")
        _whisper_model = whisper.load_model(MODEL_SIZE)
        print("[Whisper] 모델 로딩 완료.")
    return _whisper_model


def transcribe_whisper(file_path: str, language: str = "ko") -> str:
    """
    Whisper로 오디오 파일을 텍스트로 변환 (오프라인)

    Args:
        file_path: 오디오 파일 경로 (wav, mp3, m4a, flac 등)
        language: 언어 코드 (기본: ko)

    Returns:
        인식된 텍스트
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"파일을 찾을 수 없습니다: {file_path}")

    model = _get_whisper_model()
    result = model.transcribe(file_path, language=language)
    return result["text"].strip()


def transcribe_google(file_path: str, language: str = "ko-KR") -> str:
    """
    Google Web Speech API로 오디오 파일을 텍스트로 변환 (온라인)

    Args:
        file_path: 오디오 파일 경로 (wav, aiff, flac, m4a, mp3 등)
        language: 인식 언어 코드 (기본: ko-KR)

    Returns:
        인식된 텍스트
    """
    import speech_recognition as sr
    from pydub import AudioSegment

    if not os.path.exists(file_path):
        raise FileNotFoundError(f"파일을 찾을 수 없습니다: {file_path}")

    ext = os.path.splitext(file_path)[1].lower()
    wav_path = file_path
    tmp_wav = None

    if ext not in (".wav", ".aiff", ".flac", ".aif"):
        print(f"[변환] {ext} 파일을 WAV로 변환 중...")
        audio = AudioSegment.from_file(file_path)
        audio = audio.set_channels(1).set_frame_rate(SAMPLE_RATE)
        tmp_wav = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
        tmp_wav.close()
        audio.export(tmp_wav.name, format="wav")
        wav_path = tmp_wav.name

    recognizer = sr.Recognizer()

    try:
        with sr.AudioFile(wav_path) as source:
            audio = recognizer.record(source)

        try:
            text = recognizer.recognize_google(audio, language=language)
            return text
        except sr.UnknownValueError:
            return ""
        except sr.RequestError as e:
            raise RuntimeError(f"Google Speech API 요청 실패: {e}")
    finally:
        if tmp_wav and os.path.exists(tmp_wav):
            os.unlink(tmp_wav)


def transcribe(file_path: str, engine: str = "whisper", language: str = "ko") -> str:
    """
    오디오 파일을 텍스트로 변환 (엔진 자동 선택)

    Args:
        file_path: 오디오 파일 경로
        engine: "whisper" 또는 "google"
        language: 언어 코드 (whisper: ko, google: ko-KR)

    Returns:
        인식된 텍스트
    """
    if engine == "whisper":
        return transcribe_whisper(file_path, language)
    elif engine == "google":
        return transcribe_google(file_path, "ko-KR" if language == "ko" else language)
    else:
        raise ValueError(f"지원하지 않는 엔진: {engine} (whisper 또는 google)")


def main():
    if len(sys.argv) < 2:
        print("사용법: python file_transcribe.py <오디오파일경로> [엔진]")
        print()
        print("엔진:")
        print("  whisper  - OpenAI Whisper (오프라인, 높은 인식률)")
        print("  google   - Google Web Speech API (온라인)")
        print()
        print("예시:")
        print("  python file_transcribe.py recording.m4a whisper")
        print("  python file_transcribe.py recording.m4a google")
        sys.exit(1)

    file_path = sys.argv[1]
    engine = sys.argv[2].lower() if len(sys.argv) > 2 else "whisper"

    print(f"파일: {file_path}")
    print(f"엔진: {engine}")
    print("변환 중...\n")

    try:
        text = transcribe(file_path, engine=engine)
        if text:
            print(f"[결과] {text}")
        else:
            print("[결과] 음성을 인식하지 못했습니다.")
    except Exception as e:
        print(f"[오류] {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
