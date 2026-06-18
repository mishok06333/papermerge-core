FROM papermerge/ocrworker:0.3.1

# Install German and Russian tesseract language packs (eng is pre-installed in base image).
# Refresh Debian archive keys first: the upstream ocrworker base image can ship an
# expired keyring, which makes apt-get update fail with missing public key errors.
RUN set -eux; \
    apt-get update -o Acquire::AllowInsecureRepositories=true; \
    apt-get install -y --no-install-recommends --allow-unauthenticated \
        ca-certificates debian-archive-keyring; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
        tesseract-ocr-deu \
        tesseract-ocr-rus; \
    rm -rf /var/lib/apt/lists/*
