"""가족 투표 API"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Poll, PollOption, PollVote
from schemas import PollCreate, PollOut, PollVoteCreate

router = APIRouter(prefix="/api/polls", tags=["poll"])


@router.post("", response_model=PollOut)
def create_poll(data: PollCreate, db: Session = Depends(get_db)):
    poll = Poll(
        family_id=data.family_id,
        title=data.title,
        created_by=data.created_by,
        deadline=data.deadline,
    )
    db.add(poll)
    db.commit()
    db.refresh(poll)

    for label in data.options:
        opt = PollOption(poll_id=poll.id, label=label)
        db.add(opt)
    db.commit()
    db.refresh(poll)
    return poll


@router.get("", response_model=list[PollOut])
def list_polls(family_id: str, db: Session = Depends(get_db)):
    return db.query(Poll).filter(Poll.family_id == family_id).order_by(Poll.created_at.desc()).all()


@router.get("/{pid}", response_model=PollOut)
def get_poll(pid: str, db: Session = Depends(get_db)):
    poll = db.query(Poll).filter(Poll.id == pid).first()
    if not poll:
        raise HTTPException(404, "투표를 찾을 수 없습니다")
    return poll


@router.post("/{pid}/vote")
def vote(pid: str, data: PollVoteCreate, db: Session = Depends(get_db)):
    existing = db.query(PollVote).filter(
        PollVote.poll_id == pid, PollVote.member_id == data.member_id
    ).first()

    if existing:
        opt = db.query(PollOption).filter(PollOption.id == existing.option_id).first()
        if opt:
            opt.vote_count = max(0, opt.vote_count - 1)
        db.delete(existing)

    new_vote = PollVote(poll_id=pid, option_id=data.option_id, member_id=data.member_id)
    db.add(new_vote)

    opt = db.query(PollOption).filter(PollOption.id == data.option_id).first()
    if opt:
        opt.vote_count += 1

    db.commit()
    return {"success": True}
