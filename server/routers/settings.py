"""설정 API"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import MemberSettings
from schemas import SettingsOut, SettingsUpdate

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("", response_model=SettingsOut)
def get_settings(member_id: str, db: Session = Depends(get_db)):
    s = db.query(MemberSettings).filter(MemberSettings.member_id == member_id).first()
    if not s:
        s = MemberSettings(member_id=member_id)
        db.add(s)
        db.commit()
        db.refresh(s)
    return s


@router.put("")
def update_settings(member_id: str, data: SettingsUpdate, db: Session = Depends(get_db)):
    s = db.query(MemberSettings).filter(MemberSettings.member_id == member_id).first()
    if not s:
        s = MemberSettings(member_id=member_id)
        db.add(s)
        db.commit()
        db.refresh(s)

    if data.font_size is not None:
        s.font_size = data.font_size
    if data.voice_guide is not None:
        s.voice_guide = data.voice_guide
    if data.auto_translate is not None:
        s.auto_translate = data.auto_translate

    db.commit()
    return {"success": True}
