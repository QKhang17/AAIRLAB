# AAIR production deployment

This deployment keeps the frontend and API on one HTTPS origin. Caddy serves
the Vite output and proxies `/api/*` to the private Spring Boot container.
PostgreSQL is external/managed and is never exposed by this Compose file.

## First deployment

1. Point the VPS DNS record for the application hostname to the VPS.
2. Create an empty managed PostgreSQL database and run
   `database/aair_full_schema_pgadmin.sql` once while connected to that empty
   database. Do not run the dump over an existing AAIR database.
3. Create a dedicated `aair_app` database role in the managed provider with
   only the privileges needed by the application. Do not use the PostgreSQL
   superuser. Then run `database/grant_aair_app_privileges.sql` as the schema
   owner to grant application DML on the existing schema.
4. Copy `deploy/compose.env.example` to `deploy/compose.env` and set the real
   hostname and the secret-file path.
5. Copy `deploy/application-ai-keys.example.yml` to the configured secret path,
   protect it with owner-only permissions, and replace every placeholder.
6. Build and start the stack:

   ```sh
   docker compose --env-file deploy/compose.env -f docker-compose.prod.yml up -d --build
   ```

7. Verify the HTTPS site, `/actuator/health` from inside the backend container,
   login, CSRF-protected writes, document upload/download, and the AI flow.

## Secret rotation

The active YAML is mounted read-only at `/run/secrets/aair-application.yml` and
is not copied into the image or JAR. Update the host secret file, then recreate
only the backend container:

```sh
docker compose --env-file deploy/compose.env -f docker-compose.prod.yml up -d --force-recreate backend
docker compose --env-file deploy/compose.env -f docker-compose.prod.yml ps
```

Rotate a database password in the managed database first, then update the YAML
and recreate the backend. Rotating `app.jwt.secret` invalidates existing JWTs.

## CSP rollout

The generated policy is served as `Content-Security-Policy-Report-Only` first.
Review browser/staging violations for all legacy HTML pages, then switch both
the backend header and the Caddy header to enforcing CSP in a separate change.
