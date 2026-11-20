-- Run as the managed PostgreSQL database/schema owner after creating the
-- password-bearing role aair_app in the provider console.
-- This role receives application DML only; it must not be a superuser.

GRANT CONNECT ON DATABASE aair_db TO aair_app;
GRANT USAGE ON SCHEMA public TO aair_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO aair_app;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO aair_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO aair_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO aair_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO aair_app;
