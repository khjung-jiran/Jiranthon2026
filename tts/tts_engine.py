"""TTS 엔진 - edge-tts 기반 텍스트 → 음성 변환."""

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
    """텍스트를 음성 mp3 파일로 변환하여 저장.

    Args:
        text: 변환할 텍스트.
        output_path: 출력 파일 경로. None이면 DEFAULT_OUTPUT_DIR에 자동 저장.
        voice: edge-tts 음성 이름 (기본값: HyunsuMultilingual).
        rate: 속도 조절 ("-10%" = 10% 느리게, 고령자 기본값).

    Returns:
        저장된 파일 경로.
    """
    if not text.strip():
        raise ValueError("텍스트가 비어 있습니다.")

    if output_path is None:
        output_path = DEFAULT_OUTPUT_DIR / DEFAULT_OUTPUT_FILE
    else:
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)

    asyncio.run(_generate(text, str(output_path), voice, rate))
    return output_path


async def _generate(text: str, path: str, voice: str, rate: str) -> None:
    communicate = edge_tts.Communicate(text, voice, rate=rate)
    await communicate.save(path)
