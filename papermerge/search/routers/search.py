from fastapi import APIRouter, Depends, HTTPException
from salinic import IndexRO, Search, create_engine
from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core.features.users import schema as usr_schema
from papermerge.core.features.auth import get_current_user
from papermerge.core.config import get_settings
from papermerge.core.db.engine import get_db
from papermerge.core.features.library_ts.db import api as lib_ts_api
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

    sq = Search(SearchIndex).query(q, page_number=page_number, page_size=page_size)
    results = index.search(sq, user_id=str(user.id))
    await lib_ts_api.log_search_query(db_session, user.id, q)
    await db_session.commit()
    return results
