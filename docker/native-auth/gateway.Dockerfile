FROM node:20.19 AS frontend_build
# ensure all packages are up-to-date
RUN apt update && apt upgrade -y && rm -rf /var/lib/apt/lists/*

WORKDIR /build_frontend_app
COPY frontend/ .

# Use corepack to manage Yarn version and install dependencies
RUN corepack enable && \
    yarn set version 4.9.2 && \
    yarn install --immutable && \
    yarn workspace ui build

FROM nginx:1.27-alpine

COPY docker/native-auth/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=frontend_build /build_frontend_app/apps/ui/dist/ /usr/share/nginx/html/ui/
