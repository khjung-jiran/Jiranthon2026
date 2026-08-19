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
    import argparse
    import json

    parser = argparse.ArgumentParser(
        description="오디오 파일 음성 인식 (파일 → 텍스트)",
        epilog="예시: python file_transcribe.py recording.m4a --engine whisper",
    )
    # 위치 인자와 --file 을 모두 허용해 기존 사용법을 깨지 않는다.
    parser.add_argument("audio", nargs="?", help="오디오 파일 경로")
    parser.add_argument("engine_pos", nargs="?", help=argparse.SUPPRESS)
    parser.add_argument("--file", dest="file", default=None, help="오디오 파일 경로")
    parser.add_argument(
        "--engine", default=None, help="whisper (오프라인) 또는 google (온라인)"
    )
    parser.add_argument("--language", default="ko", help="언어 코드 (기본: ko)")
    parser.add_argument(
        "--json",
        action="store_true",
        help="결과를 마지막 줄에 JSON 한 줄로 출력 (서버 연동용)",
    )
    args = parser.parse_args()

    file_path = args.file or args.audio
    engine = (args.engine or args.engine_pos or "whisper").lower()

    if not file_path:
        parser.print_help()
        sys.exit(1)

    def fail(message: str) -> None:
        if args.json:
            # 진단 메시지는 stderr 로 보내 stdout 을 JSON 전용으로 남긴다.
            print(message, file=sys.stderr)
            print(json.dumps({"error": message}, ensure_ascii=False))
        else:
            print(f"[오류] {message}")
        sys.exit(1)

    if not args.json:
        print(f"파일: {file_path}")
        print(f"엔진: {engine}")
        print("변환 중...\n")

    try:
        text = transcribe(file_path, engine=engine, language=args.language)
    except Exception as e:
        fail(str(e))
        return

    if args.json:
        print(
            json.dumps(
                {"text": text or "", "engine": engine, "language": args.language},
                ensure_ascii=False,
            )
        )
    elif text:
        print(f"[결과] {text}")
    else:
        print("[결과] 음성을 인식하지 못했습니다.")


if __name__ == "__main__":
    main()
