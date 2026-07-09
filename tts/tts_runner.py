"""TTS 러너 - CLI에서 텍스트를 음성으로 변환."""

import argparse

from tts_engine import text_to_speech


def main() -> None:
    parser = argparse.ArgumentParser(description="TTS - 텍스트를 음성으로 변환")
    parser.add_argument("text", help="변환할 텍스트")
    parser.add_argument(
        "-o", "--output", default=None, help="출력 파일 경로 (기본: tts/data/tts_output.mp3)"
    )
    parser.add_argument(
        "-v", "--voice", default=None,
        help="음성 이름 (hyunsu/sunhi/youngja/injoon 또는 전체 이름, 기본: hyunsu)"
    )
    parser.add_argument(
        "-r", "--rate", default="-10%", help="속도 조절 (예: -10%% 느리게, +10%% 빠르게, 기본: -10%%)"
    )
    args = parser.parse_args()

    from tts_engine import KOREAN_VOICES, DEFAULT_VOICE
    voice = KOREAN_VOICES.get(args.voice, args.voice) if args.voice else DEFAULT_VOICE

    saved_path = text_to_speech(
        text=args.text,
        output_path=args.output,
        voice=voice,
        rate=args.rate,
    )
    print(f"음성 파일 저장 완료: {saved_path}")


if __name__ == "__main__":
    main()
