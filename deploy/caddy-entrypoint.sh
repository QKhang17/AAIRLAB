#!/bin/sh
set -eu

if [ -z "${AAIR_DOMAIN:-}" ]; then
    echo "AAIR_DOMAIN must be configured" >&2
    exit 1
fi

AAIR_CSP="$(sed -n 's/^[[:space:]]*Content-Security-Policy-Report-Only:[[:space:]]*//p' /srv/_headers | head -n 1)"
if [ -z "$AAIR_CSP" ]; then
    echo "Generated frontend CSP was not found in /srv/_headers" >&2
    exit 1
fi
export AAIR_CSP

exec caddy run --config /etc/caddy/Caddyfile --adapter caddyfile
