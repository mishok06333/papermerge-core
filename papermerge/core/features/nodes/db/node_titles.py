"""Node title lookup and trash revive helpers without heavy feature imports."""

from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core import orm


def node_ownership_filter(stmt, user_id: UUID | None, group_id: UUID | None):
    if group_id is not None:
        return stmt.where(orm.Node.group_id == group_id)
    return stmt.where(orm.Node.user_id == user_id)


async def find_node_id_by_title(
    db_session: AsyncSession,
    *,
    parent_id: UUID,
    title: str,
    user_id: UUID | None,
    group_id: UUID | None,
    ctype: str | None = None,
    trashed: bool = False,
) -> UUID | None:
    stmt = select(orm.Node.id).where(
        orm.Node.parent_id == parent_id,
        orm.Node.title == title,
    )
    if ctype is not None:
        stmt = stmt.where(orm.Node.ctype == ctype)
    if trashed:
        stmt = stmt.where(orm.Node.deleted_at.is_not(None))
    else:
        stmt = stmt.where(orm.Node.deleted_at.is_(None))
    stmt = node_ownership_filter(stmt, user_id, group_id)
    return await db_session.scalar(stmt)


async def find_folder_id_by_title(
    db_session: AsyncSession,
    *,
    parent_id: UUID,
    title: str,
    user_id: UUID | None,
    group_id: UUID | None,
    trashed: bool = False,
) -> UUID | None:
    return await find_node_id_by_title(
        db_session,
        parent_id=parent_id,
        title=title,
        user_id=user_id,
        group_id=group_id,
        ctype="folder",
        trashed=trashed,
    )


async def revive_trashed_node(db_session: AsyncSession, node_id: UUID) -> None:
    await db_session.execute(
        update(orm.Node).where(orm.Node.id == node_id).values(deleted_at=None)
    )
    await db_session.flush()
