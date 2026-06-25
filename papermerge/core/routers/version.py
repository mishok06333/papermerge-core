import importlib

from fastapi import APIRouter

from papermerge.core import schema

router = APIRouter(
    prefix="/version",
    tags=["version"],
)


@router.get("/")
async def get_version() -> schema.Version:
    """Papermerge REST API version"""
    version_str = importlib.metadata.version("papermerge")

    return schema.Version(version=version_str)
