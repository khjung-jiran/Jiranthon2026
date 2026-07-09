"""질문/응답 API + AI 추천 질문"""
import os
import sys

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


@router.post("/questions", response_model=QuestionOut)
def create_question(data: QuestionCreate, db: Session = Depends(get_db)):
    q = Question(
        family_id=data.family_id,
        content=data.content,
        category=data.category,
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


@router.get("/questions/ai-suggestions")
def get_ai_suggestions(
    category: str | None = None,
    count: int = 4,
    from_member_id: str | None = None,
    to_member_id: str | None = None,
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

        questions = generate_questions(
            count=count,
            category=category,
            from_member_id=from_member_id or "",
            to_member_id=to_member_id or "",
        )
        return {"questions": questions}
    except Exception as e:
        raise HTTPException(500, f"질문 생성 실패: {e}")


@router.post("/responses", response_model=ResponseOut)
def create_response(data: ResponseCreate, db: Session = Depends(get_db)):
    resp = Response(
        question_id=data.question_id,
        member_id=data.member_id,
        content=data.content,
        input_method=data.input_method,
        audio_file_path=data.audio_file_path,
        transcript=data.transcript,
        era=data.era,
        duration=data.duration,
    )
    db.add(resp)

    q = db.query(Question).filter(Question.id == data.question_id).first()
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
