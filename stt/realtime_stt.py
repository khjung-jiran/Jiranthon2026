"""
실시간 음성 인식 (Whisper 기반)
마이크 입력을 받아 Whisper로 텍스트로 변환합니다.
"""

import tempfile

import pyaudio
import whisper

MODEL_SIZE = "small"
SAMPLE_RATE = 16000
CHUNK_SIZE = 1024
CHANNELS = 1
RECORD_SECONDS = 10

_whisper_model = None


def _get_whisper_model():
    global _whisper_model
    if _whisper_model is None:
        print(f"[Whisper] '{MODEL_SIZE}' 모델 로딩 중...")
        _whisper_model = whisper.load_model(MODEL_SIZE)
        print("[Whisper] 모델 로딩 완료.")
    return _whisper_model


def main():
    model = _get_whisper_model()

    pa = pyaudio.PyAudio()

    print("\n마이크 녹음을 시작합니다. 말씀하세요! (Ctrl+C로 종료)")
    print(f"({RECORD_SECONDS}초 단위로 녹음하여 인식합니다)\n")

    try:
        while True:
            frames = []
            stream = pa.open(
                format=pyaudio.paInt16,
                channels=CHANNELS,
                rate=SAMPLE_RATE,
                input=True,
                frames_per_buffer=CHUNK_SIZE,
            )

            print(f"[녹음 중] {RECORD_SECONDS}초간 말씀하세요...")
            for _ in range(0, int(SAMPLE_RATE / CHUNK_SIZE * RECORD_SECONDS)):
                data = stream.read(CHUNK_SIZE, exception_on_overflow=False)
                frames.append(data)

            stream.stop_stream()
            stream.close()

            tmp = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
            tmp.close()

            import wave

            with wave.open(tmp.name, "wb") as wf:
                wf.setnchannels(CHANNELS)
                wf.setsampwidth(pa.get_sample_size(pyaudio.paInt16))
                wf.setframerate(SAMPLE_RATE)
                wf.writeframes(b"".join(frames))

            print("[인식 중]...")
            result = model.transcribe(tmp.name, language="ko")
            text = result["text"].strip()

            import os

            os.unlink(tmp.name)

            if text:
                print(f"[결과] {text}\n")
            else:
                print("[결과] (인식되지 않음)\n")

    except KeyboardInterrupt:
        print("\n\n음성 인식을 종료합니다.")
    finally:
        pa.terminate()


if __name__ == "__main__":
    main()
