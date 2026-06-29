import os
from pathlib import Path
from logging.config import dictConfig
import uuid

import yaml
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from papermerge.core.features.users.router import router as usr_router
from papermerge.core.features.tags.router import router as tags_router
from papermerge.core.features.groups.router import router as groups_router
from papermerge.core.features.roles.router import router as roles_router
from papermerge.core.features.nodes.router import router as nodes_router
from papermerge.core.features.nodes.router_public import router as public_nodes_router
from papermerge.core.features.nodes.router_folders import \
    router as folders_router
from papermerge.core.features.nodes.router_thumbnails import \
    router as thumbnails_router
from papermerge.core.features.document.router import router as document_router
from papermerge.core.features.document.router_pages import \
    router as pages_router
from papermerge.core.features.document.router_document_version import (
    router as document_versions_router,
)
from papermerge.core.features.liveness_probe.router import \
    router as probe_router
from papermerge.search.routers.search import router as search_router
from papermerge.core.features.tasks.router import router as tasks_router
from papermerge.core.features.portal.router import router as portal_router
from papermerge.core.routers.version import (
    router as version_router,
)
from papermerge.core.routers.ws import router as ws_router
from papermerge.core.version import __version__
from papermerge.core.config import get_settings
from papermerge.core.features.library_ts.router import router as library_ts_router

settings = get_settings()
prefix = settings.papermerge__main__api_prefix
app = FastAPI(
    title=f"{settings.papermerge__main__app_title} — API",
    version=__version__,
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=[
        "Content-Disposition",  # This is crucial!
        "Content-Type",
        "Content-Length",
        "Accept-Ranges",
        "Last-Modified",
        "ETag"
    ]
)


@app.middleware("http")
async def correlation_id_middleware(request: Request, call_next):
    correlation_id = request.headers.get("X-Correlation-ID") or str(uuid.uuid4())
    request.state.correlation_id = correlation_id
    response = await call_next(request)
    response.headers["X-Correlation-ID"] = correlation_id
    return response


app.include_router(nodes_router, prefix=prefix)
app.include_router(public_nodes_router, prefix=prefix)
app.include_router(portal_router, prefix=prefix)
app.include_router(folders_router, prefix=prefix)
app.include_router(thumbnails_router, prefix=prefix)
app.include_router(document_router, prefix=prefix)
app.include_router(document_versions_router, prefix=prefix)
app.include_router(pages_router, prefix=prefix)
app.include_router(usr_router, prefix=prefix)
app.include_router(tags_router, prefix=prefix)
app.include_router(groups_router, prefix=prefix)
app.include_router(roles_router, prefix=prefix)
app.include_router(probe_router, prefix=prefix)
app.include_router(tasks_router, prefix=prefix)
app.include_router(version_router, prefix=prefix)
app.include_router(library_ts_router, prefix=prefix)
app.include_router(ws_router)

if settings.papermerge__search__url:
    app.include_router(search_router, prefix=prefix)

logging_config_path = Path(
    os.environ.get("PAPERMERGE__MAIN__LOGGING_CFG", "/etc/papermerge/logging.yaml")
)
if logging_config_path.exists() and logging_config_path.is_file():
    with open(logging_config_path, "r") as stream:
        logging_dict = yaml.load(stream, Loader=yaml.FullLoader)

    dictConfig(logging_dict)
