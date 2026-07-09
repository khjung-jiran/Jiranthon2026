"""
자동 질문 생성 - 카테고리/템플릿 기반
"""

import random

try:
    from .question_templates import get_categories, get_templates
except ImportError:
    from question_templates import get_categories, get_templates


_used: set[str] = set()


def generate_question(
    category: str | None = None,
    from_member_id: str = "",
    to_member_id: str = "",
    exclude: list[str] | None = None,
) -> dict:
    if exclude is None:
        exclude = []

    if category is None:
        category = random.choice(get_categories())

    templates = get_templates(category)
    if not templates:
        raise ValueError(f"카테고리 '{category}'에 대한 템플릿이 없습니다")

    available = [t for t in templates if t not in exclude and t not in _used]
    if not available:
        available = templates

    content = random.choice(available)
    _used.add(content)

    return {
        "content": content,
        "category": category,
        "source": "auto",
        "from_member_id": from_member_id,
        "to_member_id": to_member_id,
    }


def generate_questions(
    count: int = 4,
    category: str | None = None,
    from_member_id: str = "",
    to_member_id: str = "",
) -> list[dict]:
    questions = []
    used: list[str] = []

    for _ in range(count):
        try:
            q = generate_question(category, from_member_id, to_member_id, exclude=used)
            used.append(q["content"])
            questions.append(q)
        except ValueError:
            break

    return questions


def suggest_categories() -> list[str]:
    return get_categories()
