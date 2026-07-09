"""
실시간 음성 인식 (Google Web Speech API 기반)
마이크 입력을 실시간으로 받아 텍스트로 변환합니다.
"""

import speech_recognition as sr


def callback(recognizer, audio):
    """백그라운드에서 음성을 인식하는 콜백 함수"""
    try:
        text = recognizer.recognize_google(audio, language="ko-KR")
        print(f"[인식결과] {text}")
    except sr.UnknownValueError:
        pass
    except sr.RequestError as e:
        print(f"[오류] Google Speech API 요청 실패: {e}")


def main():
    recognizer = sr.Recognizer()

    with sr.Microphone() as source:
        print("주변 소음을 측정하여 임계값을 조정합니다...")
        recognizer.adjust_for_ambient_noise(source, duration=1)
        print("조정 완료. 이제 말씀하세요! (Ctrl+C로 종료)")

    stop_listening = recognizer.listen_in_background(source, callback)

    try:
        while True:
            pass
    except KeyboardInterrupt:
        print("\n음성 인식을 종료합니다.")
        stop_listening(wait_for_stop=False)


if __name__ == "__main__":
    main()
