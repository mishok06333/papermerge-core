@echo off
setlocal EnableExtensions

REM Run native backend+frontend for development, while using
REM already-running container services (Postgres/Redis/OCR worker).

set "ROOT_DIR=%~dp0"
cd /d "%ROOT_DIR%"
if not exist "%ROOT_DIR%media" mkdir "%ROOT_DIR%media"

REM Development ports (different from dockerized app port).
set "DEV_BE_PORT=18000"
set "DEV_FE_PORT=15173"

REM Container services are expected on localhost.
set "PAPERMERGE__DATABASE__URL=postgresql://papermerge:papermerge@127.0.0.1:5432/papermerge"
set "PAPERMERGE__REDIS__URL=redis://127.0.0.1:6379/0"
set "PAPERMERGE__MAIN__MEDIA_ROOT=%ROOT_DIR%media"
set "PAPERMERGE__OCR__MULTI_LANG_CODES=eng+rus"

REM Keep API shape identical to nginx/container mode.
set "PAPERMERGE__MAIN__API_PREFIX=/api"
set "PAPERMERGE__MAIN__CORS_ORIGINS=http://127.0.0.1:%DEV_FE_PORT%,http://localhost:%DEV_FE_PORT%"

REM Local auth bypass for debugging only.
set "PAPERMERGE__DEV__AUTH_BYPASS_ENABLED=true"
set "PAPERMERGE__DEV__AUTH_BYPASS_USERNAME=admin"

REM Frontend points to native backend.
set "VITE_BASE_URL=http://127.0.0.1:%DEV_BE_PORT%"
set "VITE_WS_URL=ws://127.0.0.1:%DEV_BE_PORT%/ws"

echo Starting backend on http://127.0.0.1:%DEV_BE_PORT%
start "papermerge-be-dev" cmd /k "cd /d ""%ROOT_DIR%"" && set ""PAPERMERGE__DATABASE__URL=%PAPERMERGE__DATABASE__URL%"" && set ""PAPERMERGE__REDIS__URL=%PAPERMERGE__REDIS__URL%"" && set ""PAPERMERGE__MAIN__MEDIA_ROOT=%PAPERMERGE__MAIN__MEDIA_ROOT%"" && set ""PAPERMERGE__OCR__MULTI_LANG_CODES=%PAPERMERGE__OCR__MULTI_LANG_CODES%"" && set ""PAPERMERGE__MAIN__API_PREFIX=%PAPERMERGE__MAIN__API_PREFIX%"" && set ""PAPERMERGE__MAIN__CORS_ORIGINS=%PAPERMERGE__MAIN__CORS_ORIGINS%"" && set ""PAPERMERGE__DEV__AUTH_BYPASS_ENABLED=%PAPERMERGE__DEV__AUTH_BYPASS_ENABLED%"" && set ""PAPERMERGE__DEV__AUTH_BYPASS_USERNAME=%PAPERMERGE__DEV__AUTH_BYPASS_USERNAME%"" && poetry env use 3.13 && poetry run task migrate && poetry run task server --host 127.0.0.1 --port %DEV_BE_PORT%"

echo Starting frontend on http://127.0.0.1:%DEV_FE_PORT%
start "papermerge-fe-dev" cmd /k "cd /d ""%ROOT_DIR%frontend"" && set ""VITE_BASE_URL=%VITE_BASE_URL%"" && set ""VITE_WS_URL=%VITE_WS_URL%"" && yarn workspace ui dev --host 127.0.0.1 --port %DEV_FE_PORT%"

echo.
echo Backend:  http://127.0.0.1:%DEV_BE_PORT%
echo Frontend: http://127.0.0.1:%DEV_FE_PORT%
echo Docker DB:    127.0.0.1:5432
echo Docker Redis: 127.0.0.1:6379
echo.
echo Auth bypass is ON for this run only.
echo Docker compose exposes DB/Redis on localhost only.

endlocal
