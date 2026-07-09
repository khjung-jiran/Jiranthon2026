"""
실시간 음성 인식 (Vosk 기반 - 오프라인 스트리밍)
마이크 입력을 실시간 스트리밍으로 처리하여 텍스트로 변환합니다.
Vosk 모델이 필요합니다: https://alphacephei.com/vosk/models
한국어 모델: vosk-model-small-ko-0.22
"""

import json
import queue
import sys
import threading
import wave

import pyaudio
from vosk import KaldiRecognizer, Model

MODEL_PATH = "vosk-model-small-ko-0.22"
SAMPLE_RATE = 16000
CHUNK_SIZE = 4000  # samples
CHANNELS = 1
MAX_RECORD_SECONDS = 60


def main():
    audio_queue = queue.Queue()

    try:
        model = Model(MODEL_PATH)
    except Exception:
        print(f"[오류] Vosk 모델을 '{MODEL_PATH}' 경로에서 찾을 수 없습니다.")
        print("모델을 다운로드하여 압축을 풀고, MODEL_PATH를 수정하세요.")
        print("다운로드: https://alphacephei.com/vosk/models")
        sys.exit(1)

    recognizer = KaldiRecognizer(model, SAMPLE_RATE)
    recognizer.SetWords(True)

    def audio_callback(in_data, frame_count, time_info, status):
        audio_queue.put(in_data)
        return (None, pyaudio.paContinue)

    pa = pyaudio.PyAudio()

    print("마이크 스트리밍을 시작합니다. 말씀하세요! (Ctrl+C로 종료)\n")

    stream = pa.open(
        format=pyaudio.paInt16,
        channels=CHANNELS,
        rate=SAMPLE_RATE,
        input=True,
        frames_per_buffer=CHUNK_SIZE,
        stream_callback=audio_callback,
    )

    stream.start_stream()

    try:
        while stream.is_active():
            data = audio_queue.get()
            if recognizer.AcceptWaveform(data):
                result = json.loads(recognizer.Result())
                text = result.get("text", "").strip()
                if text:
                    print(f"[최종] {text}")
            else:
                partial = json.loads(recognizer.PartialResult())
                partial_text = partial.get("partial", "").strip()
                if partial_text:
                    print(f"\r[부분] {partial_text}", end="", flush=True)
    except KeyboardInterrupt:
        print("\n\n음성 인식을 종료합니다.")
    finally:
        stream.stop_stream()
        stream.close()
        pa.terminate()

        final = json.loads(recognizer.FinalResult())
        text = final.get("text", "").strip()
        if text:
            print(f"[최종] {text}")


if __name__ == "__main__":
    main()
