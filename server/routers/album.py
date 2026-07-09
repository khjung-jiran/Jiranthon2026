"""앨범 API"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Photo
from schemas import PhotoOut

router = APIRouter(prefix="/api/album", tags=["album"])


@router.get("", response_model=list[PhotoOut])
def list_photos(family_id: str, who: str | None = None, db: Session = Depends(get_db)):
    query = db.query(Photo).filter(Photo.family_id == family_id)
    if who and who != "전체":
        query = query.filter(Photo.who == who)
    return query.order_by(Photo.created_at.desc()).all()


@router.delete("/{pid}")
def delete_photo(pid: str, db: Session = Depends(get_db)):
    photo = db.query(Photo).filter(Photo.id == pid).first()
    if not photo:
        raise HTTPException(404, "사진을 찾을 수 없습니다")
    db.delete(photo)
    db.commit()
    return {"success": True}
