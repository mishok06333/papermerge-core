import logging
import os

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

SQLALCHEMY_DATABASE_URL = os.environ.get(
    "PAPERMERGE__DATABASE__URL", "sqlite:////db/db.sqlite3"
)
connect_args = {}
logger = logging.getLogger(__name__)

SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace(
    "postgresql://", "postgresql+asyncpg://", 1
)

is_postgres = SQLALCHEMY_DATABASE_URL.startswith("postgresql+asyncpg://")
if is_postgres:
    pool_size = int(os.environ.get("PAPERMERGE__DATABASE__POOL_SIZE", "20"))
    max_overflow = int(os.environ.get("PAPERMERGE__DATABASE__MAX_OVERFLOW", "40"))
    pool_timeout = int(os.environ.get("PAPERMERGE__DATABASE__POOL_TIMEOUT", "30"))
    pool_recycle = int(os.environ.get("PAPERMERGE__DATABASE__POOL_RECYCLE", "1800"))
    engine = create_async_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args=connect_args,
        pool_pre_ping=True,
        pool_size=pool_size,
        max_overflow=max_overflow,
        pool_timeout=pool_timeout,
        pool_recycle=pool_recycle,
    )
else:
    engine = create_async_engine(SQLALCHEMY_DATABASE_URL, connect_args=connect_args)

AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


def get_engine():
    return engine
