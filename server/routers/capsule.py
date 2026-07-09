"""타임캡슐 API"""
import os
import sys
from datetime import date

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Capsule
from schemas import CapsuleCreate, CapsuleOut

router = APIRouter(prefix="/api/capsules", tags=["capsule"])


@router.post("", response_model=CapsuleOut)
def create_capsule(data: CapsuleCreate, db: Session = Depends(get_db)):
    today = date.today()
    status = "ready" if data.open_date <= today else "locked"
    cap = Capsule(
        family_id=data.family_id,
        from_member_id=data.from_member_id,
        to_member_id=data.to_member_id,
        title=data.title,
        audio_file_path=data.audio_file_path,
        open_date=data.open_date,
        duration=data.duration,
        status=status,
    )
    db.add(cap)
    db.commit()
    db.refresh(cap)
    return cap


@router.get("", response_model=list[CapsuleOut])
def list_capsules(family_id: str, db: Session = Depends(get_db)):
    today = date.today()
    caps = db.query(Capsule).filter(Capsule.family_id == family_id).all()
    for c in caps:
        if c.status == "locked" and c.open_date <= today:
            c.status = "ready"
    db.commit()
    return caps


@router.get("/ready", response_model=list[CapsuleOut])
def list_ready(family_id: str, db: Session = Depends(get_db)):
    today = date.today()
    caps = (
        db.query(Capsule)
        .filter(Capsule.family_id == family_id, Capsule.open_date <= today, Capsule.status != "open")
        .all()
    )
    for c in caps:
        c.status = "ready"
    db.commit()
    return caps


@router.get("/{cid}", response_model=CapsuleOut)
def get_capsule(cid: str, db: Session = Depends(get_db)):
    cap = db.query(Capsule).filter(Capsule.id == cid).first()
    if not cap:
        raise HTTPException(404, "캡슐을 찾을 수 없습니다")
    if cap.status == "locked" and cap.open_date <= date.today():
        cap.status = "ready"
        db.commit()
    return cap


@router.post("/{cid}/open")
def open_capsule(cid: str, db: Session = Depends(get_db)):
    cap = db.query(Capsule).filter(Capsule.id == cid).first()
    if not cap:
        raise HTTPException(404, "캡슐을 찾을 수 없습니다")
    if cap.status == "locked":
        raise HTTPException(400, "아직 열 수 없는 캡슐입니다")
    cap.status = "open"
    db.commit()
    return {"success": True}
