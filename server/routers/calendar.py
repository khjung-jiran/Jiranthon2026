"""캘린더 API"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import CalendarEntry
from schemas import CalendarEntryCreate, CalendarEntryOut

router = APIRouter(prefix="/api/calendar", tags=["calendar"])


@router.post("/entries", response_model=CalendarEntryOut)
def create_entry(data: CalendarEntryCreate, db: Session = Depends(get_db)):
    entry = CalendarEntry(
        family_id=data.family_id,
        date=data.date,
        title=data.title,
        created_by=data.created_by,
        tag=data.tag,
        color=data.color,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.get("/entries", response_model=list[CalendarEntryOut])
def list_entries(
    family_id: str,
    month: str | None = None,
    upcoming: bool = False,
    db: Session = Depends(get_db),
):
    from datetime import date

    query = db.query(CalendarEntry).filter(CalendarEntry.family_id == family_id)
    if month:
        y, m = month.split("-")
        query = query.filter(
            CalendarEntry.date >= date(int(y), int(m), 1),
            CalendarEntry.date <= date(int(y), int(m), 31),
        )
    if upcoming:
        query = query.filter(CalendarEntry.date >= date.today())
    return query.order_by(CalendarEntry.date.asc()).all()


@router.delete("/entries/{eid}")
def delete_entry(eid: str, db: Session = Depends(get_db)):
    entry = db.query(CalendarEntry).filter(CalendarEntry.id == eid).first()
    if not entry:
        raise HTTPException(404, "일정을 찾을 수 없습니다")
    db.delete(entry)
    db.commit()
    return {"success": True}
