"""STT/TTS/업로드 API - Python 모듈과 연계"""
import os
import sys
import uuid

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from logger import get_logger
from models import Photo
from schemas import STTRequest, STTResponse, TTSRequest, TTSResponse

logger = get_logger("eum.voice")
router = APIRouter(prefix="/api", tags=["voice"])

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uploads")
AUDIO_DIR = os.path.join(UPLOAD_DIR, "audio")
IMAGE_DIR = os.path.join(UPLOAD_DIR, "images")


@router.post("/stt/transcribe", response_model=STTResponse)
def stt_transcribe(data: STTRequest):
    try:
        from stt.file_transcribe import transcribe

        text = transcribe(data.file_path, engine=data.engine, language=data.language)
        logger.info(f"STT 변환 완료: engine={data.engine} / text={text[:50]}")
        return STTResponse(text=text, audio_file_path=data.file_path)
    except Exception as e:
        logger.error(f"STT 변환 실패: {e}")
        raise HTTPException(500, f"STT 변환 실패: {e}")


@router.post("/tts/synthesize", response_model=TTSResponse)
def tts_synthesize(data: TTSRequest):
    try:
        from tts.tts_engine import text_to_speech

        import uuid

        project_root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        audio_dir = os.path.join(project_root, "uploads", "audio")
        filename = f"tts_{uuid.uuid4().hex}.mp3"
        output_path = os.path.join(audio_dir, filename)

        text_to_speech(data.text, output_path=output_path)
        logger.info(f"TTS 합성 완료: {filename} / text={data.text[:50]}")
        return TTSResponse(audio_url=f"/api/audio/{filename}")
    except Exception as e:
        logger.error(f"TTS 합성 실패: {e}")
        raise HTTPException(500, f"TTS 변환 실패: {e}")


@router.post("/uploads/audio")
async def upload_audio(file: UploadFile = File(...)):
    os.makedirs(AUDIO_DIR, exist_ok=True)
    content = await file.read()

    ext = os.path.splitext(file.filename or "audio.wav")[1] or ".wav"
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(AUDIO_DIR, filename)

    with open(filepath, "wb") as f:
        f.write(content)

    logger.info(f"오디오 업로드: {filename} ({len(content)} bytes)")
    return {"success": True, "file_path": filepath, "filename": filename, "url": f"/api/audio/{filename}"}


@router.post("/uploads/image")
async def upload_image(file: UploadFile = File(...), family_id: str = "", who: str = "", label: str = "", db: Session = Depends(get_db)):
    os.makedirs(IMAGE_DIR, exist_ok=True)
    content = await file.read()

    ext = os.path.splitext(file.filename or "image.jpg")[1] or ".jpg"
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(IMAGE_DIR, filename)

    with open(filepath, "wb") as f:
        f.write(content)

    url = f"/api/image/{filename}"

    if family_id:
        photo = Photo(
            family_id=family_id,
            url=url,
            label=label or None,
            who=who or None,
        )
        db.add(photo)
        db.commit()

    logger.info(f"이미지 업로드: {filename} / family={family_id}")
    return {"success": True, "url": url, "filename": filename}
