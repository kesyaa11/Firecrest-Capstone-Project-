-- Phase 3: link an authentik identity (issuer + subject) to an existing Firecrest employee.
--
-- Additive and repeatable: it only creates a new table, it never changes or removes rows in
-- users or any other table, so users.id values and every foreign key stay as they are.
-- Run it once against an existing database, running it again does nothing.
--   psql -U <user> -d FirecrestDB -f db/migrations/001_add_user_identity.sql
--
-- Identities are never linked automatically by name or email. Link one by hand, using the
-- "sub" from the user's token (GET /auth/me shows it) and the issuer from the same token:
--   INSERT INTO user_identity (user_id, issuer, subject)
--   VALUES (1, 'http://localhost:9000/application/o/firecrest/', '<sub from /auth/me>');

CREATE TABLE IF NOT EXISTS user_identity (
    id SERIAL PRIMARY KEY, -- Unique ID for the identity link
    user_id INTEGER NOT NULL, -- Employee this identity belongs to
    issuer TEXT NOT NULL, -- OIDC issuer URL (the iss claim), scopes the subject to one provider
    subject TEXT NOT NULL, -- OIDC subject (the sub claim), stable per user within the issuer
    CONSTRAINT fk_user_identity_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_user_identity_issuer_subject UNIQUE (issuer, subject), -- One employee per identity
    CONSTRAINT uq_user_identity_user UNIQUE (user_id) -- One identity per employee
);

COMMENT ON TABLE user_identity IS 'Links an OIDC identity (issuer + subject) to an employee in users';
COMMENT ON COLUMN user_identity.user_id IS 'The employee this identity is linked to, references users.id';
COMMENT ON COLUMN user_identity.issuer IS 'OIDC issuer URL from the token iss claim';
COMMENT ON COLUMN user_identity.subject IS 'OIDC subject from the token sub claim';
