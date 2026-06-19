from fastapi import APIRouter, Depends, HTTPException
from salinic import IndexRO, Search, create_engine
from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core.features.users import schema as usr_schema
from papermerge.core.features.auth import get_current_user, scopes
from papermerge.core.config import get_settings
from papermerge.core.db.engine import get_db
from papermerge.core.features.library_ts.db import api as lib_ts_api
from papermerge.core.features.portal.db import api as portal_dbapi
from papermerge.core.features.users.db import api as usr_dbapi
from papermerge.search.acl import build_solr_access_filter
from papermerge.search.query_utils import prepare_user_query
from papermerge.search.schema import SearchIndex, PaginatedResponse

router = APIRouter(prefix="/search", tags=["search"])
config = get_settings()


@router.get("/", response_model=PaginatedResponse)
async def search(
    q: str,
    page_number: int = 1,
    page_size: int = 10,
    user: usr_schema.User = Depends(get_current_user),
    db_session: AsyncSession = Depends(get_db),
):
    if not config.papermerge__search__url:
        raise HTTPException(status_code=503, detail="Search is not configured")
    engine = create_engine(config.papermerge__search__url)
    index = IndexRO(engine, schema=SearchIndex)

    user_details, _err = await usr_dbapi.get_user_details(db_session, user.id)
    group_ids = [group.id for group in user_details.groups] if user_details else []
    portal_group_id = await portal_dbapi.get_portal_group_id(db_session)
    include_portal = scopes.PORTAL_VIEW in (user.scopes or [])

    access_filter = build_solr_access_filter(
        user_id=user.id,
        group_ids=group_ids,
        portal_group_id=portal_group_id,
        include_portal=include_portal,
    )
    combined_q = f"({prepare_user_query(q)}) AND {access_filter}"

    sq = Search(SearchIndex).query(
        combined_q, page_number=page_number, page_size=page_size
    )
    results = index.search(sq, user_id=None)
    await lib_ts_api.log_search_query(db_session, user.id, q)
    await db_session.commit()
    return results
