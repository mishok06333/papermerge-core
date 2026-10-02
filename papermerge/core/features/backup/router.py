import tempfile
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask
from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core import exceptions as exc
from papermerge.core.features.auth import get_current_user
from papermerge.core.features.users import schema as users_schema
from papermerge.core.db.engine import get_db
from papermerge.core.features.backup.service import create_backup, restore_backup

router = APIRouter(prefix="/admin/backup", tags=["admin-backup"])


def _require_superuser(user: users_schema.User) -> users_schema.User:
    if not user.is_superuser:
        raise exc.HTTP403Forbidden()
    return user


@router.get("/export")
async def export_backup(
    user: users_schema.User = Depends(get_current_user),
):
    _require_superuser(user)
    temp = tempfile.NamedTemporaryFile(prefix="papermerge-backup-", suffix=".pmgbackup", delete=False)
    temp.close()
    path = Path(temp.name)
    try:
        create_backup(path)
    except Exception as exc_:  # noqa: BLE001
        path.unlink(missing_ok=True)
        raise HTTPException(status_code=500, detail=f"Backup export failed: {exc_}") from exc_
    return FileResponse(
        path,
        media_type="application/gzip",
        filename="papermerge-backup.pmgbackup",
        background=BackgroundTask(path.unlink, missing_ok=True),
    )


@router.post("/import")
async def import_backup(
    backup: UploadFile = File(...),
    user: users_schema.User = Depends(get_current_user),
    db_session: AsyncSession = Depends(get_db),
):
    _require_superuser(user)
    if not backup.filename or not backup.filename.lower().endswith((".pmgbackup", ".tar.gz", ".tgz")):
        raise HTTPException(status_code=400, detail="Unsupported backup file format")

    temp = tempfile.NamedTemporaryFile(prefix="papermerge-restore-", suffix=".pmgbackup", delete=False)
    path = Path(temp.name)
    try:
        while chunk := await backup.read(1024 * 1024):
            temp.write(chunk)
        temp.close()
        # Release the request's SQLAlchemy connection before pg_restore drops
        # and recreates the application's tables.
        await db_session.close()
        manifest = restore_backup(path)
        return {
            "status": "ok",
            "message": "Backup restored successfully. Reload the application.",
            "created_at": manifest.get("created_at"),
        }
    except Exception as exc_:  # noqa: BLE001
        temp.close()
        raise HTTPException(status_code=400, detail=f"Backup restore failed: {exc_}") from exc_
    finally:
        path.unlink(missing_ok=True)
