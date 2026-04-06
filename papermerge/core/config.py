from enum import Enum
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings


class FileServer(str, Enum):
    LOCAL = 'local'
    S3 = 's3'

class Settings(BaseSettings):
    papermerge__main__logging_cfg: Path | None = Path("/etc/papermerge/logging.yaml")
    papermerge__main__media_root: Path = Path("media")
    papermerge__main__api_prefix: str = ''
    papermerge__main__prefix: str = ''
    papermerge__main__app_title: str = Field(
        default="Социальная поддержка 27",
        description="Display title for API docs and optional UI branding.",
    )
    papermerge__main__cors_origins: str = Field(
        default="*",
        description="Comma-separated allowed CORS origins, or '*'.",
    )
    papermerge__main__soft_delete: bool = Field(
        default=True,
        description="Soft-delete nodes to trash instead of removing rows.",
    )
    papermerge__main__trash_retention_days: int = Field(
        default=30,
        description="Retention window before permanent purge (operations).",
    )
    papermerge__main__office_web_viewer_base_url: str | None = Field(
        default=None,
        description="Optional Office Web Viewer base URL for iframe previews.",
    )
    papermerge__main__file_server: FileServer = FileServer.LOCAL
    papermerge__main__cf_sign_url_private_key: str | None = None
    papermerge__main__cf_sign_url_key_id: str | None = None
    papermerge__main__cf_domain: str | None = None
    papermerge__main__timezone: str = 'Europe/Berlin'
    papermerge__main__cache_enabled: bool = False
    papermerge__database__url: str = "sqlite:////db/db.sqlite3"
    papermerge__redis__url: str | None = None
    papermerge__ocr__default_lang_code: str = 'deu'
    papermerge__preview__page_size_sm: int = 200  # pixels
    # When is OCR triggered ?
    # `ocr__automatic` = True means that OCR will be performed without
    #   end user intervention i.e. via background scheduler like celery scheduler
    # `ocr__automatic` = False means that OCR will be performed only
    #   if requested by end user. In this case user can choose to
    #   start schedule OCR on upload; also in this case use can choose to
    #   scheduler OCR later on any document.
    papermerge__ocr__automatic: bool = False
    papermerge__search__url: str | None = None

    def cors_origins_list(self) -> list[str]:
        raw = (self.papermerge__main__cors_origins or "*").strip()
        if raw == "*":
            return ["*"]
        return [o.strip() for o in raw.split(",") if o.strip()]


settings = Settings()

def get_settings():
    # lazy load setting

    return settings
