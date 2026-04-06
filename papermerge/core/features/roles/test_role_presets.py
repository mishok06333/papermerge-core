"""Predefined permission sets for local/testing roles (worker, modder).

* **worker** — typical document operator: folders, documents, tags, pages, OCR,
  custom fields and document types, shared nodes, and ``user.me`` only.
* **modder** — worker plus read/update access to users, groups, and roles (no
  create/delete for those admin objects).
"""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core import orm
from papermerge.core.features.auth.scopes import Scopes
from papermerge.core.features.roles import schema as roles_schema
from papermerge.core.features.roles.db import api as roles_dbapi

WORKER_ROLE_NAME = "worker"
MODDER_ROLE_NAME = "modder"


def worker_scopes() -> list[str]:
    categories = (
        "node",
        "document",
        "tag",
        "page",
        "custom_field",
        "document_type",
        "shared_node",
        "comment",
    )
    scopes: set[str] = set()
    for cat in categories:
        scopes.update(Scopes.get_scopes_by_category(cat))
    scopes.update(
        {
            Scopes.USER_ME,
            Scopes.TASK_OCR,
            Scopes.OCRLANG_VIEW,
        }
    )
    return sorted(scopes)


def modder_scopes() -> list[str]:
    scopes = set(worker_scopes())
    scopes.update(
        {
            Scopes.COMMENT_CREATE,
            Scopes.COMMENT_UPDATE,
            Scopes.COMMENT_DELETE,
            Scopes.USER_VIEW,
            Scopes.USER_SELECT,
            Scopes.USER_UPDATE,
            Scopes.GROUP_VIEW,
            Scopes.GROUP_SELECT,
            Scopes.GROUP_UPDATE,
            Scopes.ROLE_VIEW,
            Scopes.ROLE_SELECT,
            Scopes.ROLE_UPDATE,
        }
    )
    return sorted(scopes)


EDITOR_TS_ROLE_NAME = "editor_ts"
READER_TS_ROLE_NAME = "reader_ts"


def editor_ts_scopes() -> list[str]:
    """TS «Редактор»: same content-management set as worker (scoped by sharing in UI)."""
    return worker_scopes()


def reader_ts_scopes() -> list[str]:
    """TS «Пользователь»: просмотр, поиск, скачивание, избранное (без правок контента)."""
    return sorted(
        {
            Scopes.NODE_VIEW,
            Scopes.DOCUMENT_DOWNLOAD,
            Scopes.DOCUMENT_DOWNLOAD_LAST_VERSION_ONLY,
            Scopes.TAG_VIEW,
            Scopes.TAG_SELECT,
            Scopes.USER_ME,
            Scopes.OCRLANG_VIEW,
            Scopes.DOCUMENT_TYPE_VIEW,
            Scopes.DOCUMENT_TYPE_SELECT,
            Scopes.CUSTOM_FIELD_VIEW,
            Scopes.SHARED_NODE_VIEW,
            Scopes.PAGE_VIEW,
        }
    )


PRESET_SCOPES: dict[str, list[str]] = {
    WORKER_ROLE_NAME: worker_scopes(),
    MODDER_ROLE_NAME: modder_scopes(),
    EDITOR_TS_ROLE_NAME: editor_ts_scopes(),
    READER_TS_ROLE_NAME: reader_ts_scopes(),
}


async def ensure_preset_role(
    db_session: AsyncSession, role_name: str
) -> tuple[roles_schema.RoleDetails | None, str | None]:
    """Create or update a named preset role so scopes match the preset definition."""
    if role_name not in PRESET_SCOPES:
        known = ", ".join(sorted(PRESET_SCOPES))
        return None, f"Unknown preset role {role_name!r}. Known presets: {known}"

    wanted = PRESET_SCOPES[role_name]
    stmt = select(orm.Role).where(orm.Role.name == role_name)
    existing = (await db_session.execute(stmt)).scalar_one_or_none()

    if existing:
        attrs = roles_schema.UpdateRole(name=role_name, scopes=wanted)
        details = await roles_dbapi.update_role(db_session, existing.id, attrs)
        return details, None

    role, error = await roles_dbapi.create_role(
        db_session, name=role_name, scopes=wanted, exists_ok=False
    )
    if error:
        return None, error
    return await roles_dbapi.get_role(db_session, role.id), None


async def ensure_all_preset_roles(
    db_session: AsyncSession,
) -> list[tuple[str, roles_schema.RoleDetails | None, str | None]]:
    """Create or update every preset test role."""
    out: list[tuple[str, roles_schema.RoleDetails | None, str | None]] = []
    for name in PRESET_SCOPES:
        details, err = await ensure_preset_role(db_session, name)
        out.append((name, details, err))
    return out
