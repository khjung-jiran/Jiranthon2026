"""알림 API"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Notification
from schemas import NotificationCreate, NotificationOut

router = APIRouter(prefix="/api/notifications", tags=["notification"])


@router.post("", response_model=NotificationOut)
def create_notification(data: NotificationCreate, db: Session = Depends(get_db)):
    n = Notification(
        member_id=data.member_id,
        type=data.type,
        title=data.title,
        icon=data.icon,
        color=data.color,
        nav_target=data.nav_target,
    )
    db.add(n)
    db.commit()
    db.refresh(n)
    return n


@router.get("", response_model=list[NotificationOut])
def list_notifications(member_id: str, db: Session = Depends(get_db)):
    return (
        db.query(Notification)
        .filter(Notification.member_id == member_id)
        .order_by(Notification.created_at.desc())
        .all()
    )


@router.get("/unread-count")
def unread_count(member_id: str, db: Session = Depends(get_db)):
    count = (
        db.query(Notification)
        .filter(Notification.member_id == member_id, Notification.is_read == False)
        .count()
    )
    return {"count": count}


@router.post("/{nid}/read")
def mark_read(nid: str, db: Session = Depends(get_db)):
    n = db.query(Notification).filter(Notification.id == nid).first()
    if not n:
        raise HTTPException(404, "알림을 찾을 수 없습니다")
    n.is_read = True
    db.commit()
    return {"success": True}


@router.post("/read-all")
def mark_all_read(member_id: str, db: Session = Depends(get_db)):
    db.query(Notification).filter(
        Notification.member_id == member_id, Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"success": True}
