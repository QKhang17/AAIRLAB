FROM node:22-alpine AS build

WORKDIR /workspace
COPY frontend/package.json frontend/package-lock.json ./frontend/
RUN cd frontend && npm ci

COPY . .
ENV VITE_API_BASE_URL=/api
RUN npm --prefix frontend run build

FROM caddy:2.10-alpine

COPY --from=build /workspace/frontend/dist /srv
RUN ! find /srv -type f \( -name '*.map' -o -name '.env*' -o -name '*secret*' -o -name '*.pem' -o -name '*.key' \) -print -quit | grep -q .
COPY deploy/Caddyfile /etc/caddy/Caddyfile
COPY deploy/caddy-entrypoint.sh /usr/local/bin/caddy-entrypoint.sh
RUN chmod 0555 /usr/local/bin/caddy-entrypoint.sh

ENTRYPOINT ["/usr/local/bin/caddy-entrypoint.sh"]
