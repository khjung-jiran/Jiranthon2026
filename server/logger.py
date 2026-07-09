"""
로깅 설정 - 파일 + 콘솔 동시 출력
"""
import logging
import os
from datetime import datetime

LOG_DIR = os.path.join(os.path.dirname(__file__), "..", "logs")
os.makedirs(LOG_DIR, exist_ok=True)

LOG_FILE = os.path.join(LOG_DIR, f"server_{datetime.now().strftime('%Y%m%d')}.log")

fmt = logging.Formatter(
    "%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

file_handler = logging.FileHandler(LOG_FILE, encoding="utf-8")
file_handler.setFormatter(fmt)

console_handler = logging.StreamHandler()
console_handler.setFormatter(fmt)

logging.basicConfig(
    level=logging.INFO,
    handlers=[file_handler, console_handler],
)

def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)
