"""
SQLAlchemy 데이터베이스 모델 - 이음 앱 전체 스키마
"""

import os
import sys
from datetime import date, datetime
from uuid import uuid4

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from database import Base


def _uuid():
    return str(uuid4())


class Family(Base):
    __tablename__ = "families"

    id = Column(String, primary_key=True, default=_uuid)
    name = Column(String, nullable=False)
    invite_code = Column(String, unique=True, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    members = relationship("Member", back_populates="family")
    questions = relationship("Question", back_populates="family")
    capsules = relationship("Capsule", back_populates="family")
    calendar_entries = relationship("CalendarEntry", back_populates="family")
    photos = relationship("Photo", back_populates="family")
    polls = relationship("Poll", back_populates="family")
    notifications = relationship("Notification", back_populates="family")


class Member(Base):
    __tablename__ = "members"

    id = Column(String, primary_key=True, default=_uuid)
    family_id = Column(String, ForeignKey("families.id"), nullable=False)
    name = Column(String, nullable=False)
    role = Column(String, nullable=False)  # parent / child
    username = Column(String, unique=True, nullable=True)
    password_hash = Column(String, nullable=True)
    birth_date = Column(Date, nullable=True)
    profile_image = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    family = relationship("Family", back_populates="members")
    questions_sent = relationship("Question", back_populates="from_member", foreign_keys="Question.from_member_id")
    questions_received = relationship("Question", back_populates="to_member", foreign_keys="Question.to_member_id")
    responses = relationship("Response", back_populates="member")
    capsules_sent = relationship("Capsule", back_populates="from_member", foreign_keys="Capsule.from_member_id")
    capsules_received = relationship("Capsule", back_populates="to_member", foreign_keys="Capsule.to_member_id")
    calendar_entries = relationship("CalendarEntry", back_populates="creator")
    photos = relationship("Photo", back_populates="uploader")
    poll_votes = relationship("PollVote", back_populates="member")
    notifications = relationship("Notification", back_populates="member")
    settings = relationship("MemberSettings", back_populates="member", uselist=False)


class Question(Base):
    __tablename__ = "questions"

    id = Column(String, primary_key=True, default=_uuid)
    family_id = Column(String, ForeignKey("families.id"), nullable=False)
    content = Column(Text, nullable=False)
    category = Column(String, nullable=True)
    source = Column(String, default="manual")  # manual / auto / ai
    from_member_id = Column(String, ForeignKey("members.id"), nullable=False)
    to_member_id = Column(String, ForeignKey("members.id"), nullable=False)
    status = Column(String, default="pending")  # pending / answered
    created_at = Column(DateTime, default=datetime.utcnow)

    family = relationship("Family", back_populates="questions")
    from_member = relationship("Member", back_populates="questions_sent", foreign_keys=[from_member_id])
    to_member = relationship("Member", back_populates="questions_received", foreign_keys=[to_member_id])
    responses = relationship("Response", back_populates="question")


class Response(Base):
    __tablename__ = "responses"

    id = Column(String, primary_key=True, default=_uuid)
    question_id = Column(String, ForeignKey("questions.id"), nullable=False)
    member_id = Column(String, ForeignKey("members.id"), nullable=False)
    content = Column(Text, nullable=False)
    input_method = Column(String, default="text")  # stt / text
    audio_file_path = Column(String, nullable=True)
    transcript = Column(Text, nullable=True)
    transcript_en = Column(Text, nullable=True)
    era = Column(String, nullable=True)  # 유년기 / 청소년기 / 청년시절 / 부모시절
    duration = Column(String, nullable=True)  # "0:48"
    created_at = Column(DateTime, default=datetime.utcnow)

    question = relationship("Question", back_populates="responses")
    member = relationship("Member", back_populates="responses")


class Capsule(Base):
    __tablename__ = "capsules"

    id = Column(String, primary_key=True, default=_uuid)
    family_id = Column(String, ForeignKey("families.id"), nullable=False)
    from_member_id = Column(String, ForeignKey("members.id"), nullable=False)
    to_member_id = Column(String, ForeignKey("members.id"), nullable=False)
    title = Column(String, nullable=False)
    audio_file_path = Column(String, nullable=True)
    open_date = Column(Date, nullable=False)
    status = Column(String, default="locked")  # locked / ready / open
    duration = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    family = relationship("Family", back_populates="capsules")
    from_member = relationship("Member", back_populates="capsules_sent", foreign_keys=[from_member_id])
    to_member = relationship("Member", back_populates="capsules_received", foreign_keys=[to_member_id])


class CalendarEntry(Base):
    __tablename__ = "calendar_entries"

    id = Column(String, primary_key=True, default=_uuid)
    family_id = Column(String, ForeignKey("families.id"), nullable=False)
    date = Column(Date, nullable=False)
    title = Column(String, nullable=False)
    created_by = Column(String, ForeignKey("members.id"), nullable=False)
    tag = Column(String, nullable=True)  # 생일 / 모임 / 여행
    color = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    family = relationship("Family", back_populates="calendar_entries")
    creator = relationship("Member", back_populates="calendar_entries")


class Photo(Base):
    __tablename__ = "photos"

    id = Column(String, primary_key=True, default=_uuid)
    family_id = Column(String, ForeignKey("families.id"), nullable=False)
    url = Column(String, nullable=False)
    label = Column(String, nullable=True)
    who = Column(String, nullable=True)  # 엄마 / 아빠 / 지훈 / 서연
    tone = Column(String, nullable=True)
    uploaded_by = Column(String, ForeignKey("members.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    family = relationship("Family", back_populates="photos")
    uploader = relationship("Member", back_populates="photos")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, default=_uuid)
    family_id = Column(String, ForeignKey("families.id"), nullable=True)
    member_id = Column(String, ForeignKey("members.id"), nullable=False)
    type = Column(String, nullable=False)  # question / response / capsule / poll / face
    title = Column(String, nullable=False)
    icon = Column(String, nullable=True)
    color = Column(String, nullable=True)
    is_read = Column(Boolean, default=False)
    nav_target = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    family = relationship("Family", back_populates="notifications")
    member = relationship("Member", back_populates="notifications")


class Poll(Base):
    __tablename__ = "polls"

    id = Column(String, primary_key=True, default=_uuid)
    family_id = Column(String, ForeignKey("families.id"), nullable=False)
    title = Column(String, nullable=False)
    deadline = Column(DateTime, nullable=True)
    created_by = Column(String, ForeignKey("members.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    family = relationship("Family", back_populates="polls")
    options = relationship("PollOption", back_populates="poll")
    votes = relationship("PollVote", back_populates="poll")


class PollOption(Base):
    __tablename__ = "poll_options"

    id = Column(String, primary_key=True, default=_uuid)
    poll_id = Column(String, ForeignKey("polls.id"), nullable=False)
    label = Column(String, nullable=False)
    vote_count = Column(Integer, default=0)

    poll = relationship("Poll", back_populates="options")
    votes = relationship("PollVote", back_populates="option")


class PollVote(Base):
    __tablename__ = "poll_votes"

    id = Column(String, primary_key=True, default=_uuid)
    poll_id = Column(String, ForeignKey("polls.id"), nullable=False)
    option_id = Column(String, ForeignKey("poll_options.id"), nullable=False)
    member_id = Column(String, ForeignKey("members.id"), nullable=False)

    poll = relationship("Poll", back_populates="votes")
    option = relationship("PollOption", back_populates="votes")
    member = relationship("Member", back_populates="poll_votes")


class MemberSettings(Base):
    __tablename__ = "member_settings"

    id = Column(String, primary_key=True, default=_uuid)
    member_id = Column(String, ForeignKey("members.id"), nullable=False, unique=True)
    font_size = Column(String, default="보통")  # 보통 / 크게 / 아주 크게
    voice_guide = Column(Boolean, default=True)
    auto_translate = Column(Boolean, default=False)

    member = relationship("Member", back_populates="settings")


class Story(Base):
    __tablename__ = "stories"

    id = Column(String, primary_key=True, default=_uuid)
    family_id = Column(String, ForeignKey("families.id"), nullable=False)
    category = Column(String, nullable=False)  # childhood / youth / twilight
    title = Column(String, nullable=False)
    body = Column(Text, nullable=False)
    response_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
