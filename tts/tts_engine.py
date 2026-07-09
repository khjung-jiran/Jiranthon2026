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
    import pyttsx3
    engine = pyttsx3.init()
    engine.setProperty("rate", 150)
    engine.save_to_file(text, path)
    engine.runAndWait()
