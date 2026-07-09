"""로컬 LLM - Ollama 연동 기반 간단 채팅 인터페이스."""

import sys

import ollama

DEFAULT_MODEL = "qwen2.5"
DEFAULT_SYSTEM = "당신은 도움이 되는 한국어 AI 어시스턴트입니다."


def list_models() -> list[str]:
    """Ollama에 설치된 모델 목록 반환."""
    try:
        resp = ollama.list()
        return [m.model for m in resp.models]
    except Exception as e:
        print(f"모델 목록 조회 실패: {e}", file=sys.stderr)
        return []


def pull_model(model: str) -> None:
    """모델 다운로드 (없을 경우)."""
    print(f"'{model}' 모델을 다운로드합니다...")
    try:
        for chunk in ollama.pull(model, stream=True):
            if chunk.status:
                print(f"\r{chunk.status}", end="", flush=True)
        print()
    except Exception as e:
        print(f"\n모델 다운로드 실패: {e}", file=sys.stderr)
        sys.exit(1)


def ensure_model(model: str) -> None:
    """모델이 로컬에 없으면 pull."""
    models = list_models()
    if not any(m == model or m.startswith(model + ":") for m in models):
        pull_model(model)


def chat(model: str, system: str) -> None:
    """대화형 채팅 루프."""
    messages: list[dict] = [{"role": "system", "content": system}]
    print(f"=== 로컬 LLM 채팅 (모델: {model}) ===")
    print("종료하려면 'quit' 또는 'exit' 입력\n")

    while True:
        try:
            user_input = input("you> ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\n종료합니다.")
            break

        if not user_input:
            continue
        if user_input.lower() in ("quit", "exit"):
            print("종료합니다.")
            break

        messages.append({"role": "user", "content": user_input})

        print("ai> ", end="", flush=True)
        try:
            reply_content = ""
            for chunk in ollama.chat(
                model=model, messages=messages, stream=True
            ):
                text = chunk.message.content
                print(text, end="", flush=True)
                reply_content += text
            print("\n")
        except Exception as e:
            print(f"\n오류: {e}\n", file=sys.stderr)
            messages.pop()
            continue

        messages.append({"role": "assistant", "content": reply_content})


def main() -> None:
    import argparse

    parser = argparse.ArgumentParser(description="로컬 LLM 채팅 (Ollama)")
    parser.add_argument(
        "-m", "--model", default=DEFAULT_MODEL, help="사용할 Ollama 모델"
    )
    parser.add_argument(
        "-s", "--system", default=DEFAULT_SYSTEM, help="시스템 프롬프트"
    )
    parser.add_argument(
        "--list", action="store_true", help="설치된 모델 목록만 출력"
    )
    args = parser.parse_args()

    if args.list:
        models = list_models()
        if models:
            print("설치된 모델:")
            for m in models:
                print(f"  - {m}")
        else:
            print("설치된 모델이 없습니다.")
        return

    ensure_model(args.model)
    chat(args.model, args.system)


if __name__ == "__main__":
    main()
