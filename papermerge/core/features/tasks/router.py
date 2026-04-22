from typing import Annotated

from fastapi import APIRouter, Security

from papermerge.core import constants, schema, utils
from papermerge.core import config
from papermerge.core.features.auth import get_current_user, scopes
from papermerge.core import tasks

from .schema import OCRTaskIn

router = APIRouter(
    prefix="/tasks",
    tags=["tasks"],
)
settings = config.get_settings()


@router.post("/ocr")
@utils.docstring_parameter(scope=scopes.TASK_OCR)
def start_ocr(
    ocr_task: OCRTaskIn,
    user: Annotated[schema.User, Security(get_current_user, scopes=[scopes.TASK_OCR])],
):
    """Triggers OCR for specific document

    Required scope: `{scope}`
    """

    tasks.send_task(
        constants.WORKER_OCR_DOCUMENT,
        kwargs={
            "document_id": str(ocr_task.document_id),
            # Legacy clients may still send `lang`, but OCR now runs with
            # system multilingual codes by default.
            "lang": ocr_task.lang or settings.papermerge__ocr__multi_lang_codes,
        },
        route_name="ocr",
    )
