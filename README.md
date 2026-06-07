# Surakshya Backend

NestJS backend for Surakshya. The application uses PostgreSQL, Redis, JWT
authentication, and email notifications.

## Requirements

For the Docker setup:

- Docker Desktop
- Docker Compose

For local development:

- Node.js 20 or newer
- pnpm 10
- PostgreSQL
- Redis

## Environment Setup

Create a `.local.env` file in the project root for local development:

```env
# PostgreSQL
DB_HOST=localhost
DB_PORT=5433
DB_USERNAME=postgres
DB_PASSWORD=your_database_password
DB_NAME=surakshya
DB_SYNC=true

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Hosted services (optional; preferred when set)
DATABASE_URL=
REDIS_URL=
DB_SSL=false
DB_LOGGING=false

# JWT
JWT_ACCESS_SECRET=your_access_token_secret
JWT_REFRESH_SECRET=your_refresh_token_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Email
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=your_email_username
MAIL_PASSWORD=your_email_password
MAIL_FROM=noreply@example.com
```

Use strong, private values for the JWT secrets and passwords. Do not commit
environment files.

Environment loading works as follows:

- Local development loads `.local.env`, then falls back to `.env`.
- Production ignores local files and uses variables injected by the hosting
  platform.
- Docker Compose injects `.local.env` and changes the database and Redis
  hosts to their Compose service names.

## Run With Docker Compose

Docker Compose builds the backend and starts the complete stack:

- Backend: `http://localhost:3000`
- PostgreSQL: `localhost:5433`
- Redis: `localhost:6379`

Build and start all services:

```bash
docker compose up --build
```

Run them in the background:

```bash
docker compose up -d --build
```

Check service status:

```bash
docker compose ps
```

Follow backend logs:

```bash
docker compose logs -f backend
```

Stop the services:

```bash
docker compose down
```

Stop the services and delete PostgreSQL and Redis data:

```bash
docker compose down -v
```

The Compose project is named `surakshya`, so Docker Desktop groups the
backend, PostgreSQL, and Redis containers together.

## Build And Run The Docker Image Manually

Build the multi-stage production image:

```bash
docker build -t surakshya-backend .
```

When running the image outside Compose, PostgreSQL and Redis must already be
available. Start the container with the environment file:

```bash
docker run --name surakshya-backend \
  --env-file .local.env \
  -p 3000:3000 \
  surakshya-backend
```

When the database and Redis are other Docker containers, place all containers
on the same Docker network and use their container or service names for
`DB_HOST` and `REDIS_HOST`.

Do not use `localhost` for PostgreSQL or Redis from inside the backend
container. Inside a container, `localhost` refers to that same container.

Stop and remove the manually started container:

```bash
docker rm -f surakshya-backend
```

## Run Locally

Install dependencies:

```bash
pnpm install
```

Start PostgreSQL and Redis with Docker:

```bash
docker compose up -d postgres redis
```

Start the NestJS development server with file watching:

```bash
pnpm run start:dev
```

The API is available at `http://localhost:3000`.

## Production Build

Compile the application:

```bash
pnpm run build
```

Run the compiled application:

```bash
pnpm run start:prod
```

## Tests And Code Quality

```bash
# Unit tests
pnpm test

# End-to-end tests
pnpm run test:e2e

# Test coverage
pnpm run test:cov

# Lint and automatically fix supported issues
pnpm run lint

# Format source and test files
pnpm run format
```

## Docker Networking

Inside Docker Compose, services communicate using service names:

```text
Backend -> postgres:5432
Backend -> redis:6379
```

From the host machine, use the published ports:

```text
PostgreSQL -> localhost:5433
Redis      -> localhost:6379
Backend    -> localhost:3000
```

## Deploy On Render

Create three Render resources in the same region:

1. A PostgreSQL database.
2. A Key Value instance.
3. A Docker web service connected to this repository.

In the web service environment settings, add:

```env
DATABASE_URL=<Render PostgreSQL internal URL>
REDIS_URL=<Render Key Value internal URL>
DB_SYNC=true
DB_SSL=false
JWT_ACCESS_SECRET=<strong secret>
JWT_REFRESH_SECRET=<strong secret>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

Also add the required `MAIL_*` variables. Render provides `PORT`
automatically, and the application listens on that value.

Use the internal database and Key Value URLs when all three resources are in
the same Render region. If an external PostgreSQL URL is required, set
`DB_SSL=true`.

This project does not have database migrations yet, so `DB_SYNC=true` is
needed for a new database. Add migrations and change it to `false` before
using the service for important production data.
