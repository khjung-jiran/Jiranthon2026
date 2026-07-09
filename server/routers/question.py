"""질문/응답 API + AI 추천 질문"""
import os
import sys
import time

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from logger import get_logger
from models import Question, Response
from schemas import (
    AIQuestionRequest,
    QuestionCreate,
    QuestionOut,
    ResponseCreate,
    ResponseOut,
)

logger = get_logger("eum.question")
router = APIRouter(prefix="/api", tags=["question"])

def infer_category(content: str) -> str:
    """LLM을 통해 질문 내용을 카테고리로 분류 (childhood/youth/twilight)."""
    try:
        import ollama
        resp = ollama.chat(
            model="qwen2.5",
            messages=[{
                "role": "user",
                "content": (
                    "다음 질문을 세 가지 카테고리 중 하나로 분류하세요. "
                    "답변은 카테고리 영어 키만 정확히 출력하세요.\n"
                    "childhood: 유년기 (어린 시절, 고향, 가족, 학교, 놀이, 추억)\n"
                    "youth: 청년시절 (청춘, 직장, 연애, 대학, 독립, 꿈)\n"
                    "twilight: 황혼기 (인생 회고, 가치관, 조언, 요즘 삶, 감사)\n\n"
                    f"질문: {content}\n\n카테고리:"
                ),
            }],
        )
        result = resp["message"]["content"].strip().lower()
        for cat in ("childhood", "youth", "twilight"):
            if cat in result:
                return cat
        return "twilight"
    except Exception as e:
        logger.warning(f"LLM 카테고리 분류 실패: {e}")
        return "twilight"


@router.post("/questions", response_model=QuestionOut)
def create_question(data: QuestionCreate, db: Session = Depends(get_db)):
    category = data.category or infer_category(data.content)
    q = Question(
        family_id=data.family_id,
        content=data.content,
        category=category,
        source=data.source,
        from_member_id=data.from_member_id,
        to_member_id=data.to_member_id,
    )
    db.add(q)
    db.commit()
    db.refresh(q)
    logger.info(f"질문 생성: {q.id} / {q.content[:30]}")
    return q


@router.get("/questions", response_model=list[QuestionOut])
def list_questions(
    to_member_id: str | None = None,
    from_member_id: str | None = None,
    family_id: str | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(Question)
    if to_member_id:
        query = query.filter(Question.to_member_id == to_member_id)
    if from_member_id:
        query = query.filter(Question.from_member_id == from_member_id)
    if family_id:
        query = query.filter(Question.family_id == family_id)
    return query.order_by(Question.created_at.desc()).all()


# NOTE: 고정 경로(/questions/ai-suggestions)는 동적 경로(/questions/{qid})보다
# 먼저 등록해야 한다. FastAPI는 등록 순서대로 매칭하므로, 아래에 두면
# "ai-suggestions"가 qid로 잡혀 항상 404가 났다. (프론트 연동 중 발견·수정)
@router.get("/questions/ai-suggestions")
def get_ai_suggestions(
    category: str | None = None,
    count: int = 4,
    from_member_id: str | None = None,
    to_member_id: str | None = None,
    family_id: str | None = None,
    db: Session = Depends(get_db),
):
    try:
        try:
            from question_engine.auto_question import generate_questions
        except ImportError:
            import importlib
            import os
            qe_path = os.path.join(os.path.dirname(__file__), "..", "..", "question-engine")
            sys.path.insert(0, qe_path)
            mod = importlib.import_module("auto_question")
            generate_questions = mod.generate_questions

        # DB에서 기존 질문 content 조회하여 중복 방지
        existing = db.query(Question.content).all()
        exclude = [row[0] for row in existing]

        questions = generate_questions(
            count=count,
            category=category,
            from_member_id=from_member_id or "",
            to_member_id=to_member_id or "",
            exclude=exclude,
        )
        return {"questions": questions}
    except Exception as e:
        raise HTTPException(500, f"질문 생성 실패: {e}")


@router.get("/questions/{qid}", response_model=QuestionOut)
def get_question(qid: str, db: Session = Depends(get_db)):
    q = db.query(Question).filter(Question.id == qid).first()
    if not q:
        raise HTTPException(404, "질문을 찾을 수 없습니다")
    return q


@router.delete("/questions/{qid}")
def delete_question(qid: str, db: Session = Depends(get_db)):
    q = db.query(Question).filter(Question.id == qid).first()
    if not q:
        raise HTTPException(404, "질문을 찾을 수 없습니다")
    db.delete(q)
    db.commit()
    return {"success": True}


@router.post("/responses", response_model=ResponseOut)
def create_response(data: ResponseCreate, db: Session = Depends(get_db)):
    content = data.content
    transcript = data.transcript

    # 음성 파일이 있지만 텍스트가 없으면 서버에서 STT 처리
    if data.audio_file_path and not content:
        try:
            from stt.file_transcribe import transcribe
            stt_text = transcribe(data.audio_file_path, engine="whisper", language="ko")
            content = stt_text
            transcript = stt_text
            logger.info(f"서버 STT 처리 완료: {stt_text[:50]}")
        except Exception as e:
            logger.warning(f"서버 STT 처리 실패: {e}")
            content = "음성 답변이 전달되었어요."
            transcript = content

    q = db.query(Question).filter(Question.id == data.question_id).first()

    resp = Response(
        question_id=data.question_id,
        member_id=data.member_id,
        content=content,
        input_method=data.input_method,
        audio_file_path=data.audio_file_path,
        transcript=transcript,
        era=data.era,
        duration=data.duration,
    )
    db.add(resp)

    if q:
        q.status = "answered"

    db.commit()
    db.refresh(resp)
    logger.info(f"답변 생성: {resp.id} / 질문={resp.question_id} / 방식={resp.input_method}")
    return resp


@router.get("/responses", response_model=list[ResponseOut])
def list_responses(
    question_id: str | None = None,
    family_id: str | None = None,
    member_id: str | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(Response)
    if question_id:
        query = query.filter(Response.question_id == question_id)
    if member_id:
        query = query.filter(Response.member_id == member_id)
    if family_id:
        query = (
            query.join(Question, Response.question_id == Question.id)
            .filter(Question.family_id == family_id)
        )
    return query.order_by(Response.created_at.desc()).all()


@router.get("/responses/stats")
def response_stats(family_id: str, db: Session = Depends(get_db)):
    pending = (
        db.query(Question)
        .filter(Question.family_id == family_id, Question.status == "pending")
        .count()
    )
    answered = (
        db.query(Question)
        .filter(Question.family_id == family_id, Question.status == "answered")
        .count()
    )
    return {"pending": pending, "answered": answered}


# ── 스토리북 생성 (LLM) ──
from pydantic import BaseModel as PydBaseModel
from models import Story


class StorybookRequest(PydBaseModel):
    family_id: str


class StoryChapter(PydBaseModel):
    category: str
    label: str
    title: str
    body: str
    count: int
    has_new: bool = False


class StorybookResponse(PydBaseModel):
    chapters: list[StoryChapter]


_CATEGORY_LABELS = {
    "childhood": "유년기",
    "youth": "청년시절",
    "twilight": "황혼기",
}


def _generate_chapter_llm(cat: str, items: list[tuple[str, str]]) -> tuple[str, str]:
    """LLM으로 스토리 생성 → (title, body) 반환."""
    label = _CATEGORY_LABELS[cat]
    qa_text = "\n".join(f"Q: {q}\nA: {a}" for q, a in items)
    try:
        import ollama
        prompt = (
            f"부모님의 {label} 답변들을 바탕으로 한국어 1인칭 회상체 스토리를 작성.\n"
            f"형식: 제목: [제목]\\n[본문]\n"
            f"본문 200~300자, 마크다운 금지.\n\n"
            f"{qa_text}\n"
        )
        resp = ollama.chat(model="qwen2.5", messages=[{"role": "user", "content": prompt}])
        raw = resp["message"]["content"].strip()
        time.sleep(1)  # ponytail: LLM 연속 호출 시 응답 안정화 대기
        title = f"{label}의 기억"
        body = raw
        # "제목:" 라인을 찾아 분리
        for i, line in enumerate(raw.split("\n")):
            if line.strip().startswith("제목:"):
                title = line.replace("제목:", "").strip()
                body = "\n".join(raw.split("\n")[i + 1:]).strip()
                break
        # 마크다운 잔여물 제거
        body = body.replace("**", "").replace("#", "").strip()
        return title, body
    except Exception as e:
        logger.warning(f"LLM 스토리 생성 실패 ({cat}): {e}")
        return f"{label}의 기억", " ".join(a for _, a in items)


def _get_grouped_responses(db: Session, family_id: str) -> dict[str, list[tuple[str, str]]]:
    """가족의 답변을 카테고리별로 그룹화하여 반환."""
    rows = (
        db.query(Question, Response)
        .join(Response, Response.question_id == Question.id)
        .filter(Question.family_id == family_id)
        .order_by(Response.created_at.asc())
        .all()
    )
    grouped: dict[str, list[tuple[str, str]]] = {}
    for q, r in rows:
        cat = q.category or "twilight"
        if cat not in _CATEGORY_LABELS:
            cat = "twilight"
        grouped.setdefault(cat, []).append((q.content, r.content or r.transcript or ""))
    return grouped


@router.get("/storybook", response_model=StorybookResponse)
def get_storybook(family_id: str, db: Session = Depends(get_db)):
    """저장된 스토리북 조회. 새 답변이 있으면 has_new=true."""
    grouped = _get_grouped_responses(db, family_id)
    stories = {s.category: s for s in db.query(Story).filter(Story.family_id == family_id).all()}

    chapters: list[StoryChapter] = []
    for cat in ["childhood", "youth", "twilight"]:
        items = grouped.get(cat, [])
        story = stories.get(cat)
        if not story and not items:
            continue
        if not story:
            # 답변은 있지만 스토리가 아직 없음 → 생성 필요
            chapters.append(StoryChapter(
                category=cat,
                label=_CATEGORY_LABELS[cat],
                title=f"{_CATEGORY_LABELS[cat]}의 기억",
                body="",
                count=0,
                has_new=True,
            ))
            continue
        has_new = len(items) > story.response_count
        chapters.append(StoryChapter(
            category=cat,
            label=_CATEGORY_LABELS[cat],
            title=story.title,
            body=story.body,
            count=story.response_count,
            has_new=has_new,
        ))
    return StorybookResponse(chapters=chapters)


@router.post("/storybook", response_model=StorybookResponse)
def generate_storybook(data: StorybookRequest, db: Session = Depends(get_db)):
    """스토리북 생성 또는 업데이트. 기존 스토리가 있고 새 답변이 있으면 업데이트."""
    grouped = _get_grouped_responses(db, data.family_id)
    stories = {s.category: s for s in db.query(Story).filter(Story.family_id == data.family_id).all()}

    chapters: list[StoryChapter] = []
    for cat in ["childhood", "youth", "twilight"]:
        items = grouped.get(cat, [])
        if not items:
            continue

        story = stories.get(cat)
        need_update = not story or len(items) > story.response_count

        if need_update:
            title, body = _generate_chapter_llm(cat, items)
            time.sleep(2)  # ponytail: 카테고리별 LLM 순차 처리 안정화
            if story:
                story.title = title
                story.body = body
                story.response_count = len(items)
            else:
                story = Story(
                    family_id=data.family_id,
                    category=cat,
                    title=title,
                    body=body,
                    response_count=len(items),
                )
                db.add(story)
            db.commit()
            db.refresh(story)

        chapters.append(StoryChapter(
            category=cat,
            label=_CATEGORY_LABELS[cat],
            title=story.title,
            body=story.body,
            count=story.response_count,
            has_new=False,
        ))
    return StorybookResponse(chapters=chapters)
