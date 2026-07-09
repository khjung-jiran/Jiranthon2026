# Jiranthon2026 - 로컬 LLM

Ollama 기반 로컬 LLM 채팅 인터페이스.

## 사전 준비

1. [Ollama](https://ollama.com) 설치
2. Ollama 데몬 실행 (기본 포트 11434)

## 설치

```bash
pip install -r requirements.txt
```

## 사용법

```bash
# 기본 모델(llama3.2)로 채팅 시작
python local_llm.py

# 특정 모델 지정
python local_llm.py -m qwen2.5

# 시스템 프롬프트 변경
python local_llm.py -s "너는 시니어 Python 개발자야"

# 설치된 모델 목록 확인
python local_llm.py --list
```

채팅 중 `quit` 또는 `exit` 입력 시 종료.
