import logging
import os
from pathlib import Path

logger = logging.getLogger(__name__)

SAFE_EXTENSIONS = [
    ".aac",
    ".bmp",
    ".csv",
    ".doc",
    ".docx",
    ".flac",
    ".gif",
    ".hocr",
    ".htm",
    ".html",
    ".jpeg",
    ".jpg",
    ".json",
    ".m4a",
    ".m4v",
    ".md",
    ".mkv",
    ".mov",
    ".mp3",
    ".mp4",
    ".odp",
    ".ods",
    ".odt",
    ".oga",
    ".ogg",
    ".opus",
    ".pdf",
    ".png",
    ".ppt",
    ".pptx",
    ".rtf",
    ".svg",
    ".tif",
    ".tiff",
    ".txt",
    ".wav",
    ".webm",
    ".webp",
    ".xls",
    ".xlsx",
    ".xml",
    ".zip",
]


def get_bool(key, default="NO"):
    """
    Returns True if environment variable named KEY is one of
    "yes", "y", "t", "true" (lowercase of uppercase)

    otherwise returns False
    """
    env_var_value = os.getenv(key, default).lower()
    YES_VALUES = ("yes", "y", "1", "t", "true")
    if env_var_value in YES_VALUES:
        return True

    return False


def safe_to_delete(path: Path) -> True:
    if not path.exists():
        logging.warning(f"Trying to delete not exising folder" f" {path}")
        return False

    for root, dirs, files in os.walk(path):
        for name in files:
            base, ext = os.path.splitext(name)
            if ext.lower() not in SAFE_EXTENSIONS:
                logger.warning(
                    f"Trying to delete unsefe location: "
                    f"extention={ext} not found in {SAFE_EXTENSIONS}"
                )
                return False

    return True
