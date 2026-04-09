FROM node:20.19 AS frontend_build
# Ensure all packages are up-to-date.
# Use retries for transient mirror/network issues during image builds.
RUN set -eux; \
    attempts=0; \
    max_attempts=5; \
    until [ "$attempts" -ge "$max_attempts" ]; do \
        if apt-get update && apt-get upgrade -y; then \
            break; \
        fi; \
        attempts=$((attempts + 1)); \
        echo "apt-get failed (attempt ${attempts}/${max_attempts}), retrying..."; \
        sleep $((attempts * 5)); \
    done; \
    if [ "$attempts" -ge "$max_attempts" ]; then \
        echo "apt-get update/upgrade failed after ${max_attempts} attempts"; \
        exit 1; \
    fi; \
    rm -rf /var/lib/apt/lists/*

WORKDIR /build_frontend_app
COPY frontend/ .

# Use corepack to manage Yarn version and install dependencies
RUN set -eux; \
    attempts=0; \
    max_attempts=5; \
    until [ "$attempts" -ge "$max_attempts" ]; do \
      if corepack enable && \
         yarn set version 4.9.2 && \
         yarn install --immutable && \
         mkdir -p node_modules && \
         for d in packages/*; do \
           [ -d "$d" ] || continue; \
           name="$(basename "$d")"; \
           ln -sfn "/build_frontend_app/$d" "node_modules/$name"; \
         done && \
         yarn workspace ui build; then \
        break; \
      fi; \
      attempts=$((attempts + 1)); \
      echo "yarn build failed (attempt ${attempts}/${max_attempts}), retrying..."; \
      sleep $((attempts * 5)); \
    done; \
    if [ "$attempts" -ge "$max_attempts" ]; then \
      echo "yarn build failed after ${max_attempts} attempts"; \
      exit 1; \
    fi

FROM nginx:1.27-alpine

COPY docker/native-auth/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=frontend_build /build_frontend_app/apps/ui/dist/ /usr/share/nginx/html/ui/
