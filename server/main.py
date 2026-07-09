"""
FastAPI 앱 진입점 - 이음 백엔드 서버
"""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, os.path.dirname(__file__))

from logger import get_logger
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from database import Base, engine
from routers import (
    album,
    calendar,
    capsule,
    family,
    notification,
    poll,
    question,
    settings,
    voice,
)

logger = get_logger("eum.server")

Base.metadata.create_all(bind=engine)

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(os.path.join(UPLOAD_DIR, "audio"), exist_ok=True)
os.makedirs(os.path.join(UPLOAD_DIR, "images"), exist_ok=True)

app = FastAPI(
    title="이음 API",
    description="목소리로 잇는 우리 가족 이야기",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/api/audio", StaticFiles(directory=os.path.join(UPLOAD_DIR, "audio")), name="audio")
app.mount("/api/image", StaticFiles(directory=os.path.join(UPLOAD_DIR, "images")), name="image")

app.include_router(family.router)
app.include_router(question.router)
app.include_router(capsule.router)
app.include_router(calendar.router)
app.include_router(album.router)
app.include_router(notification.router)
app.include_router(poll.router)
app.include_router(settings.router)
app.include_router(voice.router)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"{request.method} {request.url.path}")
    try:
        response = await call_next(request)
        if response.status_code >= 400:
            logger.warning(f"{request.method} {request.url.path} -> {response.status_code}")
        return response
    except Exception as e:
        logger.error(f"{request.method} {request.url.path} -> 500: {e}")
        raise


@app.get("/")
def root():
    return {"service": "이음 API", "docs": "/docs"}


@app.on_event("startup")
async def startup():
    logger.info("서버 시작: http://localhost:8000")
