"""
Pydantic 스키마 - API 요청/응답 검증
"""

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel


# --- Family ---
class FamilyCreate(BaseModel):
    name: str


class FamilyOut(BaseModel):
    id: str
    name: str
    invite_code: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True


# --- Member ---
class MemberCreate(BaseModel):
    family_id: str
    name: str
    role: str  # parent / child
    username: Optional[str] = None
    password: Optional[str] = None
    birth_date: Optional[date] = None
    profile_image: Optional[str] = None


class MemberOut(BaseModel):
    id: str
    family_id: str
    name: str
    role: str
    username: Optional[str] = None
    birth_date: Optional[date] = None
    profile_image: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True


# --- Auth ---
class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    member: MemberOut
    family: FamilyOut
    invite_code: Optional[str] = None


# --- Question ---
class QuestionCreate(BaseModel):
    family_id: str
    content: str
    category: Optional[str] = None
    source: str = "manual"
    from_member_id: str
    to_member_id: str


class QuestionOut(BaseModel):
    id: str
    family_id: str
    content: str
    category: Optional[str] = None
    source: str
    from_member_id: str
    to_member_id: str
    status: str
    created_at: datetime
    class Config:
        from_attributes = True


# --- Response ---
class ResponseCreate(BaseModel):
    question_id: str
    member_id: str
    content: str
    input_method: str = "text"
    audio_file_path: Optional[str] = None
    transcript: Optional[str] = None
    era: Optional[str] = None
    duration: Optional[str] = None


class ResponseOut(BaseModel):
    id: str
    question_id: str
    member_id: str
    content: str
    input_method: str
    audio_file_path: Optional[str] = None
    transcript: Optional[str] = None
    era: Optional[str] = None
    duration: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True


# --- Capsule ---
class CapsuleCreate(BaseModel):
    family_id: str
    from_member_id: str
    to_member_id: str
    title: str
    audio_file_path: Optional[str] = None
    open_date: date
    duration: Optional[str] = None


class CapsuleOut(BaseModel):
    id: str
    family_id: str
    from_member_id: str
    to_member_id: str
    title: str
    audio_file_path: Optional[str] = None
    open_date: date
    status: str
    duration: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True


# --- Calendar ---
class CalendarEntryCreate(BaseModel):
    family_id: str
    date: date
    title: str
    created_by: str
    tag: Optional[str] = None
    color: Optional[str] = None


class CalendarEntryOut(BaseModel):
    id: str
    family_id: str
    date: date
    title: str
    created_by: str
    tag: Optional[str] = None
    color: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True


# --- Photo ---
class PhotoOut(BaseModel):
    id: str
    family_id: str
    url: str
    label: Optional[str] = None
    who: Optional[str] = None
    tone: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True


# --- Notification ---
class NotificationCreate(BaseModel):
    member_id: str
    type: str
    title: str
    icon: Optional[str] = None
    color: Optional[str] = None
    nav_target: Optional[str] = None


class NotificationOut(BaseModel):
    id: str
    member_id: str
    type: str
    title: str
    icon: Optional[str] = None
    color: Optional[str] = None
    is_read: bool
    nav_target: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True


# --- Poll ---
class PollCreate(BaseModel):
    family_id: str
    title: str
    created_by: str
    options: list[str]
    deadline: Optional[datetime] = None


class PollOptionOut(BaseModel):
    id: str
    label: str
    vote_count: int
    class Config:
        from_attributes = True


class PollOut(BaseModel):
    id: str
    family_id: str
    title: str
    deadline: Optional[datetime] = None
    created_by: str
    created_at: datetime
    options: list[PollOptionOut]
    class Config:
        from_attributes = True


class PollVoteCreate(BaseModel):
    member_id: str
    option_id: str


# --- Settings ---
class SettingsUpdate(BaseModel):
    font_size: Optional[str] = None
    voice_guide: Optional[bool] = None
    auto_translate: Optional[bool] = None


class SettingsOut(BaseModel):
    member_id: str
    font_size: str
    voice_guide: bool
    auto_translate: bool
    class Config:
        from_attributes = True


# --- STT/TTS ---
class STTRequest(BaseModel):
    file_path: str
    engine: str = "whisper"
    language: str = "ko"


class STTResponse(BaseModel):
    text: str
    audio_file_path: str


class TTSRequest(BaseModel):
    text: str
    language: str = "ko"


class TTSResponse(BaseModel):
    audio_url: str


# --- AI Question ---
class AIQuestionRequest(BaseModel):
    category: Optional[str] = None
    count: int = 4
    from_member_id: Optional[str] = None
    to_member_id: Optional[str] = None


# --- Common ---
class APIResult(BaseModel):
    success: bool = True
    message: str = ""
    data: Optional[dict] = None


# --- Story ---
class StoryOut(BaseModel):
    id: str
    family_id: str
    category: str
    title: str
    body: str
    response_count: int
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True
