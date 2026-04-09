# Native Core + Docker Auth + Nginx

This setup runs the full Papermerge stack in Docker:

- `papermerge` (core backend)
- `authserver` for login and token verification
- `gateway` for the single public entrypoint
- `redis` for task dispatch
- `ocr_worker` for OCR processing
- `db` (PostgreSQL)

The browser talks only to the nginx gateway. The gateway:

- serves the built Papermerge UI
- sends unauthenticated users to the auth server
- proxies `/api` and `/ws` to the core backend container
- calls the auth backend directly for `/verify`

The gateway Docker image builds `frontend/apps/ui` during `docker compose build`,
so no prebuilt `dist` directory is required in git.

## 1. Prepare env file

Copy `.env.native-auth.example` to `.env.native-auth` and adjust the values.

Important values:

- `SECRET_KEY` must match the value used by the native `papermerge-core`
- `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `PAPERMERGE_DB_HOST`, and
  `PAPERMERGE_DB_PORT` must point to the PostgreSQL instance used by the native app
- `PAPERMERGE_MEDIA_HOST_PATH` must point to the same host directory used by
  native `PAPERMERGE__MAIN__MEDIA_ROOT`

If your existing repository `.env` already contains `SECRET_KEY`, `DB_USER`,
`DB_PASSWORD`, and `DB_NAME`, the compose file can use those directly. The extra
`.env.native-auth` file is mainly for overrides like media path or gateway port.

## 2. Start docker services

```powershell
docker compose up -d --build
```

If you want to use a dedicated env file for this stack:

```powershell
docker compose --env-file .env.native-auth up -d --build
```

## 3. Create the first auth user

Run this once after the stack is up:

```powershell
docker compose --env-file .env.native-auth run --rm `
  --entrypoint /bin/sh authserver -lc `
  'poetry run auth-cli users create --email "$AUTH_ADMIN_EMAIL" --superuser "$AUTH_ADMIN_PASSWORD" "$AUTH_ADMIN_USERNAME"'
```

You can list auth users later with:

```powershell
docker compose --env-file .env.native-auth run --rm `
  --entrypoint /bin/sh authserver -lc 'poetry run auth-cli users ls'
```

## 4. Access the app

Open:

```text
http://localhost:18000
```

If you changed `GATEWAY_PORT`, use that port instead.

## Notes

- On Windows, some low-numbered ports are reserved by the OS even when nothing
  is listening on them. The default gateway port is `18000` to avoid the
  reserved range that often includes `12000`.
- The frontend now falls back to `ws://<current-host>/ws` when `VITE_WS_URL`
  is not baked into the build, so websocket-driven UI updates still work behind
  the gateway.
- This stack runs PostgreSQL inside Docker, so both `papermerge` and `authserver`
  use the internal `db` service by default.
