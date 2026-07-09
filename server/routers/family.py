"""가족/구성원 API"""
import os
import sys
import secrets
import hashlib

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from logger import get_logger
from models import Family, Member, MemberSettings
from schemas import (
    FamilyCreate,
    FamilyOut,
    LoginRequest,
    LoginResponse,
    MemberCreate,
    MemberOut,
)

logger = get_logger("eum.family")
router = APIRouter(prefix="/api", tags=["family"])


def _hash_pw(pw: str) -> str:
    return hashlib.sha256(pw.encode("utf-8")).hexdigest()


@router.post("/families", response_model=FamilyOut)
def create_family(data: FamilyCreate, db: Session = Depends(get_db)):
    family = Family(name=data.name, invite_code=secrets.token_hex(4).upper())
    db.add(family)
    db.commit()
    db.refresh(family)
    logger.info(f"가족 생성: {family.id} / 이름={family.name} / 초대코드={family.invite_code}")
    return family


@router.get("/families/{family_id}", response_model=FamilyOut)
def get_family(family_id: str, db: Session = Depends(get_db)):
    family = db.query(Family).filter(Family.id == family_id).first()
    if not family:
        raise HTTPException(404, "가족을 찾을 수 없습니다")
    return family


@router.get("/families/{family_id}/invite-code")
def get_invite_code(family_id: str, db: Session = Depends(get_db)):
    family = db.query(Family).filter(Family.id == family_id).first()
    if not family:
        raise HTTPException(404, "가족을 찾을 수 없습니다")
    return {"invite_code": family.invite_code}


@router.post("/families/join", response_model=FamilyOut)
def join_family(invite_code: str, db: Session = Depends(get_db)):
    family = db.query(Family).filter(Family.invite_code == invite_code).first()
    if not family:
        raise HTTPException(404, "잘못된 초대 코드입니다")
    return family


@router.post("/members", response_model=MemberOut)
def create_member(data: MemberCreate, db: Session = Depends(get_db)):
    if data.username:
        existing = db.query(Member).filter(Member.username == data.username).first()
        if existing:
            raise HTTPException(409, "이미 사용 중인 아이디입니다")

    member = Member(
        family_id=data.family_id,
        name=data.name,
        role=data.role,
        username=data.username,
        password_hash=_hash_pw(data.password) if data.password else None,
        birth_date=data.birth_date,
        profile_image=data.profile_image,
    )
    db.add(member)
    db.commit()
    db.refresh(member)

    settings = MemberSettings(member_id=member.id)
    db.add(settings)
    db.commit()

    logger.info(f"멤버 생성: {member.id} / 이름={member.name} / 아이디={member.username} / 역할={member.role} / 가족={member.family_id}")
    return member


@router.post("/auth/login", response_model=LoginResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    member = db.query(Member).filter(Member.username == data.username).first()
    if not member or not member.password_hash:
        raise HTTPException(401, "아이디 또는 비밀번호가 올바르지 않습니다")
    if member.password_hash != _hash_pw(data.password):
        raise HTTPException(401, "아이디 또는 비밀번호가 올바르지 않습니다")

    family = db.query(Family).filter(Family.id == member.family_id).first()
    logger.info(f"로그인: {member.username} / 멤버={member.id}")
    return LoginResponse(
        member=MemberOut.model_validate(member),
        family=FamilyOut.model_validate(family) if family else None,
        invite_code=family.invite_code if family else None,
    )


@router.get("/families/{family_id}/members", response_model=list[MemberOut])
def list_members(family_id: str, db: Session = Depends(get_db)):
    return db.query(Member).filter(Member.family_id == family_id).all()
