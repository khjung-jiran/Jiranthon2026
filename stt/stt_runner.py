"""
STT 실행 러너 - 원하는 모드를 선택하여 실시간 음성 인식을 실행합니다.
"""

import sys


def print_usage():
    print("사용법: python stt_runner.py [모드]")
    print()
    print("모드:")
    print("  google  - Google Web Speech API 기반 (온라인, 설정 간편)")
    print("  vosk    - Vosk 기반 (오프라인, 실시간 스트리밍)")
    print()
    print("예시:")
    print("  python stt_runner.py google")
    print("  python stt_runner.py vosk")


def main():
    if len(sys.argv) < 2:
        print_usage()
        mode = input("\n모드를 선택하세요 (google/vosk): ").strip().lower()
    else:
        mode = sys.argv[1].lower()

    if mode == "google":
        print("Google Web Speech API 모드로 실행합니다.\n")
        from realtime_stt import main as run_google

        run_google()
    elif mode == "vosk":
        print("Vosk 오프라인 모드로 실행합니다.\n")
        from vosk_stt import main as run_vosk

        run_vosk()
    else:
        print(f"알 수 없는 모드: {mode}")
        print_usage()
        sys.exit(1)


if __name__ == "__main__":
    main()
