# Firecrest-Capstone-Project-
Cross-Team Scheduling and Delivery Management System
# CI Test
# Testing GitHub Actions CI
# Testing GitHub Actions CI 2
# Testing GitHub Actions CI 3


# Authentication Setup
Firecrest signs users in with [authentik](https://goauthentik.io/) using OpenID Connect. The React app redirects to authentik to sign in, and the ASP.NET Core API accepts only access tokens issued by authentik. Employees are linked to authentik users in the `user_identity` table, and the authentik group (`firecrest-manager`, `firecrest-developer`, `firecrest-sd` or `firecrest-admin`) decides the role.

The full step-by-step guide is in [`infra/authentik/README.md`](infra/authentik/README.md). It covers starting authentik with Docker, creating test accounts, applying the database migrations in `db/migrations`, linking employees, the required environment variables, the permissions for each role, and troubleshooting.

In short, for local development:

1. Start authentik from `infra/authentik` with `docker compose up -d` after creating its `.env` file from `.env.example`.
2. Apply the database migrations if your database was created before authentication was added.
3. Start the API with `$env:Auth__Mode = "Oidc"` and start the frontend with `VITE_AUTH_MODE=oidc` (see `frontend/.env.example`).

Prototype mode (fixed accounts in the frontend and no token checks in the API) is for local development only and must not be used for any deployment. The root `docker-compose.yml` does not configure authentik, so its backend container runs in Prototype mode. See the guide for the settings needed to change this.

# Database Setup
The database runs in a Docker container keeping it the same across systems and making it easy to move to AWS later on.

To start up the ddocker container you must first have Docker Desktop running on your system with a root `.env` file containing `DB_USER` and `DB_PASSWORD` as the `docker-compose.yml` uses those values as the username and password for logging into the database.


## Start the container
From the root of the project, run in the terminal:

```bash
docker compose up -d
```

This terminal command will start up the docker container for the Postgre SQL database using `db/init.sql` to create the tables and currently seed some basic data for testing the tables.

## Stop the container
To stop the database container without deleting stored data, run:

```bash
docker compose down
```

If you need to reset the database and re-run the init script, remove the volume as well:

```bash
docker compose down -v
```

## Log in to the database
You can open the database within the termianl which allows you to query and look at the data within the database by using the following command:

```bash
docker exec -it postgres-dev psql -U <DB_USER> -d FirecrestDB
```

Replace `<DB_USER>` with the value you put in the `.env` file at setup

## Query the database
After logging in, you can now run SQL queries directly in `psql`, such as:

```sql
SELECT * FROM users;
SELECT * FROM shift;
SELECT * FROM leave_request;
```

Some more example queries where you can see details about someone such as their shifts are:

```sql
SELECT *
FROM users u
JOIN shift s ON s.user_id = u.id
WHERE u.name = 'Terry';
```

You can also run a query without opening an interactive shell with the above commands by using this:

```bash
docker exec -it postgres-dev psql -U <DB_USER> -d FirecrestDB -c "SELECT * FROM users;"
```

# Exit the Database
Type exit into the terminal whilst logged in to stop typing queries and go back to the terminal, then type docker compose down as to not leave it running on your system whilst not in use.

# Backend Startup
Type the following into terminal and it'll start up

```bash
docker compose up --build
```

## Accessing the backend
To access Swagger which allows visuals / updates over the api go to

```
http://localhost:5050/swagger/index.html
```

## Backend Take Down
This shuts down the backend

```bash
docker compose down -v
```