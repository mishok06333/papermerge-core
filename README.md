[![Tests](https://github.com/papermerge/papermerge-core/actions/workflows/tests.yml/badge.svg)](https://github.com/papermerge/papermerge-core/actions/workflows/tests.yml)

<p align="center">
<img src="./artwork/logo-w160px.png" />
</p>
<h1 align="center">Papermerge DMS</h1>

Papermerge is an open-source document management system for scanned
archives. It extracts text with OCR, indexes documents for full-text
search, and gives you a modern desktop-like web UI with hierarchical
folders, tags, custom fields, versioning and page management.

Supported input formats: PDF, TIFF, JPEG, PNG.

<p align="center">
<img src="./artwork/papermerge3-3.png" />
</p>

## Feature highlights

- Web UI with desktop-like experience (dual panel, drag and drop, tags)
- REST API
- Document versioning, OCR text overlay, full-text search
- Document types with custom fields (metadata)
- Multi-user, groups, role-based access control
- Document and folder sharing between users/groups
- Page management: reorder, delete, extract, move
- UI translated into multiple languages

## Quick start (Docker)

One compose file, one env file. Bring up the full stack — database,
Redis, the monolithic Papermerge app (nginx + core API + auth server)
and an OCR worker — in a single command.

```bash
cp .env.dev .env
# edit .env: set SECRET_KEY, ADMIN_PASSWORD, POSTGRES_PASSWORD
docker compose up -d --build
```

Then open `http://localhost:${APP_PORT}` (default `12000`) and log in
with the credentials from `.env` (default `admin` / `admin`).

### What the first boot creates automatically

The `app` container's entrypoint runs an idempotent bootstrap on every
start. On a fresh database it will:

1. Apply all Alembic migrations.
2. Sync the `permissions` table from the scopes declared in code
   (`paper-cli perms sync`).
3. Create the superuser defined by `ADMIN_USERNAME` / `ADMIN_PASSWORD` /
   `ADMIN_EMAIL`.
4. Create the built-in roles:
   - **admin** — every permission scope.
   - **worker** — document workflow (nodes, documents, tags, pages, OCR,
     custom fields, document types, shared nodes, `user.me`).
   - **modder** — `worker` plus view/select/update on users, groups,
     roles (no create/delete).
5. Attach the `admin` role to the superuser so the UI is usable right
   away — no manual CLI step required.

Re-running `docker compose up` is safe; each step detects the existing
state and skips.

### Environment variables (`.env.dev`)

| Variable | Purpose |
|----------|---------|
| `SECRET_KEY` | Shared signing key for auth-server and core. |
| `APP_PORT` | Host port mapped to nginx:80 in the app container. |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Database credentials. |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` / `ADMIN_EMAIL` | First-boot superuser. |
| `OCR_LANGS` | Comma-separated tesseract language codes shown in the UI. |
| `OCR_DEFAULT_LANG` | Default language picked in the upload dialog. |
| `OCR_MULTI_LANGS` | `+`-joined OCR language set used for automatic OCR (e.g. `eng+rus`). |
| `OCR_AUTOMATIC` | `true` = OCR runs on upload, `false` = on demand. |
| `OCR_WORKER_CONCURRENCY` | Number of celery workers per OCR container. |

Add more OCR languages by extending `tesseract-ocr-*` packages in
[`docker/ocrworker/Dockerfile`](docker/ocrworker/Dockerfile) and
listing them in `OCR_LANGS`.

The worker image is built locally from [`docker/ocrworker/Dockerfile`](docker/ocrworker/Dockerfile),
so OCR customizations are versioned in this repository. To rebuild:

```bash
docker compose build ocr_worker
docker compose up -d ocr_worker
```

To rollback to upstream behavior, set the Dockerfile base image back to
the upstream tag and rebuild the worker.

## Demo

An online demo is available at <https://demo.papermerge.com>.

```
Username: demo
Password: demo
```

The demo has no OCR worker or search engine and resets every day at
00:00 UTC.

## Local development

You only need the docker stack for the heavy dependencies (Postgres,
Redis, the OCR worker). The Python backend and the React frontend can
run natively for faster feedback.

### Bring up just the infra

Temporarily comment out the `app` service block in `docker-compose.yml`
or use a targeted up command:

```bash
docker compose up -d db redis ocr_worker
```

### Backend

Requires [Poetry](https://python-poetry.org/) 2.1+.

```bash
poetry install -E pg
cp .env.dev .env.local  # point PAPERMERGE__DATABASE__URL at the dockerised Postgres
export $(grep -v '^#' .env.local | xargs)
poetry run task migrate
poetry run paper-cli perms sync
poetry run paper-cli roles create-admin
poetry run task server
```

The server listens on `http://localhost:8000`.

### Frontend

```bash
cd frontend
yarn install --immutable
yarn workspace ui dev
```

Dev server: `http://localhost:5173`. The backend must be reachable at
the URL configured via `VITE_BASE_URL` (default `http://localhost:8000`).

## `paper-cli` reference

The package installs a Typer entry point `paper-cli`. It connects to
the database configured by `PAPERMERGE__DATABASE__URL` (same as the
app).

```bash
poetry run paper-cli --help
```

Groups:

| Group | Purpose |
|-------|---------|
| `users` | Create, list, update, delete users; `assign-role <user> <role>` attaches an existing role. |
| `groups` | List groups, create the default `admin` group. |
| `roles` | List roles, `create-admin`, seed preset test roles (`seed-test-roles`, `seed-test-role <name>`). |
| `perms` | List DB permissions, `sync` from code. |
| `scopes` | Dump the scopes declared in code. |
| `tokens` | Token utilities. |
| `search`, `index`, `index-schema` | Search index maintenance. |

Typical fresh-DB flow (mirrors what the docker entrypoint does):

```bash
poetry run task migrate
poetry run paper-cli perms sync
poetry run paper-cli roles create-admin
poetry run paper-cli roles seed-test-roles
poetry run paper-cli users assign-role admin admin
```

## Repository layout

- `papermerge/core/**` — FastAPI backend, split into feature modules
  under `papermerge/core/features/<feature>/{db,router,schema,cli,tests}`.
- `papermerge/core/alembic/` — database migrations.
- `papermerge/celery_app.py` — celery entry point; task routing is
  queue-based (`ocr`, `i3`, `s3`, `path_tmpl`, `s3preview`).
- `papermerge/app.py` — FastAPI app factory.
- `papermerge/cli.py` — `paper-cli` Typer app.
- `frontend/apps/ui/**` — React application (Vite + Mantine).
- `frontend/packages/**` — shared workspace packages (`commander`,
  `viewer`, `hooks`, `kommon`).
- `docker/app/Dockerfile` — monolithic runtime (nginx + core + auth
  server under supervisord) used by the `app` compose service.
- `docker/ocrworker/Dockerfile` — OCR worker image (celery + tesseract).

## Documentation

Full docs: <https://docs.papermerge.io>.

## License

Apache 2.0 — see [LICENSE](LICENSE).
