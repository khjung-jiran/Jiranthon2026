"""
STT 실행 러너 - 실시간 마이크 인식 또는 녹음 파일 변환을 실행합니다.
"""

import sys


def print_usage():
    print("사용법: python stt_runner.py [모드] [옵션]")
    print()
    print("모드:")
    print("  whisper      - Whisper 실시간 마이크 인식 (오프라인)")
    print("  google       - Google Web Speech API 실시간 마이크 인식 (온라인)")
    print("  file <경로> [엔진] - 녹음 파일을 텍스트로 변환")
    print()
    print("예시:")
    print("  python stt_runner.py whisper")
    print("  python stt_runner.py google")
    print("  python stt_runner.py file recording.m4a whisper")
    print("  python stt_runner.py file recording.m4a google")


def main():
    if len(sys.argv) < 2:
        print_usage()
        mode = input("\n모드를 선택하세요 (whisper/google/file): ").strip().lower()
    else:
        mode = sys.argv[1].lower()

    if mode == "whisper":
        print("Whisper 실시간 모드로 실행합니다.\n")
        from realtime_stt import main as run_realtime

        run_realtime()
    elif mode == "google":
        print("Google Web Speech API 실시간 모드로 실행합니다.\n")
        import speech_recognition as sr

        recognizer = sr.Recognizer()
        with sr.Microphone() as source:
            print("주변 소음을 측정하여 임계값을 조정합니다...")
            recognizer.adjust_for_ambient_noise(source, duration=1)
            print("조정 완료. 이제 말씀하세요! (Ctrl+C로 종료)")

        try:
            while True:
                with sr.Microphone() as source:
                    audio = recognizer.listen(source)
                try:
                    text = recognizer.recognize_google(audio, language="ko-KR")
                    if text:
                        print(f"[결과] {text}")
                except sr.UnknownValueError:
                    pass
                except sr.RequestError as e:
                    print(f"[오류] Google Speech API 요청 실패: {e}")
        except KeyboardInterrupt:
            print("\n\n음성 인식을 종료합니다.")
    elif mode == "file":
        from file_transcribe import main as run_file

        sys.argv = ["file_transcribe.py"] + sys.argv[2:]
        run_file()
    else:
        print(f"알 수 없는 모드: {mode}")
        print_usage()
        sys.exit(1)


if __name__ == "__main__":
    main()
