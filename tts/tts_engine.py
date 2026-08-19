"""TTS 엔진 - edge-tts 기반 텍스트 → 음성 변환 (pyttsx3 폴백)."""

import asyncio
from pathlib import Path

import edge_tts

DEFAULT_VOICE = "ko-KR-HyunsuMultilingualNeural"
DEFAULT_OUTPUT_DIR = Path(__file__).parent / "data"
DEFAULT_OUTPUT_FILE = "tts_output.mp3"

DEFAULT_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

KOREAN_VOICES = {
    "hyunsu": "ko-KR-HyunsuMultilingualNeural",
    "sunhi": "ko-KR-SunHiNeural",
    "injoon": "ko-KR-InJoonNeural",
}


def text_to_speech(
    text: str,
    output_path: str | Path | None = None,
    voice: str = DEFAULT_VOICE,
    rate: str = "-10%",
) -> Path:
    """텍스트를 음성 파일로 변환하여 저장. edge-tts 실패 시 pyttsx3 폴백."""
    if not text.strip():
        raise ValueError("텍스트가 비어 있습니다.")

    if output_path is None:
        output_path = DEFAULT_OUTPUT_DIR / DEFAULT_OUTPUT_FILE
    else:
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)

    try:
        asyncio.run(_generate_edge(text, str(output_path), voice, rate))
    except Exception as e:
        import logging
        logging.getLogger("eum.tts").warning(f"edge-tts 실패, pyttsx3 폴백: {e}")
        _generate_pyttsx3(text, str(output_path))

    return output_path


async def _generate_edge(text: str, path: str, voice: str, rate: str) -> None:
    communicate = edge_tts.Communicate(text, voice, rate=rate)
    await communicate.save(path)


def _generate_pyttsx3(text: str, path: str) -> None:
    """pyttsx3 폴백. macOS nsss 엔진은 runAndWait()가 무한 대기할 수 있어
    별도 프로세스에서 타임아웃과 함께 실행한다."""
    import subprocess
    import sys

    script = (
        "import pyttsx3; "
        f"e = pyttsx3.init(); "
        "e.setProperty('rate', 150); "
        f"e.save_to_file({text!r}, {path!r}); "
        "e.runAndWait()"
    )
    try:
        subprocess.run(
            [sys.executable, "-c", script],
            timeout=15,
            check=True,
            capture_output=True,
        )
    except subprocess.TimeoutExpired:
        raise RuntimeError("pyttsx3 폴백 타임아웃 (15초)")


def main() -> None:
    """CLI 진입점. 서버(PHP)가 이 스크립트를 하위 프로세스로 실행한다."""
    import argparse
    import json
    import sys

    parser = argparse.ArgumentParser(description="텍스트 → 음성 변환 (edge-tts)")
    parser.add_argument("--text", required=True, help="합성할 텍스트")
    parser.add_argument("--output", default=None, help="출력 mp3 경로")
    parser.add_argument(
        "--voice",
        default="hyunsu",
        help=f"목소리: {', '.join(KOREAN_VOICES)} (또는 전체 음성 이름)",
    )
    parser.add_argument("--rate", default="-10%", help="말하기 속도 (예: -10%%)")
    # 서버는 언어를 함께 넘긴다. 현재 한국어 음성만 쓰므로 받아서 무시한다.
    parser.add_argument("--language", default="ko", help=argparse.SUPPRESS)
    args = parser.parse_args()

    voice = KOREAN_VOICES.get(args.voice, args.voice)

    try:
        path = text_to_speech(
            args.text, output_path=args.output, voice=voice, rate=args.rate
        )
    except Exception as e:
        print(str(e), file=sys.stderr)
        print(json.dumps({"error": str(e)}, ensure_ascii=False))
        sys.exit(1)

    # 마지막 줄에 JSON 한 줄만 남긴다 (서버가 이 줄을 파싱한다).
    print(json.dumps({"output": str(path), "voice": voice}, ensure_ascii=False))


if __name__ == "__main__":
    main()
