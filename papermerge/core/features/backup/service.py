import json
import os
import shutil
import subprocess
import tarfile
import tempfile
import uuid
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy.engine import make_url

from papermerge.core.config import get_settings
from papermerge.core.db.engine import resolve_database_url

BACKUP_FORMAT_VERSION = 1
_PG_CLIENT_HINT = (
    "PostgreSQL client tools (pg_dump / pg_restore / psql) were not found on PATH, "
    "and no Docker Postgres container publishing the database port was available. "
    "Install postgresql-client, or start the compose `db` service."
)


def _database_parts():
    url = make_url(resolve_database_url())
    if url.get_backend_name().startswith("postgresql"):
        return {
            "kind": "postgresql",
            "host": url.host or "localhost",
            "port": url.port or 5432,
            "user": url.username or "postgres",
            "password": url.password or "",
            "database": url.database or "postgres",
        }
    if url.get_backend_name().startswith("sqlite"):
        database = url.database or "db.sqlite3"
        return {"kind": "sqlite", "path": database}
    raise RuntimeError(f"Unsupported database backend: {url.get_backend_name()}")


def _runtime_settings():
    """Return portable runtime settings without deployment-specific endpoints."""
    settings = get_settings()
    result = {}
    for name, value in vars(settings).items():
        if not name.startswith("papermerge__"):
            continue
        if name in {
            "papermerge__database__url",
            "papermerge__main__media_root",
            "papermerge__redis__url",
            "papermerge__search__url",
            "papermerge__main__gotenberg_url",
        }:
            continue
        if "secret" in name:
            # The secret is deliberately not exported. Existing passwords and
            # data are in the DB dump, while the target installation keeps its
            # own signing secret and therefore starts a fresh token session.
            continue
        value = value.value if hasattr(value, "value") else value
        if isinstance(value, Path):
            value = str(value)
        result[name] = value

    # Auth-server has a few environment-only settings which are useful to
    # reproduce on another installation but are not represented by Settings.
    for name in (
        "PAPERMERGE__AUTH__LOGIN_PROVIDER",
        "PAPERMERGE__AUTH__REGISTRATION_ENABLED",
        "PAPERMERGE__AUTH__BRAND_TITLE",
        "PAPERMERGE__AUTH__LOGIN_SUBTITLE",
        "PAPERMERGE__AUTH__OIDC_CLIENT_ID",
        "PAPERMERGE__AUTH__OIDC_AUTHORIZE_URL",
        "PAPERMERGE__AUTH__OIDC_REDIRECT_URL",
        "PAPERMERGE__AUTH__OIDC_LOGOUT_URL",
        "PAPERMERGE__AUTH__OIDC_SCOPE",
        "PAPERMERGE__AUTH__REMOTE_LOGOUT_ENDPOINT",
    ):
        if name in os.environ:
            result[name.lower()] = os.environ[name]
    return result


def _pg_env(db: dict) -> dict:
    env = os.environ.copy()
    env["PGHOST"] = str(db["host"])
    env["PGPORT"] = str(db["port"])
    env["PGUSER"] = str(db["user"])
    env["PGDATABASE"] = str(db["database"])
    env["PGPASSWORD"] = str(db["password"])
    return env


def _run_checked(cmd: list[str], *, env: dict | None = None) -> subprocess.CompletedProcess:
    try:
        return subprocess.run(
            cmd,
            env=env,
            check=True,
            capture_output=True,
            text=True,
        )
    except FileNotFoundError as exc:
        raise RuntimeError(f"Command not found: {cmd[0]}") from exc
    except subprocess.CalledProcessError as exc:
        detail = (exc.stderr or exc.stdout or "").strip() or str(exc)
        raise RuntimeError(f"{cmd[0]} failed: {detail}") from exc


def _docker_db_container(port: int) -> str | None:
    """Return the ID of a running container that publishes the DB port, if any."""
    if not shutil.which("docker"):
        return None
    result = subprocess.run(
        [
            "docker",
            "ps",
            "--filter",
            f"publish={port}",
            "--format",
            "{{.ID}}",
        ],
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        return None
    for line in result.stdout.splitlines():
        container_id = line.strip()
        if container_id:
            return container_id
    return None


def _pg_tool_available(tool: str) -> bool:
    return shutil.which(tool) is not None


def _dump_postgres(db: dict, db_path: Path) -> None:
    env = _pg_env(db)
    if _pg_tool_available("pg_dump"):
        _run_checked(
            [
                "pg_dump",
                "--format=custom",
                "--no-owner",
                "--no-acl",
                "--file",
                str(db_path),
            ],
            env=env,
        )
        return

    # Native Windows / hosts without postgresql-client: dump inside the
    # compose Postgres container, then copy the file out. Avoid piping
    # binary custom-format dumps through docker exec stdout on Windows.
    container = _docker_db_container(int(db["port"]))
    if not container:
        raise RuntimeError(_PG_CLIENT_HINT)

    remote = f"/tmp/papermerge-backup-{uuid.uuid4().hex}.dump"
    try:
        _run_checked(
            [
                "docker",
                "exec",
                "-e",
                f"PGPASSWORD={db['password']}",
                container,
                "pg_dump",
                "-U",
                str(db["user"]),
                "-d",
                str(db["database"]),
                "--format=custom",
                "--no-owner",
                "--no-acl",
                "--file",
                remote,
            ]
        )
        _run_checked(["docker", "cp", f"{container}:{remote}", str(db_path)])
    finally:
        subprocess.run(
            ["docker", "exec", container, "rm", "-f", remote],
            capture_output=True,
            check=False,
        )


def _terminate_other_postgres_connections(db: dict) -> None:
    sql = (
        "SELECT pg_terminate_backend(pid) FROM pg_stat_activity "
        "WHERE datname = current_database() AND pid <> pg_backend_pid();"
    )
    env = _pg_env(db)
    if _pg_tool_available("psql"):
        _run_checked(["psql", "-v", "ON_ERROR_STOP=1", "-c", sql], env=env)
        return

    container = _docker_db_container(int(db["port"]))
    if not container:
        raise RuntimeError(_PG_CLIENT_HINT)
    _run_checked(
        [
            "docker",
            "exec",
            "-e",
            f"PGPASSWORD={db['password']}",
            container,
            "psql",
            "-U",
            str(db["user"]),
            "-d",
            str(db["database"]),
            "-v",
            "ON_ERROR_STOP=1",
            "-c",
            sql,
        ]
    )


def _restore_postgres(db: dict, dump_path: Path) -> None:
    env = _pg_env(db)
    _terminate_other_postgres_connections(db)

    if _pg_tool_available("pg_restore"):
        _run_checked(
            [
                "pg_restore",
                "--clean",
                "--if-exists",
                "--no-owner",
                "--no-acl",
                "--exit-on-error",
                "--single-transaction",
                "--dbname",
                f"postgresql://{db['user']}@{db['host']}:{db['port']}/{db['database']}",
                str(dump_path),
            ],
            env=env,
        )
        return

    container = _docker_db_container(int(db["port"]))
    if not container:
        raise RuntimeError(_PG_CLIENT_HINT)

    remote = f"/tmp/papermerge-restore-{uuid.uuid4().hex}.dump"
    try:
        _run_checked(["docker", "cp", str(dump_path), f"{container}:{remote}"])
        _run_checked(
            [
                "docker",
                "exec",
                "-e",
                f"PGPASSWORD={db['password']}",
                container,
                "pg_restore",
                "--clean",
                "--if-exists",
                "--no-owner",
                "--no-acl",
                "--exit-on-error",
                "--single-transaction",
                "-U",
                str(db["user"]),
                "-d",
                str(db["database"]),
                remote,
            ]
        )
    finally:
        subprocess.run(
            ["docker", "exec", container, "rm", "-f", remote],
            capture_output=True,
            check=False,
        )


def create_backup(output_path: Path) -> dict:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="papermerge-backup-") as tmp:
        root = Path(tmp)
        db_path = root / "database.dump"
        media_path = root / "media"
        media_path.mkdir()
        db = _database_parts()

        if db["kind"] == "postgresql":
            _dump_postgres(db, db_path)
        else:
            source = Path(db["path"])
            if not source.is_absolute():
                source = Path.cwd() / source
            shutil.copy2(source, db_path)

        media_root = Path(get_settings().papermerge__main__media_root)
        if media_root.exists():
            shutil.copytree(media_root, media_path, dirs_exist_ok=True)

        manifest = {
            "format": "papermerge-backup",
            "format_version": BACKUP_FORMAT_VERSION,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "papermerge_version": __import__("papermerge.core.version", fromlist=["__version__"]).__version__,
            "database": {"kind": db["kind"]},
            "media_included": True,
            "runtime_settings": _runtime_settings(),
            "restore_notes": [
                "The database dump contains users, roles, permissions, documents, folders, portal news, citizen categories and all other database-backed data.",
                "The media directory contains uploaded document files, page files, previews and other local media.",
                "Deployment-specific database/media/search/Redis endpoints are intentionally not overwritten during restore.",
                "The target installation keeps its own JWT secret; users may need to log in again after restore.",
            ],
        }
        (root / "manifest.json").write_text(
            json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        with tarfile.open(output_path, "w:gz") as archive:
            archive.add(root / "manifest.json", arcname="manifest.json")
            archive.add(db_path, arcname="database.dump")
            archive.add(media_path, arcname="media")

    return manifest


def _safe_extract_media(archive: tarfile.TarFile, target: Path) -> None:
    target = target.resolve()
    for member in archive.getmembers():
        if not member.name.startswith("media/"):
            continue
        destination = (target / member.name).resolve()
        if destination != target and target not in destination.parents:
            raise RuntimeError("Invalid media path in backup archive")
    archive.extractall(target, filter="data")


def restore_backup(archive_path: Path) -> dict:
    db = _database_parts()
    with tempfile.TemporaryDirectory(prefix="papermerge-restore-") as tmp:
        root = Path(tmp)
        with tarfile.open(archive_path, "r:gz") as archive:
            try:
                manifest_member = archive.getmember("manifest.json")
                manifest = json.load(archive.extractfile(manifest_member))
            except Exception as exc:
                raise RuntimeError("Invalid backup: manifest.json is missing or invalid") from exc
            if manifest.get("format") != "papermerge-backup" or manifest.get("format_version") != BACKUP_FORMAT_VERSION:
                raise RuntimeError("Unsupported Papermerge backup format")
            target_db_kind = _database_parts()["kind"]
            if manifest.get("database", {}).get("kind") != target_db_kind:
                raise RuntimeError(
                    f"Backup database type {manifest.get('database', {}).get('kind')!r} "
                    f"does not match target database type {target_db_kind!r}"
                )
            db_member = archive.getmember("database.dump")
            archive.extract(db_member, root)
            _safe_extract_media(archive, root)

        if db["kind"] == "postgresql":
            _restore_postgres(db, root / "database.dump")
        else:
            target = Path(db["path"])
            if not target.is_absolute():
                target = Path.cwd() / target
            shutil.copy2(root / "database.dump", target)

        media_root = Path(get_settings().papermerge__main__media_root)
        staged_media = root / "media"
        media_root.parent.mkdir(parents=True, exist_ok=True)
        previous_media = media_root.parent / f".{media_root.name}.restore-old"
        if previous_media.exists():
            if previous_media.is_dir():
                shutil.rmtree(previous_media)
            else:
                previous_media.unlink()

        # Swap the complete media tree only after the DB restore succeeded.
        # If the swap itself fails, put the original tree back.
        if media_root.exists():
            media_root.rename(previous_media)
        try:
            shutil.copytree(staged_media, media_root)
        except Exception:
            if media_root.exists():
                shutil.rmtree(media_root)
            if previous_media.exists():
                previous_media.rename(media_root)
            raise
        if previous_media.exists():
            shutil.rmtree(previous_media)

        return manifest
