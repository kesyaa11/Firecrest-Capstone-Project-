# Authentication setup (authentik and OpenID Connect)

Firecrest signs users in through [authentik](https://goauthentik.io/), an open source identity provider, using OpenID Connect (OIDC). This guide takes you from a fresh clone to a working local sign in. All commands are for Windows PowerShell and are run from the repository root unless stated otherwise.

## How it fits together

1. The React app sends the browser to authentik. The user types their username and password on the authentik page, never in Firecrest. The app uses the Authorization Code flow with PKCE and has no client secret.
2. authentik returns an access token (a signed JWT). The app keeps it in session storage and sends it to the API as a bearer token on every request.
3. The ASP.NET Core API validates every token: signature, issuer, audience (`firecrest-spa`), expiry and algorithm (RS256). It downloads authentik's signing keys from the OIDC discovery document.
4. The API then works out who is calling. It looks up the token's issuer and subject in the `user_identity` table, which links an authentik user to one row in `users`. The employee ID always comes from this lookup and never from anything the browser sends.
5. The role comes from the authentik group (`firecrest-manager`, `firecrest-developer`, `firecrest-sd` or `firecrest-admin`). It must match the role stored on the employee row, otherwise the request is refused.

authentik is authoritative for sign in and group membership. PostgreSQL stays authoritative for employees and manager relationships.

The API has two modes, selected with `Auth:Mode`:

| Mode | Behaviour |
|---|---|
| `Oidc` | Real sign in through authentik. Every business endpoint needs a valid token. Use this for anything beyond a quick local demo. |
| `Prototype` | The original demo behaviour. The frontend checks the fixed accounts in `frontend/src/auth/authUsers.js` and the API accepts every request without a token. It is development only and must never be deployed (see [Local development and production](#local-development-and-production)). |

The frontend has a matching setting, `VITE_AUTH_MODE`. The two must agree. If they do not, the sign in page shows "The API is not in OIDC mode".

## Prerequisites

- Docker Desktop, running
- .NET 10 SDK (`dotnet --version`)
- Node.js and npm (`node --version`)
- PowerShell (Windows PowerShell 5.1 or newer)

Ports used locally: 9000 and 9443 (authentik), 5432 (PostgreSQL), 5281 (API when run with `dotnet run`), 5050 (API when run with the root `docker-compose.yml`), 5173 (frontend).

## 1. Start authentik

authentik runs as its own Docker Compose project (`firecrest-authentik`) with its own database. It does not touch the Firecrest database or containers.

1. Create the settings file and open it:

   ```powershell
   cd infra\authentik
   Copy-Item .env.example .env
   notepad .env
   ```

2. Generate two random values and paste them into `.env` as `PG_PASS` and `AUTHENTIK_SECRET_KEY`:

   ```powershell
   # PG_PASS
   $b = New-Object byte[] 24; [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); -join ($b | ForEach-Object { $_.ToString("x2") })

   # AUTHENTIK_SECRET_KEY
   $k = New-Object byte[] 48; [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($k); [Convert]::ToBase64String($k)
   ```

   `.env` is ignored by Git. Never commit it. Do not change `AUTHENTIK_SECRET_KEY` after the first start.

3. Start authentik:

   ```powershell
   docker compose up -d
   docker compose ps
   ```

   Wait about a minute until `server`, `worker` and `postgresql` all show `healthy`. The first start downloads the images.

4. Create the administrator. Open <http://localhost:9000/if/flow/initial-setup/> and set a password for the built-in `akadmin` account. This page works only once. Afterwards the admin interface is at <http://localhost:9000/if/admin/>.

The Firecrest configuration is applied automatically from `blueprints/firecrest.yaml`. It creates:

- the groups `firecrest-manager`, `firecrest-developer`, `firecrest-sd` and `firecrest-admin`
- an OAuth2/OpenID provider named Firecrest: public client, client ID `firecrest-spa`, grant types `authorization_code` and `refresh_token`, scopes `openid`, `profile` and `email`
- the redirect URI `http://localhost:5173/auth/callback` and the logout return address `http://localhost:5173/`
- an application with the slug `firecrest`

To check it worked, open <http://localhost:9000/application/o/firecrest/.well-known/openid-configuration>. It should return JSON whose `issuer` is `http://localhost:9000/application/o/firecrest/`. If it returns 404 after a minute, see [Troubleshooting](#troubleshooting).

## 2. Create developer test accounts

Each person needs an authentik user in exactly one `firecrest-*` group. In the admin interface:

1. Go to **Directory > Users > Create**, enter a username and save.
2. Open the user and choose **Set password**. Choose your own password. Do not reuse a real one.
3. Go to **Directory > Groups**, open the group, then **Users > Add existing user**.

A suggested set of local accounts:

| Username | Group | Linked employee (see step 4) |
|---|---|---|
| `test-manager` | `firecrest-manager` | a user with role `Manager` |
| `test-developer` | `firecrest-developer` | a user with role `Dev` |
| `test-sd` | `firecrest-sd` | a user with role `SD` |
| `test-admin` | `firecrest-admin` | none, an admin does not need an employee row |

Do not put anyone in two `firecrest-*` groups. The API refuses ambiguous roles. Other groups, such as `authentik Admins`, are ignored.

## 3. Prepare the database

Go back to the repository root and start PostgreSQL with the root Compose file. It needs a root `.env` file containing `DB_USER` and `DB_PASSWORD` (see the root README).

```powershell
cd ..\..
docker compose up -d db
```

**A new database.** `db/init.sql` creates the complete schema, including `user_identity`, and loads sample employees. It runs only when the database volume is empty, so a new clone needs nothing else.

**An existing database.** If your database was created before authentication was added, apply the migrations in `db/migrations` in numeric order. Each one is repeatable, so running it twice changes nothing.

| File | Purpose |
|---|---|
| `001_add_user_identity.sql` | Creates the `user_identity` table. |
| `002_align_module_b_schema.sql` | Adds the Module B columns and the `specification_users` table that the backend expects. |
| `003_align_users_and_change_requests.sql` | Adds `users.region` and `users.is_active`, and creates `specification_change_request`. |

Take a backup first, then apply each file:

```powershell
# Backup (the file is created in your home folder)
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
docker exec postgres-dev sh -c 'pg_dump -U "$POSTGRES_USER" -d FirecrestDB -Fc -f /tmp/firecrest_backup.dump'
docker cp postgres-dev:/tmp/firecrest_backup.dump "$HOME\firecrest_backup_$stamp.dump"
docker exec postgres-dev sh -c 'pg_restore -l /tmp/firecrest_backup.dump' | Select-Object -First 5

# Apply a migration (repeat for 002 and 003)
Get-Content db\migrations\001_add_user_identity.sql -Raw | docker exec -i postgres-dev sh -c 'psql -U "$POSTGRES_USER" -d FirecrestDB -v ON_ERROR_STOP=1'
```

Each migration runs in a single transaction. If it reports an error, nothing was changed. A migration only adds columns and tables, but `002` and `003` also fill the new columns from existing data, and `002` converts `handoff_signoff.signoff_date` from a date to a timestamp. Read the comments at the top of each file before applying it to data you care about. To restore a backup, restore it into a new database with `pg_restore` rather than over the live one.

**Roles must match.** The role stored on an employee must be `Manager`, `Dev` or `SD` (case does not matter, and `Developer` is accepted for `Dev`). A row with another value, such as `Employee`, cannot be matched to any authentik group and the person will be refused with `role_mismatch`. Check with:

```powershell
docker exec postgres-dev sh -c 'psql -U "$POSTGRES_USER" -d FirecrestDB -c "SELECT id, name, role, manager_id FROM users ORDER BY id;"'
```

## 4. Link authentik users to employees

Signing in proves who someone is to authentik, but Firecrest must also know which employee they are. The link is a row in `user_identity` holding three values:

- `user_id`: the employee's `users.id`
- `issuer`: the OIDC issuer, `http://localhost:9000/application/o/firecrest/` locally
- `subject`: authentik's permanent identifier for the user (the token `sub` claim)

Matching is never done by name or email. The subject is different for every authentik user and is specific to your authentik installation, so each developer must link their own accounts. The database enforces that one identity maps to one employee and one employee has one identity.

To find a user's subject:

1. Start the backend and frontend (steps 5 and 6) and sign in as the test account. It will say the account is not linked. That is expected.
2. Do not click sign out yet. In that same browser tab (`http://localhost:5173`), open the browser developer tools, choose the Console and run:

   ```javascript
   const key = Object.keys(sessionStorage).find(k => k.startsWith("oidc.user:"));
   const token = JSON.parse(sessionStorage[key]).access_token;
   fetch("http://localhost:5281/auth/me", { headers: { Authorization: "Bearer " + token } })
     .then(r => r.json()).then(console.log);
   ```

   Change the port if your API is not on 5281. The result shows `subject`, `username` and `groups`. Check that the username and group are the account you meant before using the subject.
3. Link the account. Replace the placeholders. The guards make the statement insert nothing if the employee does not match what you expect:

   ```sql
   INSERT INTO user_identity (user_id, issuer, subject)
   SELECT id, 'http://localhost:9000/application/o/firecrest/', '<subject from step 2>'
     FROM users
    WHERE id = <employee id> AND role = '<Manager, Dev or SD>';
   ```

   Run it with:

   ```powershell
   docker exec -it postgres-dev psql -U <DB_USER> -d FirecrestDB
   ```

   then paste the statement. It reports `INSERT 0 1` on success. `INSERT 0 0` means the employee id or role did not match, so nothing was linked.
4. Sign out of Firecrest and sign in again. The app should now show the employee.

To remove a link: `DELETE FROM user_identity WHERE user_id = <employee id>;`. This does not affect the employee.

## 5. Run the backend

The API needs OIDC mode and a database connection. Open a PowerShell window in the repository root:

```powershell
cd backend
$env:Auth__Mode = "Oidc"
$env:ConnectionStrings__Database = "Host=localhost;Port=5432;Database=FirecrestDB;Username=<DB_USER>;Password=<DB_PASSWORD>"
dotnet run
```

Use the same `DB_USER` and `DB_PASSWORD` as the root `.env`. `dotnet run` listens on <http://localhost:5281> and starts in the `Development` environment, where Swagger is available at <http://localhost:5281/swagger>.

The authentication settings, as they are read by the API:

| Setting | Environment variable | Default | Meaning |
|---|---|---|---|
| `Auth:Mode` | `Auth__Mode` | `Prototype` | `Oidc` or `Prototype`. |
| `Auth:Oidc:Authority` | `Auth__Oidc__Authority` | `http://localhost:9000/application/o/firecrest/` in `appsettings.Development.json` | The authentik issuer URL. The API requires tokens whose issuer matches it exactly. |
| `Auth:Oidc:Audience` | `Auth__Oidc__Audience` | `firecrest-spa` in `appsettings.Development.json` | The required `aud` claim. authentik sets it to the client ID. |
| `Auth:Oidc:InternalBaseUrl` | `Auth__Oidc__InternalBaseUrl` | empty | Optional. Only for a backend that cannot reach authentik at the Authority address (see [Docker Compose](#docker-compose-limitation)). |

In `Oidc` mode the API refuses to start if the authority or audience is missing, if `InternalBaseUrl` is not a valid URL, or if `Auth:Mode` is not `Oidc` or `Prototype`. Authentication is checked on every request, and plain HTTP to authentik is accepted only in the `Development` environment.

When the API starts it also runs a background service that synchronises public holidays from an external website into the `public_holiday` table. Expect that table to change on a development database.

## 6. Run the frontend

Open a second PowerShell window in the repository root:

```powershell
cd frontend
npm install
Copy-Item .env.example .env
notepad .env
```

In `.env` set:

```
VITE_API_BASE_URL=http://localhost:5281
VITE_AUTH_MODE=oidc
```

The optional settings below default to the values authentik is configured with here, so they only need setting if you change ports or hostnames:

| Variable | Default |
|---|---|
| `VITE_OIDC_AUTHORITY` | `http://localhost:9000/application/o/firecrest/` |
| `VITE_OIDC_CLIENT_ID` | `firecrest-spa` |
| `VITE_OIDC_REDIRECT_URI` | `<current origin>/auth/callback` |
| `VITE_OIDC_POST_LOGOUT_REDIRECT_URI` | `<current origin>/` |

Then start it with `npm run dev` and open <http://localhost:5173>. The frontend must run on port 5173, because that address is registered in authentik. If you use another port, change the redirect URIs in `blueprints/firecrest.yaml` and reapply it.

## 7. Check that it works

1. Open <http://localhost:5173>. You should see a "Sign in with authentik" page.
2. Sign in as the manager test account. You should land on the dashboard showing the linked employee.
3. Sign in as an unlinked account. You should see "Your account is not linked to a Firecrest employee" and no data.
4. Log out. You should return to the Firecrest sign in page, and a new sign in should ask for credentials again.
5. Call the API without a token: `Invoke-WebRequest http://localhost:5281/admin/users`. It should fail with status 401.
6. Run the automated tests:

   ```powershell
   dotnet test Firecrest.slnx
   ```

   These tests use their own signing keys and databases. They do not need authentik or your database.

## Permissions

Roles come from the authentik group. A "direct report" is an employee whose `manager_id` is the manager. Anything not listed is refused. A refused request returns 401 when the token is missing or invalid, and 403 when the person is signed in but not permitted.

| Area | Manager | Developer | SD | Admin |
|---|---|---|---|---|
| Employees (read) | all | all | all | all |
| Employees (change) | add, edit and remove direct reports with role Dev or SD, never themselves | none | none | all |
| Public holidays | read | read | read | read, and re-sync |
| Shifts (read) | all | all | all | none |
| Shifts (change) | themselves and direct reports | none | none | none |
| Leave requests and balances (read) | own and direct reports | own | own | none |
| Leave requests (change) | approve or reject direct reports' requests, never their own; remove direct reports' requests | create own as pending addressed to their manager; cancel own pending | same as Developer | none |
| Leave balances (change) | direct reports, never themselves | none | none | none |
| Hours and payroll reports | own and direct reports | own | own | none |
| Projects, specifications, handoffs, change requests, signoffs (read) | all | all | all | all |
| Projects (change) | create, edit, delete | none | create | switch active or inactive only |
| Specifications (change) | create, update, delete | update | create, update | none |
| Specification assignments | manage | none | manage | none |
| Handoffs | none | submit, resubmit, launch, ask for changes, withdraw | review and test statuses | none |
| Handoff signoffs | none | none | create, edit and remove their own | none |
| Change requests | remove | raise as themselves and resolve | same as Developer | none |
| Dev days and handoff delays | manage | none | none | none |

The role in authentik must also match the role stored on the employee. An admin may have no employee row and then has no employee-level access.

## Local development and production

This guide sets up local development. The values below are for a developer machine only and must change before any shared or production use.

| | Local development (this guide) | Production |
|---|---|---|
| authentik | `compose.yml` on `localhost:9000`, plain HTTP | a hardened authentik installation behind HTTPS on a real hostname, with backups and secrets from a secret manager |
| Authority | `http://localhost:9000/application/o/firecrest/` | an `https://` URL. Plain HTTP metadata is accepted only in the `Development` environment |
| `Auth:Mode` | `Oidc` (or `Prototype` for a throwaway demo) | `Oidc` only. The API refuses to start with `Prototype` outside the `Development` environment |
| Redirect URIs | `http://localhost:5173/...` in `blueprints/firecrest.yaml` | the real frontend address, edited in the blueprint or the provider |
| Test accounts | `test-*` users with simple passwords | real users, real passwords or single sign on, and no test accounts |
| Secrets | `infra/authentik/.env`, ignored by Git | environment variables or a secret store, never committed |
| Database | local container, `appsettings.Development.json` connection string | managed database with its own credentials |
| CORS | the API allows only `http://localhost:5173` (set in `backend/Program.cs`) | must be changed in code to the real frontend origin before deployment |

**Prototype mode is for development only.** It uses fixed accounts defined in `frontend/src/auth/authUsers.js` and the API trusts every request. Anyone who can reach an API in Prototype mode can read and change all data. Do not use it for any deployment or shared environment.

## Docker Compose limitation

The root `docker-compose.yml` starts PostgreSQL and the backend, but it contains no authentication settings. The backend container therefore starts in `Prototype` mode (it runs in the `Development` environment), so the container does not enforce authentik sign in. For OIDC development, run PostgreSQL with Compose and run the backend with `dotnet run`, as in step 5.

To run the backend container in OIDC mode you must add the settings yourself. The container cannot reach authentik at `localhost:9000`, because inside a container `localhost` is the container itself, while the tokens name `localhost:9000` as their issuer. `Auth:Oidc:InternalBaseUrl` solves this: the API keeps `Authority` as the public address and sends only its download of the discovery document and signing keys to the internal address, so the issuer is still checked exactly. A local override file is a convenient place, because `docker-compose.override.yml` is ignored by Git:

```yaml
services:
  backend:
    environment:
      Auth__Mode: Oidc
      Auth__Oidc__Authority: http://localhost:9000/application/o/firecrest/
      Auth__Oidc__Audience: firecrest-spa
      Auth__Oidc__InternalBaseUrl: http://host.docker.internal:9000
    extra_hosts:
      - "host.docker.internal:host-gateway"
```

In this setup the API is at <http://localhost:5050>, so set `VITE_API_BASE_URL=http://localhost:5050` in the frontend `.env`. The internal address mechanism is covered by automated tests, but this container configuration has not been run end to end, so treat it as a starting point.

## Troubleshooting

**authentik does not start**

- `docker compose up` stops with "database password required" or "secret key required": `infra/authentik/.env` is missing or `PG_PASS` or `AUTHENTIK_SECRET_KEY` is empty.
- Port 9000 or 9443 is in use: set `COMPOSE_PORT_HTTP` and `COMPOSE_PORT_HTTPS` in `.env`. If you change the HTTP port, the issuer URL changes too, so update the Authority in the backend and frontend and the blueprint.
- The discovery URL returns 404: the blueprint has not been applied. Check `docker compose logs worker`. To apply it manually, run `docker compose exec worker ak apply_blueprint custom/firecrest.yaml` from `infra/authentik`.

**Sign in problems**

- authentik shows `invalid_request` or "redirect URI mismatch": the frontend is not on `http://localhost:5173`, or the blueprint was not applied. The redirect URI must match exactly.
- You are signed in as the wrong user and cannot switch: authentik keeps its own browser session. Log out of authentik (<http://localhost:9000/if/user/>), then sign in again.
- After logout you land on an authentik page instead of Firecrest: the logout return address `http://localhost:5173/` is missing from the provider. Reapply the blueprint.
- "The API is not in OIDC mode": the frontend has `VITE_AUTH_MODE=oidc` but the API is in `Prototype` mode. Start the API with `$env:Auth__Mode = "Oidc"`.
- "The Firecrest API could not be reached": the API is not running, or `VITE_API_BASE_URL` points at the wrong port.
- The browser reports a CORS error: the frontend is not on port 5173. The API allows only that origin.

**The API returns 401**

- The token is missing, expired, or fails validation. Common causes are an `Auth:Oidc:Authority` that does not exactly match the token issuer (including the trailing slash), an `Auth:Oidc:Audience` that is not `firecrest-spa`, or an API that cannot download authentik's keys. Check that authentik is running and, if the API runs in Docker, see [Docker Compose limitation](#docker-compose-limitation).
- Every request returns 401 after a long idle time: the token has expired (it lasts about an hour). Sign in again.

**The API returns 403**

The response body has an `error` code:

| Code | Meaning |
|---|---|
| `identity_not_linked` | No `user_identity` row matches the token's issuer and subject. See step 4. |
| `role_mismatch` | The authentik group does not match the role stored on the employee. See step 3. |
| `no_application_role` | The user is not in any `firecrest-*` group. |
| `ambiguous_application_roles` | The user is in more than one `firecrest-*` group. |
| `admin_not_permitted`, `not_permitted` and similar | The role is not allowed to do that. See the permissions table. |

**The API will not start**

The message names the problem: `Auth:Mode 'Prototype' is only allowed in the Development environment`, `Auth:Oidc:Authority must be set`, `Auth:Oidc:Audience must be set`, `Unknown Auth:Mode`, or `Auth:Oidc:InternalBaseUrl must be an absolute http or https URL`.

**Database errors**

- `column ... does not exist` (for example `users.is_active`, `users.region` or `project.client`) or `relation "user_identity" does not exist`: an existing database has not had the migrations applied. See step 3.
- Module B endpoints return 500: the same cause. Apply `002` and `003`.
- `init.sql` changes do not appear: it runs only when the data volume is empty. Apply the migration files instead of recreating a database that has data you need.
- `INSERT 0 0` when linking: the employee id or role in the statement did not match. Check the `users` table.

## Stopping and restarting

```powershell
cd infra\authentik
docker compose stop      # stop, keeping all data
docker compose up -d     # start again
```

authentik's data lives in the `firecrest-authentik_database` Docker volume and in `infra/authentik/data`. Do not run `docker compose down -v` or `docker volume prune` unless you intend to delete every authentik user and setting.
