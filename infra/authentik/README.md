# authentik for Firecrest (Phase 1)

authentik is the identity provider (login server) we will move Firecrest to. In this phase it runs **on its own** and is not connected to the React app or the API. The prototype login still works exactly as before.

It runs as a separate Compose project (`firecrest-authentik`) with its own database and volume, so it never touches the Firecrest containers or data.

| Service | Purpose | Port on your machine |
|---|---|---|
| `server` | authentik web UI and OIDC endpoints | 9000 (http), 9443 (https) |
| `worker` | background tasks, applies the blueprint | none |
| `postgresql` | authentik's own database | none (not exposed) |

Version: authentik 2026.8.3. This version does not need Redis.

## Start

Run everything below from `infra/authentik`.

1. Create your env file and fill in two secrets:
   ```
   cp .env.example .env
   openssl rand -hex 24                          # paste as PG_PASS
   openssl rand -base64 48 | tr -d '\n=+/'       # paste as AUTHENTIK_SECRET_KEY
   ```
   `.env` is git-ignored. Never commit it. Do not change `AUTHENTIK_SECRET_KEY` after first start.
2. Start it: `docker compose up -d`
3. Wait about a minute, then open <http://localhost:9000/if/flow/initial-setup/> and set the password for the `akadmin` admin account. This page only works once.
4. Admin interface: <http://localhost:9000/if/admin/> (log in as `akadmin`).

## What is already configured (blueprint)

`blueprints/firecrest.yaml` is applied automatically on start. It creates:

- Groups: `firecrest-manager`, `firecrest-developer`, `firecrest-sd`, `firecrest-admin`
- An OAuth2/OpenID provider named **Firecrest**:
  - Client type **public** (no client secret, because the React app cannot keep one)
  - Client ID `firecrest-spa`
  - Redirect URI `http://localhost:5173/auth/callback` (strict match)
  - Scopes: `openid`, `profile`, `email`
- An application named **Firecrest** (slug `firecrest`)

PKCE is supported by authentik (`S256`); the React client will send it in Phase 4. The redirect path `/auth/callback` is a placeholder until that route exists.

## Create test users (manual)

Passwords are never stored in the repository, so create the users in the UI:

1. Admin interface > **Directory > Users > Create**.
2. Make one user per role, for example `test-manager`, `test-developer`, `test-sd`, `test-admin`.
3. Open each user > **Set password**.
4. Admin interface > **Directory > Groups** > pick the matching `firecrest-*` group > **Users > Add existing user**.

Each person should be in exactly one role group.

## Claims

Verified on this version: the `profile` scope returns a `groups` claim, a list of group **names** (for example `["firecrest-manager"]`). Other claims: `sub`, `email`, `name`, `preferred_username`. `sub` is the stable user identifier we will map to `users.id` later.

## Verify

- Health: <http://localhost:9000/-/health/ready/> returns HTTP 200.
- Discovery document: <http://localhost:9000/application/o/firecrest/.well-known/openid-configuration>
- Issuer (must match exactly when the API validates tokens): `http://localhost:9000/application/o/firecrest/`
- Other endpoints (authorize, token, JWKS, end-session) are listed in the discovery document.
- Check status: `docker compose ps`

## Stop and restart (keeps data)

- Stop: `docker compose stop` (or `docker compose down`, which keeps volumes)
- Start again: `docker compose up -d`
- Your data lives in the `firecrest-authentik_database` Docker volume and in `data/`. Do **not** run `docker compose down -v` or `docker volume prune`, which delete it.

## Notes

- Everything here is for local development: plain HTTP on localhost, not for production.
- Port conflict? Set `COMPOSE_PORT_HTTP` and `COMPOSE_PORT_HTTPS` in `.env`. If you change the HTTP port, the issuer URL changes too.
- Unlike the official compose file, the worker does not mount the Docker socket or run as root. That is only needed for outposts, which we do not use.
