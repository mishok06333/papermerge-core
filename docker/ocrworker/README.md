## Local OCR Worker

This folder defines the project-local OCR worker image used by `docker-compose.yml`.

- Base image: `papermerge/ocrworker:0.3.1`
- Extra language packs are installed in `Dockerfile`
- Runtime env is provided from `.env` via compose

Rebuild only OCR worker:

```bash
docker compose build ocr_worker
docker compose up -d ocr_worker
```

The OCR queue remains `ocr` (`OCR_WORKER_ARGS=-Q ocr ...`), so backend task routing
does not change.
