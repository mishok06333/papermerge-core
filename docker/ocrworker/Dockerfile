FROM papermerge/ocrworker:0.3.1

# Install German and Russian tesseract language packs (eng is pre-installed in base image).
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        tesseract-ocr-deu \
        tesseract-ocr-rus && \
    rm -rf /var/lib/apt/lists/*
