#!/bin/sh
# Entry point for the monolithic Papermerge image.
# Commands:
#   server   вЂ” default. Run init (migrations + bootstrap admin/roles) then supervisord.
#   init     вЂ” just the init steps (useful for one-shot jobs).
#   migrate  вЂ” only alembic migrations.
#   *        вЂ” exec the given command (debug/shell).

set -u

CMD="${1:-server}"

# Default DB location for the legacy sqlite fallback; harmless for postgres.
mkdir -p /db

_run_core() {
    cd /core_app && poetry run "$@"
}

_run_auth() {
    cd /auth_server_app && poetry run "$@"
}

exec_migrate() {
    echo "[init] Applying alembic migrations..."
    _run_core task migrate
}

exec_perms_sync() {
    echo "[init] Syncing permissions from code..."
    _run_core paper-cli perms sync
}

exec_createsuperuser() {
    echo "[init] Ensuring superuser '${PAPERMERGE__AUTH__USERNAME:-admin}' exists..."
    # auth-cli exits non-zero if the user already exists; treat that as success
    # so `docker compose up` stays idempotent across restarts.
    _run_auth auth-cli users create --superuser || \
        echo "[init] Superuser already present, skipping."
}

exec_seed_roles() {
    echo "[init] Ensuring built-in roles (admin + worker/modder presets)..."
    _run_core paper-cli roles create-admin --exists-ok
    _run_core paper-cli roles seed-test-roles
}

exec_assign_admin_role() {
    admin_username="${PAPERMERGE__AUTH__USERNAME:-admin}"
    echo "[init] Assigning 'admin' role to superuser '${admin_username}'..."
    _run_core paper-cli users assign-role "${admin_username}" admin
}

exec_index_schema_apply() {
    if [ -n "${PAPERMERGE__SEARCH__URL:-}" ]; then
        echo "[init] Applying search index schema (PAPERMERGE__SEARCH__URL set)..."
        _run_core paper-cli index-schema apply
    fi
}

exec_init() {
    exec_migrate
    exec_perms_sync
    exec_createsuperuser
    exec_seed_roles
    exec_assign_admin_role
    exec_index_schema_apply
}

# Reset nginx/supervisor config symlinks on every start so the image can be
# re-run after config changes without a stale link.
rm -f /etc/nginx/nginx.conf
rm -f /etc/papermerge/supervisord.conf
ln -s /etc/nginx/nginx.default.conf      /etc/nginx/nginx.conf
ln -s /etc/papermerge/supervisord.default.conf /etc/papermerge/supervisord.conf

render_runtime_configs() {
    # Auth-server runtime config (expects roco-compatible env prefix).
    roco > /usr/share/nginx/html/auth_server/papermerge-runtime-config.js
    # Core UI runtime config (PAPERMERGE__MAIN__* etc.).
    /bin/env2js -f /core_app/core.js.tmpl > /usr/share/nginx/html/ui/papermerge-runtime-config.js
    # Inject the config <script> tag into the built UI once per image instance.
    if ! grep -q '/papermerge-runtime-config.js' /usr/share/nginx/html/ui/index.html; then
        sed -i '/Papermerge/a  <script type="module" src="/papermerge-runtime-config.js"></script>' \
            /usr/share/nginx/html/ui/index.html
    fi
}

case "$CMD" in
    init)
        exec_init
        ;;
    migrate)
        exec_migrate
        ;;
    createsuperuser)
        exec_createsuperuser
        ;;
    server)
        exec_init
        render_runtime_configs
        exec /usr/bin/supervisord -c /etc/papermerge/supervisord.conf
        ;;
    server_without_init)
        render_runtime_configs
        exec /usr/bin/supervisord -c /etc/papermerge/supervisord.conf
        ;;
    create_token.sh|list_users.sh)
        shift
        exec "$CMD" "$@"
        ;;
    *)
        exec "$@"
        ;;
esac
